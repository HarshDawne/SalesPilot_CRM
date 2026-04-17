import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

/**
 * GET /api/calendar/sla
 * Get calendar SLA metrics
 */
export async function GET(request: NextRequest) {
    // RBAC: manager, admin can view SLA
    const authError = await requireRole(request, ['manager', 'admin']);
    if (authError) return authError;

    const { searchParams } = request.nextUrl;
    const days = parseInt(searchParams.get('days') || '30');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get all leads qualified in the period
    const qualifiedLeads = db.leads.findAll().filter(lead => {
        if (lead.currentStage !== 'Qualified' && lead.currentStage !== 'Visit_Booked' && lead.currentStage !== 'Negotiation') {
            return false;
        }
        // Check if qualified recently (simplified - in production, track qualification timestamp)
        return new Date(lead.updatedAt) >= cutoffDate;
    });

    const bookings = db.bookings.findAll().filter(b =>
        new Date(b.createdAt) >= cutoffDate
    );

    // SLA 1: Visit scheduled within 48h of qualification
    let scheduled48h = 0;
    let scheduled48hBreaches: any[] = [];

    for (const lead of qualifiedLeads) {
        const leadBookings = bookings.filter(b => b.leadId === lead.id);

        if (leadBookings.length > 0) {
            const firstBooking = leadBookings.sort((a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            )[0];

            const qualifiedAt = new Date(lead.updatedAt); // Simplified
            const bookedAt = new Date(firstBooking.createdAt);
            const hoursDiff = (bookedAt.getTime() - qualifiedAt.getTime()) / (1000 * 60 * 60);

            if (hoursDiff <= 48) {
                scheduled48h++;
            } else {
                scheduled48hBreaches.push({
                    lead_id: lead.id,
                    lead_name: `${lead.firstName} ${lead.lastName}`,
                    qualified_at: qualifiedAt.toISOString(),
                    booked_at: bookedAt.toISOString(),
                    hours_delay: Math.round(hoursDiff)
                });
            }
        }
    }

    // SLA 2: Confirmation within 24h before visit
    let confirmed24h = 0;
    let confirmed24hBreaches: any[] = [];

    const upcomingBookings = bookings.filter(b => {
        const startTime = new Date(b.slotStart);
        return startTime > new Date() && b.status !== 'cancelled';
    });

    for (const booking of upcomingBookings) {
        const startTime = new Date(booking.slotStart);
        const now = new Date();
        const hoursUntilVisit = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntilVisit <= 24) {
            if (booking.status === 'confirmed' || booking.status === 'in_progress') {
                confirmed24h++;
            } else {
                confirmed24hBreaches.push({
                    booking_id: booking.id,
                    lead_id: booking.leadId,
                    visit_time: booking.slotStart,
                    hours_until_visit: Math.round(hoursUntilVisit),
                    current_status: booking.status
                });
            }
        }
    }

    // No-show rate
    const completedOrNoShow = bookings.filter(b =>
        b.status === 'completed' || b.status === 'no_show'
    );
    const noShows = bookings.filter(b => b.status === 'no_show');
    const noShowRate = completedOrNoShow.length > 0
        ? (noShows.length / completedOrNoShow.length) * 100
        : 0;

    // Reminder delivery rate
    const reminderJobs = db.visitReminderJobs.findAll().filter(j =>
        new Date(j.createdAt) >= cutoffDate
    );
    const sentReminders = reminderJobs.filter(j => j.status === 'sent');
    const reminderDeliveryRate = reminderJobs.length > 0
        ? (sentReminders.length / reminderJobs.length) * 100
        : 0;

    // Channel breakdown
    const channelStats = sentReminders.reduce((acc, job) => {
        const channel = job.channel_used || 'unknown';
        acc[channel] = (acc[channel] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
        period_days: days,
        sla_metrics: {
            scheduled_within_48h: {
                total_qualified: qualifiedLeads.length,
                scheduled_on_time: scheduled48h,
                rate: qualifiedLeads.length > 0
                    ? (scheduled48h / qualifiedLeads.length) * 100
                    : 0,
                breaches: scheduled48hBreaches.length,
                breach_details: scheduled48hBreaches.slice(0, 10) // Top 10
            },
            confirmed_within_24h: {
                total_upcoming: upcomingBookings.filter(b => {
                    const hoursUntil = (new Date(b.slotStart).getTime() - new Date().getTime()) / (1000 * 60 * 60);
                    return hoursUntil <= 24;
                }).length,
                confirmed_on_time: confirmed24h,
                rate: upcomingBookings.length > 0
                    ? (confirmed24h / upcomingBookings.filter(b => {
                        const hoursUntil = (new Date(b.slotStart).getTime() - new Date().getTime()) / (1000 * 60 * 60);
                        return hoursUntil <= 24;
                    }).length) * 100
                    : 0,
                breaches: confirmed24hBreaches.length,
                breach_details: confirmed24hBreaches.slice(0, 10)
            }
        },
        operational_metrics: {
            no_show_rate: Math.round(noShowRate * 10) / 10,
            total_no_shows: noShows.length,
            total_completed: completedOrNoShow.length,
            reminder_delivery_rate: Math.round(reminderDeliveryRate * 10) / 10,
            total_reminders_sent: sentReminders.length,
            total_reminders_scheduled: reminderJobs.length,
            reminder_by_channel: channelStats
        },
        summary: {
            total_bookings: bookings.length,
            total_qualified_leads: qualifiedLeads.length,
            avg_booking_rate: qualifiedLeads.length > 0
                ? Math.round((bookings.length / qualifiedLeads.length) * 100)
                : 0
        }
    });
}