import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { addTimelineEvent } from '@/lib/timeline';
import { MockAdapter } from '@/lib/comm/adapters/mock-adapter';

const dialer = new MockAdapter();

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const headers = request.headers;

        // 1. Verify Signature
        if (!dialer.verifyWebhookSignature(headers, body)) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const { provider_call_id, status, recording_url, transcript, lead_id } = body;

        // 2. Find associated CallActivity (if possible, or just log)
        // In a real app, we'd look up the call by provider_call_id. 
        // For now, we assume lead_id is passed in metadata or we just log to timeline.

        if (lead_id) {
            // Update Timeline
            let eventType = 'ai_call_attempt';
            if (status === 'connected') eventType = 'ai_call_connected';
            if (status === 'completed') eventType = 'ai_call_connected'; // or completed
            if (status === 'failed') eventType = 'ai_call_failed';

            addTimelineEvent({
                leadId: lead_id,
                type: eventType as any,
                summary: `Call ${status}: ${provider_call_id}`,
                actor: 'system',
                payload: {
                    provider_call_id,
                    status,
                    recording_url,
                    transcript
                }
            });

            // Update Call Log entity
            db.callLogs.create({
                id: provider_call_id, // Use provider ID as ID or generate new
                leadId: lead_id,
                provider: 'mock',
                callSid: provider_call_id,
                status,
                attempt: 1, // Need to track attempts
                transcriptUrl: transcript ? 'text' : undefined, // Simplify
                summaryText: transcript,
                recordingUrl: recording_url,
                createdAt: new Date().toISOString()
            });
        }

        return NextResponse.json({ received: true });

    } catch (error: any) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: error.message || 'Server Error', stack: error.stack }, { status: 500 });
    }
}
