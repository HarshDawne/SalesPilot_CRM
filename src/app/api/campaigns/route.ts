import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CAMPAIGNS_FILE = path.join(process.cwd(), 'data', 'campaigns.json');

// Ensure data directory exists
function ensureDataDir() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(CAMPAIGNS_FILE)) {
        fs.writeFileSync(CAMPAIGNS_FILE, JSON.stringify({ campaigns: [] }, null, 2));
    }
}

function readCampaigns() {
    ensureDataDir();
    const data = fs.readFileSync(CAMPAIGNS_FILE, 'utf-8');
    return JSON.parse(data);
}

function writeCampaigns(data: any) {
    ensureDataDir();
    fs.writeFileSync(CAMPAIGNS_FILE, JSON.stringify(data, null, 2));
}

// GET /api/campaigns - List all campaigns
export async function GET(request: NextRequest) {
    try {
        const { CampaignService } = await import('@/modules/communication/services/campaign.service');
        const { SecurityUtils } = await import('@/modules/communication/utils/security.utils');

        const ip = request.headers.get('x-forwarded-for') || 'unknown';

        SecurityUtils.logApiUsage({
            endpoint: '/api/campaigns',
            method: 'GET',
            ip,
            statusCode: 200,
        });

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const type = searchParams.get('type');

        const campaigns = await CampaignService.getAll({
            status: status as any,
            type: type as any,
        });

        return NextResponse.json({ campaigns });
    } catch (error) {
        console.error('[API] Error fetching campaigns:', error);
        return NextResponse.json(
            { error: 'Failed to fetch campaigns' },
            { status: 500 }
        );
    }
}

// POST /api/campaigns - Create new campaign
export async function POST(request: NextRequest) {
    try {
        const { CampaignService } = await import('@/modules/communication/services/campaign.service');
        const { SecurityUtils } = await import('@/modules/communication/utils/security.utils');

        const ip = request.headers.get('x-forwarded-for') || 'unknown';

        const body = await request.json();

        const {
            name,
            type,
            propertyIds,
            leadIds,
            rules,
            scriptId,
        } = body;

        // Validate required fields
        if (!name || !type || !leadIds || leadIds.length === 0) {
            return NextResponse.json(
                { error: 'Missing required fields: name, type, leadIds' },
                { status: 400 }
            );
        }

        const campaign = await CampaignService.create({
            name,
            type,
            propertyIds: propertyIds || [],
            leadIds,
            rules: rules || {
                maxRetries: 3,
                retryDelayMinutes: 30,
                followUpEnabled: true,
                followUpDelayMinutes: 5,
                workingHoursOnly: false,
                workingHours: {
                    start: '09:00',
                    end: '18:00',
                    timezone: 'Asia/Kolkata',
                },
            },
            scriptId,
        });

        SecurityUtils.logApiUsage({
            endpoint: '/api/campaigns',
            method: 'POST',
            ip,
            statusCode: 201,
        });

        return NextResponse.json({ campaign }, { status: 201 });
    } catch (error) {
        console.error('[API] Error creating campaign:', error);
        return NextResponse.json(
            { error: 'Failed to create campaign' },
            { status: 500 }
        );
    }
}

// Background simulation function
async function startCampaignSimulation(campaignId: string) {
    const data = readCampaigns();
    const campaign = data.campaigns.find((c: any) => c.campaignId === campaignId);

    if (!campaign) return;

    // Update status to RUNNING
    campaign.status = 'RUNNING';
    writeCampaigns(data);

    // Simulate calls over time
    const totalLeads = campaign.targetLeadCount;
    const callsPerBatch = 5;
    const batchDelay = 3000; // 3 seconds between batches

    for (let i = 0; i < totalLeads; i += callsPerBatch) {
        await new Promise(resolve => setTimeout(resolve, batchDelay));

        // Read fresh data
        const freshData = readCampaigns();
        const freshCampaign = freshData.campaigns.find((c: any) => c.campaignId === campaignId);

        if (!freshCampaign || freshCampaign.status !== 'RUNNING') break;

        // Simulate batch of calls
        const batchSize = Math.min(callsPerBatch, totalLeads - i);

        for (let j = 0; j < batchSize; j++) {
            freshCampaign.metrics.attempts++;

            // 70% connect rate
            if (Math.random() < 0.7) {
                freshCampaign.metrics.connected++;

                // 65% qualification rate
                if (Math.random() < 0.65) {
                    freshCampaign.metrics.qualified++;

                    // 75% visit booking rate if auto-booking enabled
                    if (freshCampaign.visitAutoBooking && Math.random() < 0.75) {
                        freshCampaign.metrics.visitsBooked++;
                    }
                }
            }

            freshCampaign.processed++;
        }

        freshCampaign.updatedAt = new Date().toISOString();
        writeCampaigns(freshData);
    }

    // Mark as completed
    const finalData = readCampaigns();
    const finalCampaign = finalData.campaigns.find((c: any) => c.campaignId === campaignId);
    if (finalCampaign) {
        finalCampaign.status = 'COMPLETED';
        finalCampaign.updatedAt = new Date().toISOString();
        writeCampaigns(finalData);
    }
}
