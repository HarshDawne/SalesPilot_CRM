import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, requireRole } from '@/lib/auth';
import { addTimelineEvent } from '@/lib/timeline';

/**
 * POST /api/bookings/[id]/check-in
 * Check-in a customer for their visit (transition to in_progress)
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    // RBAC: sales, manager, admin can check-in
    const authError = await requireRole(request, ['sales', 'manager', 'admin']);
    if (authError) return authError;

    const { id } = await params;
    const user = await getCurrentUser(request);

    const booking = db.bookings.findById(id);
    if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Can only check-in confirmed bookings
    if (booking.status !== 'confirmed') {
        return NextResponse.json({
            error: 'Can only check-in confirmed bookings',
            current_status: booking.status
        }, { status: 400 });
    }

    // Transition to in_progress
    const updated = db.bookings.update(id, {
        status: 'in_progress',
        version: (booking.version || 0) + 1,
        meta: {
            ...booking.meta,
            checked_in_at: new Date().toISOString(),
            checked_in_by: user?.id || 'unknown'
        }
    });

    // Log to timeline
    addTimelineEvent({
        leadId: booking.leadId,
        type: 'visit_checked_in',
        summary: 'Customer checked in for visit',
        actor: user?.id || 'system',
        payload: {
            booking_id: id,
            checked_in_at: new Date().toISOString()
        }
    });

    return NextResponse.json({
        success: true,
        booking: updated,
        message: 'Customer checked in successfully'
    });
}
