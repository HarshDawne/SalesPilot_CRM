import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
    try {
        const dbPath = path.join(process.cwd(), 'data', 'db.json');
        if (!fs.existsSync(dbPath)) {
            return NextResponse.json({ activity: [] });
        }

        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8').replace(/^\uFEFF/, ''));
        
        // Combine call logs into a pulse format
        const activity = (db.callLogs || []).map((call: any) => ({
            id: call.id,
            leadId: call.leadId,
            leadName: call.leadName || 'System Process',
            status: call.status.toUpperCase(),
            outcome: call.metadata?.summary || call.intent || 'Completed',
            metadata: {
                transcript: call.metadata?.transcript,
                summary: call.metadata?.summary,
                recordingUrl: call.metadata?.recordingUrl
            },
            cost: call.cost,
            durationSeconds: call.duration,
            phoneNumber: call.phoneNumber,
            intent: call.intent,
            sentiment: call.sentiment
        })).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json({ activity });
    } catch (error) {
        console.error('[Pulse API] Error:', error);
        return NextResponse.json({ activity: [] });
    }
}
