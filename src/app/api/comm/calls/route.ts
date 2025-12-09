import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { MockAdapter } from '@/lib/comm/adapters/mock-adapter';
import { addTimelineEvent } from '@/lib/timeline';
import { v4 as uuidv4 } from 'uuid';

// In a real app, this would be injected or loaded based on config
const dialer = new MockAdapter();

export async function POST(request: NextRequest) {
    // 1. RBAC Check
    const authError = await requireRole(request, ['admin', 'manager', 'sales']);
    if (authError) return authError;

    try {
        const body = await request.json();
        const { lead_id, agent_id, script_id, mode, voice_id } = body;
        const actor_id = request.headers.get('x-user-id') || 'system';

        // 2. Validate Request
        if (!lead_id || !script_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const lead = db.leads.findById(lead_id);
        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        // 3. Idempotency Check (Simple implementation using leadId + scriptId + recent time window could be added here)
        // For now, we rely on the client sending a unique request or just allowing multiple calls.
        // Real implementation would check a cache for `Idempotency-Key` header.

        // 4. Create Call Activity (Queued)
        const callActivity = db.activities.create({
            id: uuidv4(),
            leadId: lead_id,
            type: 'call_initiated',
            summary: `Outbound ${mode || 'ai'} call initiated`,
            createdAt: new Date().toISOString(),
            metadata: {
                agent_id,
                script_id,
                mode,
                voice_id
            },
            payload: {
                status: 'queued'
            }
        });

        // 5. Trigger Dialer (Async in real world, awaited here for simplicity or use background job)
        // In a real production system, we would enqueue this to a job queue (Redis/Bull)
        // Here we call the adapter directly.

        const { providerCallId } = await dialer.dial({
            id: callActivity.id,
            leadId: lead_id,
            phoneNumber: lead.primaryPhone,
            scriptId: script_id,
            voiceId: voice_id
        });

        // 6. Update Activity with Provider ID
        // Note: In our JSON DB, we can't easily update activity payload without a full read-write, 
        // but let's assume we can or just log a timeline event.

        addTimelineEvent({
            leadId: lead_id,
            type: 'ai_call_attempt',
            summary: `Call initiated via provider`,
            actor: actor_id,
            payload: {
                activityId: callActivity.id,
                providerCallId,
                mode
            }
        });

        return NextResponse.json({
            success: true,
            callId: callActivity.id,
            providerCallId
        });

    } catch (error) {
        console.error('Call Error:', error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
