import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

/**
 * GET /api/calendar/conflicts
 * Get all unresolved booking conflicts
 */
export async function GET(request: NextRequest) {
    // RBAC: manager, admin can view conflicts
    const authError = await requireRole(request, ['manager', 'admin']);
    if (authError) return authError;

    const conflicts = db.visitConflicts.findPending();

    // Enrich with booking details
    const enrichedConflicts = conflicts.map(conflict => {
        const bookingA = db.bookings.findById(conflict.booking_a);
        const bookingB = db.bookings.findById(conflict.booking_b);
        const leadA = bookingA ? db.leads.findById(bookingA.leadId) : null;
        const leadB = bookingB ? db.leads.findById(bookingB.leadId) : null;

        return {
            ...conflict,
            booking_a_details: bookingA ? {
                id: bookingA.id,
                lead_name: leadA ? `${leadA.firstName} ${leadA.lastName}` : 'Unknown',
                time: bookingA.slotStart,
                status: bookingA.status,
                agent_id: bookingA.agent_id || bookingA.assignedTo
            } : null,
            booking_b_details: bookingB ? {
                id: bookingB.id,
                lead_name: leadB ? `${leadB.firstName} ${leadB.lastName}` : 'Unknown',
                time: bookingB.slotStart,
                status: bookingB.status,
                agent_id: bookingB.agent_id || bookingB.assignedTo
            } : null
        };
    });

    return NextResponse.json({
        total: enrichedConflicts.length,
        conflicts: enrichedConflicts
    });
}

/**
 * POST /api/calendar/conflicts/[id]/resolve
 * Resolve a conflict
 */
export async function POST(
    request: NextRequest
) {
    // RBAC: Only admin/manager can resolve conflicts
    const authError = await requireRole(request, ['admin', 'manager']);
    if (authError) return authError;

    const body = await request.json();
    const { id, resolution, resolved_by, action } = body;

    const conflict = db.visitConflicts.findById(id);
    if (!conflict) {
        return NextResponse.json({ error: 'Conflict not found' }, { status: 404 });
    }

    // Apply resolution action
    if (action === 'cancel_booking_a') {
        db.bookings.update(conflict.booking_a, { status: 'cancelled' });
    } else if (action === 'cancel_booking_b') {
        db.bookings.update(conflict.booking_b, { status: 'cancelled' });
    } else if (action === 'reschedule_booking_a') {
        db.bookings.update(conflict.booking_a, { status: 'rescheduled' });
    } else if (action === 'reschedule_booking_b') {
        db.bookings.update(conflict.booking_b, { status: 'rescheduled' });
    }

    // Mark conflict as resolved
    const updated = db.visitConflicts.update(id, {
        status: 'resolved',
        resolved_by,
        resolution
    });

    return NextResponse.json({
        success: true,
        conflict: updated
    });
}
