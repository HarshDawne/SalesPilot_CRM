import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CAMPAIGNS_FILE = path.join(process.cwd(), 'data', 'campaigns.json');

function readCampaigns() {
    const data = fs.readFileSync(CAMPAIGNS_FILE, 'utf-8');
    return JSON.parse(data);
}

function writeCampaigns(data: any) {
    fs.writeFileSync(CAMPAIGNS_FILE, JSON.stringify(data, null, 2));
}

// GET /api/campaigns/:id
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const data = readCampaigns();
        const requestedId = params.id.trim();

        // console.log(`Requested ID: '${requestedId}'`);

        const campaign = data.campaigns.find((c: any) => c.campaignId === requestedId);

        if (!campaign) {
            return NextResponse.json({
                error: 'Campaign not found',
                requestedId: requestedId,
                availableIds: data.campaigns.map((c: any) => c.campaignId)
            }, { status: 404 });
        }

        return NextResponse.json(campaign);
    } catch (error: any) {
        console.error('Error reading campaign:', error);
        return NextResponse.json({
            error: 'Failed to read campaign',
            details: error.message
        }, { status: 500 });
    }
}

// POST /api/campaigns/:id/actions
export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const body = await request.json();
        const { action } = body; // pause, resume, stop

        const data = readCampaigns();
        const campaign = data.campaigns.find((c: any) => c.campaignId === params.id);

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        switch (action) {
            case 'pause':
                campaign.status = 'PAUSED';
                break;
            case 'resume':
                campaign.status = 'RUNNING';
                break;
            case 'stop':
                campaign.status = 'STOPPED';
                break;
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        campaign.updatedAt = new Date().toISOString();
        writeCampaigns(data);

        return NextResponse.json(campaign);
    } catch (error) {
        console.error('Error updating campaign:', error);
        return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
    }
}
