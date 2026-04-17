import { NextRequest, NextResponse } from 'next/server';
import { db, Booking } from '@/lib/db';
import { validateTransition } from '@/lib/calendar/state-machine';
import { addTimelineEvent } from '@/lib/timeline';
import { getCurrentUser } from '@/lib/auth';
import { rescheduleReminders, cancelReminders } from '@/lib/calendar/reminder-scheduler';

/**
 * POST /api/bookings/[id]/transition
 * Transition a booking to a new status with validation
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { to_status, payload = {}, reason, version } = body;

        // Get current user
        const user = await getCurrentUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get booking
        const booking = db.bookings.findById(id);
        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Optimistic locking check
        if (version !== undefined && booking.version !== version) {
            return NextResponse.json({
                error: 'Conflict: Booking has been modified by another user',
                current_version: booking.version,
                your_version: version,
                current_booking: booking
            }, { status: 409 });
        }

        // Validate transition
        const validation = validateTransition(
            booking.status,
            to_status,
            payload,
            user.id,
            user.role
        );

        if (!validation.valid) {
            return NextResponse.json({
                error: 'Transition validation failed',
                details: validation.errors
            }, { status: 400 });
        }

        // Apply transition
        const updates: Partial<Booking> = {
            status: to_status,
            version: (booking.version || 0) + 1,
            updatedAt: new Date().toISOString(),
            meta: {
                ...booking.meta,
                last_transition: {
                    from: booking.status,
                    to: to_status,
                    at: new Date().toISOString(),
                    by: user.id,
                    reason
                },
                ...payload
            }
        };

        // Special handling for specific transitions
        if (to_status === 'completed') {
            updates.feedback = payload.feedback;
            updates.outcome = payload.outcome;
        }

        if (to_status === 'cancelled') {
            // Cancel all pending reminders
            cancelReminders(id);
        }

        if (to_status === 'rescheduled' && payload.new_start_time && payload.new_end_time) {
            // Reschedule reminders
            rescheduleReminders(
                id,
                new Date(payload.new_start_time),
                new Date(payload.new_end_time)
            );
        }

        // Update booking
        const updated = db.bookings.update(id, updates);

        if (!updated) {
            return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
        }

        // Log to timeline
        const lead = db.leads.findById(booking.leadId);
        addTimelineEvent({
            leadId: booking.leadId,
            type: `visit_${to_status}` as any,
            summary: `Visit ${to_status}${reason ? `: ${reason}` : ''}`,
            actor: user.id,
            payload: {
                booking_id: id,
                from_status: booking.status,
                to_status,
                ...payload
            }
        });

        return NextResponse.json({
            success: true,
            booking: updated,
            transition: {
                from: booking.status,
                to: to_status,
                by: user.name,
                at: new Date().toISOString()
            }
        });

    } catch (error: any) {
        console.error('Transition error:', error);
        return NextResponse.json({
            error: 'Failed to transition booking',
            details: error.message
        }, { status: 500 });
    }
}

/**
 * GET /api/bookings/[id]/transition
 * Get allowed transitions for a booking
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = await params;

    const booking = db.bookings.findById(id);
    if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const { getAllowedTransitions, STATUS_LABELS } = await import('@/lib/calendar/state-machine');
    const allowed = getAllowedTransitions(booking.status);

    return NextResponse.json({
        current_status: booking.status,
        allowed_transitions: allowed,
        labels: allowed.reduce((acc, status) => {
            acc[status] = STATUS_LABELS[status];
            return acc;
        }, {} as Record<string, string>)
    });
}
