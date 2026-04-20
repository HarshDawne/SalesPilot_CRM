import { NextRequest, NextResponse } from 'next/server';
import { BolnaService } from '@/modules/communication/bolna-service';
import { db } from '@/lib/db';
import { normalizePhone } from '@/lib/phone-utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { leadIds } = body;

        if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
            return NextResponse.json({ error: "No leads provided" }, { status: 400 });
        }

        console.log(`[Dispatcher] Processing ${leadIds.length} leads for AI Call...`);

        // Get All Leads from DB
        const allLeads = db.leads.findAll();
        // Use loose comparison for IDs if needed, assuming strings for now
        const targetLeads = allLeads.filter((l: any) => leadIds.includes(l.id));

        console.log(`[Dispatcher] Found ${targetLeads.length} leads matching request`);

        const results: { leadId: string; success: boolean; error?: string; jobId?: string }[] = [];
        const jobsToSave: any[] = [];

        // Simple ID generator for this demo
        const generateId = () => `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Phone formatting handled by the shared normalizePhone utility

        for (const lead of targetLeads) {
            // Map db Lead to Bolna Lead
            const formattedPhone = normalizePhone(lead.primaryPhone || (lead as any).phone);

            const bolnaLead: any = {
                ...lead,
                phone: formattedPhone,
                source: lead.createdVia || lead.source || 'website',
                preferences: {
                    configuration: lead.qualification?.configurations || []
                }
            };

            const result = await BolnaService.initiateCall(lead.id, body.campaignId || 'unknown_campaign');
            const jobId = generateId();

            // Create job record
            const job = {
                id: jobId,
                // Assuming campaignId is passed in body, or we infer it. 
                // For now, let's grab it from body or use a default if missing for robustness in this demo
                campaignId: body.campaignId || 'unknown_campaign',
                executionId: result.data?.run_id || result.data?.execution_id || null, // Store Bolna ID
                leadId: lead.id,
                leadName: lead.name,
                phoneNumber: formattedPhone,
                status: result.success ? 'IN_PROGRESS' : 'FAILED',
                outcome: result.success ? null : 'FAILED_TO_INITIATE',
                attempts: 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                metadata: {
                    bolnaResponse: result.data || result.error
                }
            };

            jobsToSave.push(job);
            results.push({ leadId: lead.id, success: result.success, error: result.error || undefined, jobId });

            // Update Lead Stage if successful
            if (result.success) {
                // Ideally update stage to 'AI_Calling'
                // LeadService.updateStage(lead.id, 'AI_Calling'); 
            }
        }

        // Save jobs to file
        try {
            const fs = require('fs');
            const path = require('path');
            const JOBS_FILE = path.join(process.cwd(), 'data', 'jobs.json');

            let existingData = { jobs: [] };
            if (fs.existsSync(JOBS_FILE)) {
                existingData = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf-8'));
            }

            // cast existingData.jobs to any[] if needed, but in JS it's loose
            (existingData as any).jobs = [...(existingData as any).jobs, ...jobsToSave];
            fs.writeFileSync(JOBS_FILE, JSON.stringify(existingData, null, 2));
        } catch (err) {
            console.error("Failed to save jobs:", err);
            // Don't fail the request just because saving jobs failed
        }

        const successCount = results.filter(r => r.success).length;
        const failedCount = results.length - successCount;

        return NextResponse.json({
            message: `Dispatched ${successCount} calls. Failed: ${failedCount}`,
            results
        });

    } catch (error) {
        console.error("[Dispatcher] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
