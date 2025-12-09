// ============================================================================
// REMINDER SCHEDULER
// ============================================================================

import { db, VisitReminderJob, Booking } from '../db';
import { v4 as uuidv4 } from 'uuid';

/**
 * Schedule all reminders for a booking
 */
export function scheduleReminders(booking: Booking): VisitReminderJob[] {
    const jobs: VisitReminderJob[] = [];
    const startTime = new Date(booking.slotStart);

    // T-24 hours reminder
    const t24 = new Date(startTime);
    t24.setHours(t24.getHours() - 24);

    // Only schedule if in the future
    if (t24 > new Date()) {
        const t24Job: VisitReminderJob = {
            id: uuidv4(),
            visit_id: booking.id,
            type: 't24',
            scheduled_at: t24.toISOString(),
            status: 'pending',
            attempt_count: 0,
            createdAt: new Date().toISOString()
        };
        jobs.push(t24Job);
        db.visitReminderJobs.create(t24Job);
    }

    // T-2 hours reminder
    const t2 = new Date(startTime);
    t2.setHours(t2.getHours() - 2);

    if (t2 > new Date()) {
        const t2Job: VisitReminderJob = {
            id: uuidv4(),
            visit_id: booking.id,
            type: 't2',
            scheduled_at: t2.toISOString(),
            status: 'pending',
            attempt_count: 0,
            createdAt: new Date().toISOString()
        };
        jobs.push(t2Job);
        db.visitReminderJobs.create(t2Job);
    }

    // Post-visit feedback reminder (2 hours after visit end)
    const endTime = new Date(booking.slotEnd);
    const postVisit = new Date(endTime);
    postVisit.setHours(postVisit.getHours() + 2);

    const postJob: VisitReminderJob = {
        id: uuidv4(),
        visit_id: booking.id,
        type: 'post',
        scheduled_at: postVisit.toISOString(),
        status: 'pending',
        attempt_count: 0,
        createdAt: new Date().toISOString()
    };
    jobs.push(postJob);
    db.visitReminderJobs.create(postJob);

    return jobs;
}

/**
 * Reschedule reminders for a booking (when visit time changes)
 */
export function rescheduleReminders(bookingId: string, newStartTime: Date, newEndTime: Date): void {
    // Cancel existing pending reminders
    const existingJobs = db.visitReminderJobs.findByVisitId(bookingId);
    for (const job of existingJobs) {
        if (job.status === 'pending') {
            db.visitReminderJobs.update(job.id, { status: 'failed', last_error: 'Booking rescheduled' });
        }
    }

    // Create new reminders
    const booking = db.bookings.findById(bookingId);
    if (booking) {
        // Update booking times
        db.bookings.update(bookingId, {
            slotStart: newStartTime.toISOString(),
            slotEnd: newEndTime.toISOString()
        });

        // Schedule new reminders
        const updatedBooking = db.bookings.findById(bookingId);
        if (updatedBooking) {
            scheduleReminders(updatedBooking);
        }
    }
}

/**
 * Cancel all reminders for a booking
 */
export function cancelReminders(bookingId: string): void {
    const jobs = db.visitReminderJobs.findByVisitId(bookingId);
    for (const job of jobs) {
        if (job.status === 'pending') {
            db.visitReminderJobs.update(job.id, {
                status: 'failed',
                last_error: 'Booking cancelled'
            });
        }
    }
}

/**
 * Get reminder template based on type
 */
export function getReminderTemplate(
    type: 't24' | 't2' | 'post',
    booking: Booking,
    lead: any,
    project?: any
): { subject: string; message: string } {
    const visitDate = new Date(booking.slotStart).toLocaleString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const projectName = project?.name || 'our project';
    const leadName = lead.firstName || lead.name || 'there';

    switch (type) {
        case 't24':
            return {
                subject: 'Visit Reminder - Tomorrow',
                message: `Hi ${leadName}! This is a reminder about your site visit to ${projectName} scheduled for tomorrow at ${visitDate}. Looking forward to seeing you! Reply CONFIRM to confirm or RESCHEDULE if you need to change the time.`
            };

        case 't2':
            return {
                subject: 'Visit Starting Soon',
                message: `Hi ${leadName}! Your site visit to ${projectName} is starting in 2 hours at ${visitDate}. ${booking.meetingPoint ? `Meeting point: ${booking.meetingPoint}` : ''} See you soon!`
            };

        case 'post':
            return {
                subject: 'How was your visit?',
                message: `Hi ${leadName}! Thank you for visiting ${projectName} today. We'd love to hear your feedback! Please rate your experience and let us know if you have any questions.`
            };

        default:
            return {
                subject: 'Visit Reminder',
                message: `Hi ${leadName}! Reminder about your visit to ${projectName}.`
            };
    }
}
