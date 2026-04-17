// Campaign Stats API - Real-time metrics

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { CampaignService } = await import('@/modules/communication/services/campaign.service');
        const { CampaignLeadService } = await import('@/modules/communication/services/campaign-lead.service');
        const { CallRecordService } = await import('@/modules/communication/services/call-record.service');

        const campaign = await CampaignService.getById(id);

        if (!campaign) {
            return NextResponse.json(
                { error: 'Campaign not found' },
                { status: 404 }
            );
        }

        // Get lead state distribution
        const allLeads = await CampaignLeadService.getByCampaign(id);
        const stateDistribution = {
            queued: allLeads.filter(l => l.state === 'queued').length,
            calling: allLeads.filter(l => l.state === 'calling').length,
            completed: allLeads.filter(l => l.state === 'completed').length,
            failed: allLeads.filter(l => l.state === 'failed').length,
            retry_scheduled: allLeads.filter(l => l.state === 'retry_scheduled').length,
            stopped: allLeads.filter(l => l.state === 'stopped').length,
        };

        // Get call statistics
        const callStats = await CallRecordService.getCampaignStats(id);

        // Calculate progress percentage
        const totalLeads = campaign.totalLeads;
        const processedLeads = stateDistribution.completed + stateDistribution.failed + stateDistribution.stopped;
        const progress = totalLeads > 0 ? Math.round((processedLeads / totalLeads) * 100) : 0;

        // Get recent calls
        const recentCalls = await CallRecordService.getByCampaign(id);
        const last10Calls = recentCalls.slice(0, 10);

        return NextResponse.json({
            campaign,
            stateDistribution,
            callStats,
            progress,
            recentCalls: last10Calls,

            // Additional real-time metrics
            liveMetrics: {
                activeCallsNow: stateDistribution.calling,
                completionRate: totalLeads > 0 ? Math.round((stateDistribution.completed / totalLeads) * 100) : 0,
                failureRate: totalLeads > 0 ? Math.round((stateDistribution.failed / totalLeads) * 100) : 0,
                avgCallDuration: callStats.avgDuration,
                lastUpdated: new Date().toISOString(),
                campaignRuntime: campaign.startedAt ?
                    Math.floor((Date.now() - new Date(campaign.startedAt).getTime()) / 1000) : 0,
            },

            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[API] Error fetching campaign stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stats' },
            { status: 500 }
        );
    }
}
