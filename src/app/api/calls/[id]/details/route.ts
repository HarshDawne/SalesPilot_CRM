import { NextRequest, NextResponse } from 'next/server';
import { CallRecordService } from '@/modules/communication/services/call-record.service';
import { VoiceService } from '@/modules/communication/voice-service';

// GET /api/calls/[id]/details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: callId } = await params;
    try {
        const record = await CallRecordService.getById(callId);

        if (!record) {
            return NextResponse.json({ error: "Call record not found" }, { status: 404 });
        }

        let liveDetails = null;
        if (record.executionId) {
            try {
                liveDetails = await VoiceService.getCallDetails(record.executionId);
            } catch (bolnaError) {
                console.warn(`[API] Failed to fetch live details for ${record.executionId}:`, bolnaError);
            }
        }

        return NextResponse.json({
            job: record,
            liveDetails
        });

    } catch (error: any) {
        console.error("Error fetching call details:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            details: error.message
        }, { status: 500 });
    }
}
