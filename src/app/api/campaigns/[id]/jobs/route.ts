import { NextRequest, NextResponse } from 'next/server';
import { CallRecordService } from '@/modules/communication/services/call-record.service';
import { Lead } from '@/modules/leads/db';

// GET /api/campaigns/:id/jobs
// GET /api/campaigns/:id/jobs
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: campaignId } = await params;
    try {
        // 1. Fetch ALL Campaign Leads (Source of truth for the list)
        const { CampaignLeadService } = await import('@/modules/communication/services/campaign-lead.service');
        const campaignLeads = await CampaignLeadService.getByCampaign(campaignId);

        // 2. Fetch Call Records for details
        const records = await CallRecordService.getByCampaign(campaignId);
        const recordsMap = new Map(records.map(r => [r.campaignLeadId, r]));

        // 3. Merge Data to form the complete list
        const jobs = await Promise.all(campaignLeads.map(async (cl) => {
            const leadData = await Lead.getById(cl.leadId);
            const r = recordsMap.get(cl.id);

            // Determine status for UI
            let uiStatus = cl.state.toUpperCase();
            if (cl.state === 'calling') uiStatus = 'IN_PROGRESS';
            if (cl.state === 'retry_scheduled') uiStatus = 'RETRYING';
            if (r?.status) uiStatus = r.status.toUpperCase();

            return {
                id: cl.id, // Use CampaignLead ID as primary key for table
                campaignId: cl.campaignId,
                leadId: cl.leadId,
                leadName: leadData?.name || `Lead ${cl.leadId.slice(0, 8)}`,
                phoneNumber: leadData?.phone || leadData?.primaryPhone || r?.phoneNumber || "N/A",
                status: uiStatus,
                executionId: r?.executionId || cl.lastExecutionId,

                // Call details (if available)
                durationSeconds: r?.duration || 0,
                cost: (r?.cost ?? 0),
                createdAt: cl.createdAt,
                updatedAt: cl.updatedAt,

                // AI Data
                transcript: r?.transcript,
                summary: r?.summary,
                intent: r?.intent,
                sentiment: r?.sentiment,
                recordingUrl: r?.recordingUrl,
                outcome: r?.outcome || (cl.state === 'completed' ? 'completed' : undefined),

                // Metadata for Modal
                metadata: {
                    ...r?.metadata,
                    transcript: r?.transcript,
                    summary: r?.summary,
                    recordingUrl: r?.recordingUrl,
                    cost: r?.cost,
                    leadName: leadData?.name
                }
            };
        }));

        // Sort: Active/Calling first, then Recent, then Queued
        jobs.sort((a, b) => {
            if (a.status === 'IN_PROGRESS') return -1;
            if (b.status === 'IN_PROGRESS') return 1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });

        return NextResponse.json({ jobs });
    } catch (error: any) {
        console.error('Error reading jobs:', error);
        return NextResponse.json({
            error: 'Failed to read jobs',
            details: error.message
        }, { status: 500 });
    }
}
