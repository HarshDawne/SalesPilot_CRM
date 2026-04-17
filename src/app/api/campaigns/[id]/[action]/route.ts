// Campaign Control API - Start, Pause, Resume, Stop

import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; action: string }> }
) {
    try {
        const { id, action } = await params;
        const { CampaignService } = await import('@/modules/communication/services/campaign.service');
        const { CampaignOrchestrator } = await import('@/modules/communication/services/orchestrator.service');
        const { Lead } = await import('@/modules/leads/db');
        const { SecurityUtils } = await import('@/modules/communication/utils/security.utils');

        const ip = request.headers.get('x-forwarded-for') || 'unknown';

        // Get campaign
        const campaign = await CampaignService.getById(id);

        if (!campaign) {
            return NextResponse.json(
                { error: 'Campaign not found' },
                { status: 404 }
            );
        }

        // Load lead data
        const { Lead: LeadDb } = await import('@/modules/leads/db');
        const leadDb = await LeadDb.getAll();
        const campaignLeads = leadDb.filter((l: any) => campaign.leadIds.includes(l.id));

        switch (action) {
            case 'start':
                await CampaignOrchestrator.startCampaign(id, campaignLeads);
                SecurityUtils.logApiUsage({
                    endpoint: `/api/campaigns/${id}/start`,
                    method: 'POST',
                    ip,
                    statusCode: 200,
                });
                return NextResponse.json({
                    success: true,
                    message: 'Campaign started',
                    campaign: await CampaignService.getById(id)
                });

            case 'pause':
                await CampaignOrchestrator.pauseCampaign(id);
                SecurityUtils.logApiUsage({
                    endpoint: `/api/campaigns/${id}/pause`,
                    method: 'POST',
                    ip,
                    statusCode: 200,
                });
                return NextResponse.json({
                    success: true,
                    message: 'Campaign paused',
                    campaign: await CampaignService.getById(id)
                });

            case 'resume':
                await CampaignOrchestrator.resumeCampaign(id, campaignLeads);
                SecurityUtils.logApiUsage({
                    endpoint: `/api/campaigns/${id}/resume`,
                    method: 'POST',
                    ip,
                    statusCode: 200,
                });
                return NextResponse.json({
                    success: true,
                    message: 'Campaign resumed',
                    campaign: await CampaignService.getById(id)
                });

            case 'stop':
                await CampaignOrchestrator.stopCampaign(id);
                SecurityUtils.logApiUsage({
                    endpoint: `/api/campaigns/${id}/stop`,
                    method: 'POST',
                    ip,
                    statusCode: 200,
                });
                return NextResponse.json({
                    success: true,
                    message: 'Campaign stopped',
                    campaign: await CampaignService.getById(id)
                });

            case 'sync':
                const { CampaignSyncService } = await import('@/modules/communication/services/campaign-sync.service');
                const syncResult = await CampaignSyncService.syncCampaign(id);
                SecurityUtils.logApiUsage({
                    endpoint: `/api/campaigns/${id}/sync`,
                    method: 'POST',
                    ip,
                    statusCode: 200,
                });
                return NextResponse.json({
                    ...syncResult,
                    campaign: await CampaignService.getById(id)
                });

            default:
                return NextResponse.json(
                    { error: `Invalid action: ${action}` },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('[API] Error controlling campaign:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
