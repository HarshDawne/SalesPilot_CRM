import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// GET /api/campaigns/:id/calls
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const filePath = path.join(process.cwd(), 'data', 'call-jobs.log'); // Note: was call-jobs.json, checking...
        // Wait, the file in Step 644 said call-jobs.json. Let's stick to what's in the file.
        const filePathActual = path.join(process.cwd(), 'data', 'call-jobs.json');
        const data = JSON.parse(fs.readFileSync(filePathActual, 'utf8'));

        // Filter by campaign ID
        const campaignCalls = data.callJobs.filter(
            (call: any) => call.campaignId === id
        );

        return NextResponse.json(campaignCalls);
    } catch (error) {
        console.error('Error reading call jobs:', error);
        return NextResponse.json({ error: 'Failed to read call jobs' }, { status: 500 });
    }
}
