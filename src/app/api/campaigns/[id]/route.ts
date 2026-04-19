import { NextRequest, NextResponse } from 'next/server';
import { CampaignService } from '@/modules/communication/services/campaign.service';
import fs from 'fs';
import path from 'path';

// Helper to keep older db.json and campaigns.json in sync
async function syncOlderStores(id: string, updates: any, isDelete: boolean = false) {
    const dbPath = path.join(process.cwd(), 'data', 'db.json');
    const v1Path = path.join(process.cwd(), 'data', 'campaigns.json');

    [dbPath, v1Path].forEach(filePath => {
        if (fs.existsSync(filePath)) {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
            const campaigns = data.campaigns || [];
            
            if (isDelete) {
                // Cascading delete across stores
                data.campaigns = campaigns.filter((c: any) => !(c.id === id || c.campaignId === id));
                // Optional: also clear from callLogs if desired
                if (data.callLogs) {
                    data.callLogs = data.callLogs.filter((l: any) => l.campaignId !== id);
                }
            } else {
                const index = campaigns.findIndex((c: any) => (c.id === id || c.campaignId === id));
                if (index !== -1) {
                    campaigns[index] = { ...campaigns[index], ...updates, updatedAt: new Date().toISOString() };
                }
            }
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        }
    });
}

// GET /api/campaigns/:id
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const campaign = await CampaignService.getById(id);
        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }
        return NextResponse.json(campaign);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch campaign', details: error.message }, { status: 500 });
    }
}

// PATCH /api/campaigns/:id - Partial update (e.g., name)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();
        const campaign = await CampaignService.update(id, body);
        
        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        // Sync with legacy stores
        await syncOlderStores(id, body);

        return NextResponse.json(campaign);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to update campaign', details: error.message }, { status: 500 });
    }
}

// POST /api/campaigns/:id/actions
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const { action } = await request.json();
        let campaign: any;

        switch (action) {
            case 'start':
            case 'resume':
                campaign = await CampaignService.start(id);
                break;
            case 'pause':
                campaign = await CampaignService.pause(id);
                break;
            case 'stop':
                campaign = await CampaignService.complete(id);
                break;
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        await syncOlderStores(id, { status: campaign.status });
        return NextResponse.json(campaign);
    } catch (error: any) {
        return NextResponse.json({ error: 'Action failed', details: error.message }, { status: 500 });
    }
}
// DELETE /api/campaigns/:id
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        // 1. Attempt primary deletion (v2)
        const primarySuccess = await CampaignService.delete(id);

        // 2. ALWAYS attempt legacy sync/cleanup (v1 and db.json)
        // This ensures that even if it's missing from v2, its remnants are scrubbed
        await syncOlderStores(id, null, true);

        return NextResponse.json({ 
            success: true, 
            message: 'Campaign cleanup completed successfully',
            primaryCleared: primarySuccess 
        });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to delete campaign', details: error.message }, { status: 500 });
    }
}
