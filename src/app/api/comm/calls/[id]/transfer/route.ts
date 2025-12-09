import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { addTimelineEvent } from '@/lib/timeline';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    // RBAC: Only agents/admins can accept transfers
    const authError = await requireRole(request, ['admin', 'sales', 'manager']);
    if (authError) return authError;

    try {
        const { id } = await params; // Call ID
        const body = await request.json();
        const { agent_id } = body;

        // 1. Find the active call (simulated)
        // In real app, check Redis/DB for active call status

        // 2. Signal Provider to Bridge Call
        // await dialer.bridgeCall(id, agent_phone);

        // 3. Log Transfer
        // Find lead ID from call ID (mock lookup)
        const leadId = 'mock_lead_id'; // In real app, fetch from DB using call ID

        addTimelineEvent({
            leadId: leadId,
            type: 'manual_call', // Reusing type
            summary: `Call transferred to agent ${agent_id}`,
            actor: agent_id,
            payload: {
                callId: id,
                action: 'transfer_accepted'
            }
        });

        return NextResponse.json({ success: true, message: 'Transfer initiated' });

    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
