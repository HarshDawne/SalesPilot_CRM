import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// GET /api/campaigns/:id/calls
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const filePath = path.join(process.cwd(), 'data', 'call-jobs.json');
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        // Filter by campaign ID
        const campaignCalls = data.callJobs.filter(
            (call: any) => call.campaignId === params.id
        );

        return NextResponse.json(campaignCalls);
    } catch (error) {
        console.error('Error reading call jobs:', error);
        return NextResponse.json({ error: 'Failed to read call jobs' }, { status: 500 });
    }
}
