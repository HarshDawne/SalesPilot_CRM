// Campaign Status API - Real-time status polling

import { NextRequest, NextResponse } from 'next/server';
import { CampaignService } from '@/modules/communication/services/campaign.service';
import { CampaignLeadService } from '@/modules/communication/services/campaign-lead.service';
import { CallRecordService } from '@/modules/communication/services/call-record.service';
import { Lead } from '@/modules/leads/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get campaign
        const campaign = await CampaignService.getById(id);
        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        // Get all campaign leads
        const allLeads = await CampaignLeadService.getByCampaign(id);

        // Get current calling lead
        const callingLead = allLeads.find(l => l.state === 'calling');

        // Get completed leads
        const completedLeads = allLeads.filter(l => l.state === 'completed');
        const failedLeads = allLeads.filter(l => l.state === 'failed');

        // Calculate progress
        const totalLeads = allLeads.length;
        const processedLeads = completedLeads.length + failedLeads.length;
        const currentCallIndex = processedLeads + (callingLead ? 1 : 0);

        // Get current call details if calling
        let currentCallDetails = null;
        if (callingLead) {
            const lead = await Lead.getById(callingLead.leadId);
            const callRecords = await CallRecordService.getByExecutionId(callingLead.lastExecutionId || '');
            const latestRecord = callRecords.length > 0 ? callRecords[0] : null;

            currentCallDetails = {
                leadId: callingLead.leadId,
                leadName: lead?.name || 'Unknown',
                leadPhone: lead?.phone || 'Unknown',
                executionId: callingLead.lastExecutionId,
                status: 'calling',
                attemptCount: callingLead.attemptCount,
                callRecord: latestRecord,
            };
        }

        // Get last completed call details
        let lastCompletedCall = null;
        if (completedLeads.length > 0 || failedLeads.length > 0) {
            const lastProcessed = [...completedLeads, ...failedLeads]
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

            if (lastProcessed) {
                const lead = await Lead.getById(lastProcessed.leadId);
                const callRecords = await CallRecordService.getByExecutionId(lastProcessed.lastExecutionId || '');
                const latestRecord = callRecords.length > 0 ? callRecords[0] : null;

                lastCompletedCall = {
                    leadId: lastProcessed.leadId,
                    leadName: lead?.name || 'Unknown',
                    leadPhone: lead?.phone || 'Unknown',
                    executionId: lastProcessed.lastExecutionId,
                    status: lastProcessed.state,
                    callRecord: latestRecord,
                    outcome: latestRecord?.outcome || lastProcessed.state,
                };
            }
        }

        return NextResponse.json({
            success: true,
            campaign: {
                id: campaign.id,
                name: campaign.name,
                status: campaign.status,
            },
            progress: {
                total: totalLeads,
                processed: processedLeads,
                current: currentCallIndex,
                completed: completedLeads.length,
                failed: failedLeads.length,
                queued: allLeads.filter(l => l.state === 'queued').length,
            },
            currentCall: currentCallDetails,
            lastCompletedCall,
        });

    } catch (error) {
        console.error('[Campaign Status API] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
