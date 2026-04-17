// ============================================================================
// REMINDER PROCESSOR (Background Job)
// ============================================================================

import { db, VisitReminderJob } from '../db';
import { sendNotification } from './notification-router';
import { getReminderTemplate } from './reminder-scheduler';
import { addTimelineEvent } from '../timeline';

/**
 * Process all due reminders
 */
export async function processReminders(): Promise<{
    processed: number;
    successful: number;
    failed: number;
}> {
    const dueJobs = db.visitReminderJobs.findDue();

    let processed = 0;
    let successful = 0;
    let failed = 0;

    for (const job of dueJobs) {
        try {
            await processReminderJob(job);
            processed++;
            successful++;
        } catch (error) {
            console.error(`Failed to process reminder job ${job.id}:`, error);
            processed++;
            failed++;
        }
    }

    return { processed, successful, failed };
}

/**
 * Process a single reminder job
 */
async function processReminderJob(job: VisitReminderJob): Promise<void> {
    // Get booking and lead
    const booking = db.bookings.findById(job.visit_id);
    if (!booking) {
        db.visitReminderJobs.update(job.id, {
            status: 'failed',
            last_error: 'Booking not found',
            attempt_count: job.attempt_count + 1
        });
        return;
    }

    // Skip if booking is cancelled or completed
    if (booking.status === 'cancelled' || booking.status === 'no_show') {
        db.visitReminderJobs.update(job.id, {
            status: 'failed',
            last_error: 'Booking cancelled/no-show',
            attempt_count: job.attempt_count + 1
        });
        return;
    }

    const lead = db.leads.findById(booking.leadId);
    if (!lead) {
        db.visitReminderJobs.update(job.id, {
            status: 'failed',
            last_error: 'Lead not found',
            attempt_count: job.attempt_count + 1
        });
        return;
    }

    // Get project info
    const project = booking.projectId ? db.projects.findById(booking.projectId) : null;

    // Get reminder message
    const template = getReminderTemplate(job.type, booking, lead, project);

    // Send notification with fallback
    const result = await sendNotification(
        {
            userId: lead.id,
            phone: lead.phone || lead.primaryPhone,
            email: lead.email
        },
        template.message,
        template.subject,
        {
            respectQuietHours: job.type !== 't2', // Don't respect quiet hours for T-2 (urgent)
            maxAttempts: 3
        }
    );

    if (result.success) {
        // Mark as sent
        db.visitReminderJobs.update(job.id, {
            status: 'sent',
            sent_at: new Date().toISOString(),
            channel_used: result.channel,
            attempt_count: job.attempt_count + 1
        });

        // Update booking reminders_sent
        const currentReminders = booking.reminders_sent || {};
        db.bookings.update(booking.id, {
            reminders_sent: {
                ...currentReminders,
                [job.type]: true
            }
        });

        // Log to timeline
        addTimelineEvent({
            leadId: lead.id,
            type: 'visit_reminder_sent',
            summary: `${job.type.toUpperCase()} reminder sent via ${result.channel}`,
            actor: 'system',
            payload: {
                booking_id: booking.id,
                reminder_type: job.type,
                channel: result.channel
            }
        });
    } else {
        // Check if we should retry
        const maxRetries = 3;
        if (job.attempt_count < maxRetries) {
            // Retry later (reschedule for 15 minutes from now)
            const retryTime = new Date();
            retryTime.setMinutes(retryTime.getMinutes() + 15);

            db.visitReminderJobs.update(job.id, {
                scheduled_at: retryTime.toISOString(),
                last_error: result.error,
                attempt_count: job.attempt_count + 1
            });
        } else {
            // Max retries reached, mark as failed
            db.visitReminderJobs.update(job.id, {
                status: 'failed',
                last_error: `Max retries reached. Last error: ${result.error}`,
                attempt_count: job.attempt_count + 1
            });

            // Log failure to timeline
            addTimelineEvent({
                leadId: lead.id,
                type: 'visit_reminder_failed',
                summary: `Failed to send ${job.type.toUpperCase()} reminder after ${maxRetries} attempts`,
                actor: 'system',
                payload: {
                    booking_id: booking.id,
                    reminder_type: job.type,
                    error: result.error
                }
            });
        }
    }
}

/**
 * Get reminder processing stats
 */
export function getReminderStats(): {
    pending: number;
    sent_today: number;
    failed_today: number;
    due_next_hour: number;
} {
    const allJobs = db.visitReminderJobs.findAll();
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);

    return {
        pending: allJobs.filter(j => j.status === 'pending').length,
        sent_today: allJobs.filter(j =>
            j.status === 'sent' &&
            j.sent_at &&
            new Date(j.sent_at) >= todayStart
        ).length,
        failed_today: allJobs.filter(j =>
            j.status === 'failed' &&
            new Date(j.createdAt) >= todayStart
        ).length,
        due_next_hour: allJobs.filter(j =>
            j.status === 'pending' &&
            new Date(j.scheduled_at) <= nextHour
        ).length
    };
}
