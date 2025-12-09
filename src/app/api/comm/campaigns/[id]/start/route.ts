import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    const authError = await requireRole(request, ['admin', 'manager']);
    if (authError) return authError;

    try {
        const { id } = await params;
        const campaign = db.campaigns.findById(id);

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        if (campaign.status === 'running' || campaign.status === 'completed') {
            return NextResponse.json({ error: 'Campaign already running or completed' }, { status: 400 });
        }

        // 1. Resolve Leads (Simulated query execution)
        // In real app, run query against DB
        let leads = [];
        if (Array.isArray(campaign.lead_query)) {
            // If explicit IDs
            leads = campaign.lead_query.map(lid => db.leads.findById(lid)).filter(l => l);
        } else {
            // If filter object (mock: fetch all for now or filter by tag)
            leads = db.leads.findAll();
        }

        // 2. Enqueue Jobs
        let jobCount = 0;
        for (const lead of leads) {
            // Idempotency Check: Don't create duplicate job for same campaign+lead
            const existingJobs = db.campaignJobs.findByCampaignId(id);
            const duplicate = existingJobs.find(j => j.leadId === lead.id);

            if (!duplicate) {
                db.campaignJobs.create({
                    id: uuidv4(),
                    campaignId: id,
                    leadId: lead.id,
                    status: 'pending',
                    attempt: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                jobCount++;
            }
        }

        // 3. Update Campaign Status
        db.campaigns.update(id, {
            status: 'running',
            metrics: { ...campaign.metrics, total: jobCount }
        });

        // 4. Trigger Processor (Async)
        // In real app, this happens via worker. Here we might trigger a background function or just let the worker poll.
        // For demo, we'll rely on the client or a separate cron to "tick" the processor.

        return NextResponse.json({
            success: true,
            message: `Campaign started with ${jobCount} jobs`,
            jobCount
        });

    } catch (error) {
        console.error('Start Campaign Error:', error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
