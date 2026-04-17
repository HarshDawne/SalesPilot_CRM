import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateTransition } from '@/lib/state-machine';
import { addTimelineEvent } from '@/lib/timeline';

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const { to_stage, actor_id, reason, payload, version } = await request.json();

        // 1. Validate Input
        if (!to_stage || !actor_id) {
            return NextResponse.json(
                { error: 'Validation Error', message: 'Missing required fields: to_stage, actor_id' },
                { status: 400 }
            );
        }

        // 2. Fetch Lead
        const lead = db.leads.findById(id);
        if (!lead) {
            return NextResponse.json(
                { error: 'Not Found', message: 'Lead not found' },
                { status: 404 }
            );
        }

        // 3. Optimistic Locking
        if (version !== undefined && lead.version !== version) {
            return NextResponse.json(
                {
                    error: 'Conflict',
                    message: 'Lead has been modified by another user. Please refresh and try again.',
                    current_version: lead.version,
                    latest_data: lead
                },
                { status: 409 }
            );
        }

        // 4. Validate Transition
        // Mock actor role for now - in real app, get from session/token
        const user = db.users.findById(actor_id);
        const actorRole = user?.role || 'agent'; // Default to agent

        const validation = validateTransition(lead, to_stage, payload || {}, actorRole);

        if (!validation.ok) {
            return NextResponse.json(
                {
                    error: 'Validation Error',
                    message: 'Transition validation failed',
                    details: validation.errors
                },
                { status: 400 }
            );
        }

        // 5. Apply Updates
        const updates: any = {
            currentStage: to_stage,
        };

        if (to_stage === 'Visit_Booked') {
            updates.visit = { ...lead.visit, ...payload, visitDateTime: payload.visit_date };
        } else if (to_stage === 'Visit_Completed') {
            updates.visitFeedback = { ...lead.visitFeedback, ...payload };
        } else if (to_stage === 'Negotiation') {
            updates.proposal = { ...lead.proposal, ...payload };
        } else if (to_stage === 'Booking_Done') {
            updates.booking = { ...lead.booking, ...payload };
        } else if (to_stage === 'Disqualified') {
            updates.disqualification = { ...lead.disqualification, ...payload };
        }

        const updatedLead = db.leads.update(id, updates);

        // 6. Create Timeline Event
        addTimelineEvent({
            leadId: id,
            type: 'stage_changed',
            summary: `Stage changed to ${to_stage}`,
            actor: actor_id,
            payload: {
                from: lead.currentStage,
                to: to_stage,
                reason,
                data: payload
            }
        });

        return NextResponse.json({
            success: true,
            data: updatedLead
        });

    } catch (error) {
        console.error('Transition Error:', error);
        return NextResponse.json(
            { error: 'Server Error', message: 'Failed to process transition' },
            { status: 500 }
        );
    }
}
