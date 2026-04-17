import { NextRequest, NextResponse } from 'next/server';
import { db, Booking } from '@/lib/db';
import { getCurrentUser, requireRole } from '@/lib/auth';
import { addTimelineEvent } from '@/lib/timeline';
import { scheduleReminders } from '@/lib/calendar/reminder-scheduler';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/bookings/[id]/reschedule
 * Reschedule a booking to a new time
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    // RBAC: sales, manager, admin can reschedule
    const authError = await requireRole(request, ['sales', 'manager', 'admin']);
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();
    const { new_start_time, new_end_time, reason, create_new_booking = true } = body;

    if (!new_start_time || !new_end_time) {
        return NextResponse.json({
            error: 'new_start_time and new_end_time are required'
        }, { status: 400 });
    }

    const user = await getCurrentUser(request);
    const booking = db.bookings.findById(id);

    if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Can only reschedule confirmed or booked visits
    if (booking.status !== 'confirmed' && booking.status !== 'booked') {
        return NextResponse.json({
            error: 'Can only reschedule confirmed or booked visits',
            current_status: booking.status
        }, { status: 400 });
    }

    if (create_new_booking) {
        // Create new booking with new times
        const newBooking: Booking = {
            ...booking,
            id: uuidv4(),
            slotStart: new_start_time,
            slotEnd: new_end_time,
            status: 'confirmed',
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            meta: {
                ...booking.meta,
                rescheduled_from: booking.id,
                reschedule_reason: reason
            }
        };

        const created = db.bookings.create(newBooking);

        // Mark old booking as rescheduled
        db.bookings.update(id, {
            status: 'rescheduled',
            version: (booking.version || 0) + 1,
            meta: {
                ...booking.meta,
                rescheduled_to: created.id,
                reschedule_reason: reason,
                rescheduled_at: new Date().toISOString(),
                rescheduled_by: user?.id
            }
        });

        // Schedule reminders for new booking
        scheduleReminders(created);

        // Log to timeline
        addTimelineEvent({
            leadId: booking.leadId,
            type: 'visit_rescheduled',
            summary: `Visit rescheduled${reason ? `: ${reason}` : ''}`,
            actor: user?.id || 'system',
            payload: {
                old_booking_id: id,
                new_booking_id: created.id,
                old_time: booking.slotStart,
                new_time: new_start_time,
                reason
            }
        });

        return NextResponse.json({
            success: true,
            old_booking: booking,
            new_booking: created,
            message: 'Booking rescheduled successfully'
        });
    } else {
        // Update existing booking times
        const updated = db.bookings.update(id, {
            slotStart: new_start_time,
            slotEnd: new_end_time,
            version: (booking.version || 0) + 1,
            meta: {
                ...booking.meta,
                reschedule_history: [
                    ...(booking.meta?.reschedule_history || []),
                    {
                        from: booking.slotStart,
                        to: new_start_time,
                        at: new Date().toISOString(),
                        by: user?.id,
                        reason
                    }
                ]
            }
        });

        // Reschedule reminders
        const { rescheduleReminders } = await import('@/lib/calendar/reminder-scheduler');
        rescheduleReminders(id, new Date(new_start_time), new Date(new_end_time));

        // Log to timeline
        addTimelineEvent({
            leadId: booking.leadId,
            type: 'visit_time_updated',
            summary: `Visit time updated${reason ? `: ${reason}` : ''}`,
            actor: user?.id || 'system',
            payload: {
                booking_id: id,
                old_time: booking.slotStart,
                new_time: new_start_time,
                reason
            }
        });

        return NextResponse.json({
            success: true,
            booking: updated,
            message: 'Booking time updated successfully'
        });
    }
}
