// Campaign Leads API - Get all leads for a campaign

import { NextRequest, NextResponse } from 'next/server';
import { CampaignLeadService } from '@/modules/communication/services/campaign-lead.service';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get all campaign leads
        const leads = await CampaignLeadService.getByCampaign(id);

        return NextResponse.json({
            success: true,
            leads,
            count: leads.length,
        });

    } catch (error) {
        console.error('[Campaign Leads API] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
