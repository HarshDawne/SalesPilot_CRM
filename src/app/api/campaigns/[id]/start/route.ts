import { NextRequest, NextResponse } from 'next/server';
import { CampaignOrchestrator } from '@/modules/communication/services/orchestrator.service';
import { CampaignService } from '@/modules/communication/services/campaign.service';
import { LeadService } from '@/modules/leads/lead-service';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: campaignId } = await params;

        // Get campaign
        const campaign = await CampaignService.getById(campaignId);
        if (!campaign) {
            return NextResponse.json(
                { error: 'Campaign not found' },
                { status: 404 }
            );
        }

        // Fetch lead data for all leads in the campaign
        const leadData = await Promise.all(
            campaign.leadIds.map(leadId => LeadService.getLeadById(leadId))
        );

        // Filter out any null leads
        const validLeads = leadData.filter(lead => lead !== null);

        if (validLeads.length === 0) {
            return NextResponse.json(
                { error: 'No valid leads found for campaign' },
                { status: 400 }
            );
        }

        // Start campaign with orchestrator
        await CampaignOrchestrator.startCampaign(campaignId, validLeads);

        return NextResponse.json({
            success: true,
            message: `Campaign started with ${validLeads.length} leads`
        });

    } catch (error: any) {
        console.error('[API] Campaign start error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to start campaign' },
            { status: 500 }
        );
    }
}
