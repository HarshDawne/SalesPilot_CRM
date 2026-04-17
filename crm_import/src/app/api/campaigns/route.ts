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

// GET /api/campaigns
export async function GET(request: NextRequest) {
    try {
        const data = readCampaigns();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error reading campaigns:', error);
        return NextResponse.json({ campaigns: [] });
    }
}

// POST /api/campaigns
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const data = readCampaigns();

        const newCampaign = {
            campaignId: `camp_${Date.now()}`,
            name: body.name,
            status: 'QUEUED',
            targetLeadCount: body.targetLeadCount || 0,
            processed: 0,
            filterSpec: body.filterSpec || {},
            callingWindow: body.callingWindow || {},
            attemptPolicy: body.attemptPolicy || {},
            scriptId: body.scriptId || '',
            visitAutoBooking: body.visitAutoBooking || false,
            visitSettings: body.visitSettings || {},
            fallbackChannels: body.fallbackChannels || [],
            metrics: {
                attempts: 0,
                connected: 0,
                qualified: 0,
                visitsBooked: 0
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        data.campaigns.push(newCampaign);
        writeCampaigns(data);

        // Start campaign simulation in background
        setTimeout(() => {
            startCampaignSimulation(newCampaign.campaignId);
        }, 1000);

        return NextResponse.json(newCampaign, { status: 201 });
    } catch (error) {
        console.error('Error creating campaign:', error);
        return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
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
