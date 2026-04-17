
import { NextResponse } from 'next/server';
import { CampaignSyncService } from '@/modules/communication/services/campaign-sync.service';

export async function POST() {
    try {
        console.log('[API] Starting global campaign sync...');
        const result = await CampaignSyncService.syncAllCampaigns();

        return NextResponse.json({
            ...result
        });

    } catch (error: any) {
        console.error('[API] Global Sync error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to sync all campaigns' },
            { status: 500 }
        );
    }
}
