import { NextRequest, NextResponse } from 'next/server';
import { CampaignService } from '@/modules/communication/services/campaign.service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, leadIds, rules, propertyIds, context } = body;

        if (!name || !leadIds || leadIds.length === 0) {
            return NextResponse.json(
                { error: 'Missing required fields: name and leadIds' },
                { status: 400 }
            );
        }

        // Create campaign using Communication Engine 2.0 service
        const campaign = await CampaignService.create({
            name,
            type: 'launch', // Default type for new campaigns
            propertyIds: propertyIds || [],
            leadIds,
            context, // Pass campaign context
            rules: rules || {
                maxRetries: 3,
                retryDelayMinutes: 30,
                followUpEnabled: true,
                followUpDelayMinutes: 60,
                workingHoursOnly: false,
                workingHours: {
                    start: '09:00',
                    end: '18:00',
                    timezone: 'Asia/Kolkata'
                }
            }
        });

        return NextResponse.json({ campaign });

    } catch (error) {
        console.error('[API] Campaign creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create campaign' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const campaigns = await CampaignService.getAll();

        // Enrich campaigns with actual metrics from call records
        const { CallRecordService } = await import('@/modules/communication/services/call-record.service');

        const enrichedCampaigns = await Promise.all(campaigns.map(async (campaign) => {
            const records = await CallRecordService.getByCampaign(campaign.id);

            const attempted = records.length;
            const connected = records.filter(r => r.status === 'completed').length;
            const qualified = records.filter(r =>
                r.intent === 'interested' || r.intent === 'site_visit'
            ).length;

            return {
                ...campaign,
                processed: campaign.completedCalls + campaign.failedCalls,
                targetLeadCount: campaign.totalLeads,
                metrics: {
                    attempted: attempted,
                    connected: connected,
                    qualified: qualified,
                    cost: records.reduce((sum, r) => sum + (r.cost || 0), 0),
                    visitsBooked: records.filter(r => r.intent === 'site_visit').length
                }
            };
        }));

        return NextResponse.json({ campaigns: enrichedCampaigns });
    } catch (error) {
        console.error('[API] Failed to fetch campaigns:', error);
        return NextResponse.json(
            { error: 'Failed to fetch campaigns' },
            { status: 500 }
        );
    }
}
