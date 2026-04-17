import { NextRequest, NextResponse } from 'next/server';
import { buildCampaignContext } from '@/lib/property-context-builder';
import { CampaignSourceType } from '@/modules/communication/types/campaign.types';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sourceType, propertyId, towerIds, unitIds } = body;

        if (!sourceType) {
            return NextResponse.json({ error: 'Source type is required' }, { status: 400 });
        }

        const context = await buildCampaignContext({
            sourceType: sourceType as CampaignSourceType,
            propertyId,
            towerIds,
            unitIds
        });

        return NextResponse.json(context);
    } catch (error) {
        console.error('Failed to build campaign context:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
