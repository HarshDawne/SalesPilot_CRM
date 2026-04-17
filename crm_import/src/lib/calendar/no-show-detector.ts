// ============================================================================
// NO-SHOW DETECTOR (Background Job)
// ============================================================================

import { db, Booking } from '../db';
import { addTimelineEvent } from '../timeline';
import { sendNotification } from './notification-router';

/**
 * Detect and mark no-shows
 */
export async function detectNoShows(): Promise<{
    detected: number;
    marked: number;
}> {
    const now = new Date();
    let detected = 0;
    let marked = 0;

    // Find all confirmed or in_progress bookings
    const candidates = db.bookings.findAll().filter(booking =>
        (booking.status === 'confirmed' || booking.status === 'in_progress')
    );

    for (const booking of candidates) {
        const endTime = new Date(booking.slotEnd);

        // Get project-specific grace period or use default
        let graceMinutes = 30; // default
        if (booking.projectId) {
            const projectConfig = db.projectAvailability.findByProjectId(booking.projectId);
            if (projectConfig?.no_show_grace_minutes) {
                graceMinutes = projectConfig.no_show_grace_minutes;
            }
        }

        const gracePeriodEnd = new Date(endTime.getTime() + graceMinutes * 60000);

        // Check if grace period has passed
        if (now > gracePeriodEnd) {
            detected++;

            // Only mark as no-show if not checked in
            if (booking.status === 'confirmed') {
                await markAsNoShow(booking);
                marked++;
            }
        }
    }

    return { detected, marked };
}

/**
 * Mark a booking as no-show
 */
async function markAsNoShow(booking: Booking): Promise<void> {
    // Update booking status
    db.bookings.update(booking.id, {
        status: 'no_show',
        version: (booking.version || 0) + 1,
        meta: {
            ...booking.meta,
            no_show_detected_at: new Date().toISOString(),
            no_show_detected_by: 'system'
        }
    });

    // Log to timeline
    addTimelineEvent({
        leadId: booking.leadId,
        type: 'visit_no_show',
        summary: 'Visit marked as no-show (customer did not check in)',
        actor: 'system',
        payload: {
            booking_id: booking.id,
            scheduled_time: booking.slotStart,
            grace_period_end: new Date(new Date(booking.slotEnd).getTime() + 30 * 60000).toISOString()
        }
    });

    // Notify agent
    const agentId = booking.agent_id || booking.assignedTo;
    if (agentId) {
        const agent = db.users.findById(agentId);
        const lead = db.leads.findById(booking.leadId);

        if (agent && lead) {
            await sendNotification(
                {
                    userId: agentId,
                    phone: agent.email, // Use email for agent notifications
                    email: agent.email
                },
                `No-show detected: ${lead.firstName} ${lead.lastName} did not check in for visit scheduled at ${new Date(booking.slotStart).toLocaleString()}`,
                'Visit No-Show Alert',
                { respectQuietHours: false }
            );
        }
    }

    // Trigger follow-up automation
    await triggerNoShowFollowup(booking);
}

/**
 * Trigger follow-up automation for no-shows
 */
async function triggerNoShowFollowup(booking: Booking): Promise<void> {
    const lead = db.leads.findById(booking.leadId);
    if (!lead) return;

    // Send follow-up message to lead
    const message = `Hi ${lead.firstName || 'there'}! We noticed you couldn't make it to your scheduled visit. We'd love to reschedule at a time that works better for you. Please reply with your preferred date and time, or call us directly.`;

    await sendNotification(
        {
            userId: lead.id,
            phone: lead.phone || lead.primaryPhone,
            email: lead.email
        },
        message,
        'Let\'s Reschedule Your Visit',
        { respectQuietHours: true }
    );

    // Log follow-up to timeline
    addTimelineEvent({
        leadId: lead.id,
        type: 'visit_no_show_followup',
        summary: 'No-show follow-up message sent',
        actor: 'system',
        payload: {
            booking_id: booking.id,
            message
        }
    });
}

/**
 * Get no-show statistics
 */
export function getNoShowStats(days: number = 30): {
    total_bookings: number;
    no_shows: number;
    no_show_rate: number;
    by_project: Record<string, { total: number; no_shows: number; rate: number }>;
} {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const bookings = db.bookings.findAll().filter(b =>
        new Date(b.createdAt) >= cutoffDate
    );

    const noShows = bookings.filter(b => b.status === 'no_show');

    // Calculate by project
    const byProject: Record<string, { total: number; no_shows: number; rate: number }> = {};

    for (const booking of bookings) {
        if (!booking.projectId) continue;

        if (!byProject[booking.projectId]) {
            byProject[booking.projectId] = { total: 0, no_shows: 0, rate: 0 };
        }

        byProject[booking.projectId].total++;
        if (booking.status === 'no_show') {
            byProject[booking.projectId].no_shows++;
        }
    }

    // Calculate rates
    for (const projectId in byProject) {
        const stats = byProject[projectId];
        stats.rate = stats.total > 0 ? (stats.no_shows / stats.total) * 100 : 0;
    }

    return {
        total_bookings: bookings.length,
        no_shows: noShows.length,
        no_show_rate: bookings.length > 0 ? (noShows.length / bookings.length) * 100 : 0,
        by_project: byProject
    };
}
