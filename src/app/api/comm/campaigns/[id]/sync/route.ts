import { NextRequest, NextResponse } from 'next/server';
import { CampaignSyncService } from '@/modules/communication/services/campaign-sync.service';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: campaignId } = await params;

        const result = await CampaignSyncService.syncCampaign(campaignId);

        return NextResponse.json({
            success: true,
            message: result.message,
            syncCount: result.syncCount
        });

    } catch (error: any) {
        console.error('[API] Sync error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to sync campaign data' },
            { status: 500 }
        );
    }
}
