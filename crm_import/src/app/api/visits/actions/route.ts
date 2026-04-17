import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { addTimelineEvent } from '@/lib/timeline';
import { queueNotification } from '@/lib/notifications';

/**
 * Visit Booking & Rescheduling Endpoint
 * 
 * Handles:
 * - Booking confirmations
 * - Rescheduling
 * - Cancellations
 * - Automated notifications for all actions
 */

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { visitId, action, reason } = body;
        // action: 'confirm' | 'reschedule' | 'cancel' | 'reject'

        if (!visitId || !action) {
            return NextResponse.json(
                { error: 'visitId and action are required' },
                { status: 400 }
            );
        }

        const booking = db.bookings.findById(visitId);
        if (!booking) {
            return NextResponse.json(
                { error: 'Visit not found' },
                { status: 404 }
            );
        }

        const lead = db.leads.findById(booking.leadId);
        if (!lead) {
            return NextResponse.json(
                { error: 'Lead not found' },
                { status: 404 }
            );
        }

        let message = '';
        let notificationMessage = '';

        switch (action) {
            case 'confirm':
                // Update booking status
                db.bookings.update(visitId, {
                    status: 'confirmed'
                });

                // Update lead
                if (lead.visit) {
                    db.leads.update(lead.id, {
                        visit: {
                            ...lead.visit,
                            visitStatus: 'confirmed'
                        }
                    });
                }

                // Log timeline
                addTimelineEvent({
                    leadId: lead.id,
                    type: 'visit_booked',
                    summary: 'Visit confirmed by client',
                    actor: 'system',
                    payload: { visitId, action: 'confirmed' }
                });

                // Send confirmation notification
                await queueNotification({
                    leadId: lead.id,
                    channel: 'whatsapp',
                    recipient: lead.primaryPhone,
                    message: `Hi ${lead.name}, your visit is confirmed! We look forward to seeing you on ${new Date(booking.slotStart).toLocaleDateString()} at ${new Date(booking.slotStart).toLocaleTimeString()}. 🏡`,
                    metadata: { visitId, action: 'confirmed' }
                });

                message = 'Visit confirmed successfully';
                notificationMessage = 'Confirmation sent to client';
                break;

            case 'reschedule':
                const { newDateTime } = body;
                if (!newDateTime) {
                    return NextResponse.json(
                        { error: 'newDateTime is required for rescheduling' },
                        { status: 400 }
                    );
                }

                // Update booking
                db.bookings.update(visitId, {
                    slotStart: newDateTime,
                    slotEnd: new Date(new Date(newDateTime).getTime() + booking.duration * 60000).toISOString(),
                    status: 'confirmed'
                });

                // Update lead
                if (lead.visit) {
                    db.leads.update(lead.id, {
                        visit: {
                            ...lead.visit,
                            visitDateTime: newDateTime,
                            visitStatus: 'confirmed'
                        }
                    });
                }

                // Log timeline
                addTimelineEvent({
                    leadId: lead.id,
                    type: 'visit_rescheduled',
                    summary: `Visit rescheduled to ${new Date(newDateTime).toLocaleString()}`,
                    actor: 'system',
                    payload: { visitId, oldDateTime: booking.slotStart, newDateTime }
                });

                // Send reschedule notification
                await queueNotification({
                    leadId: lead.id,
                    channel: 'whatsapp',
                    recipient: lead.primaryPhone,
                    message: `Hi ${lead.name}, your visit has been rescheduled to ${new Date(newDateTime).toLocaleDateString()} at ${new Date(newDateTime).toLocaleTimeString()}. Reply YES to confirm. 📅`,
                    metadata: { visitId, action: 'rescheduled' }
                });

                message = 'Visit rescheduled successfully';
                notificationMessage = 'Reschedule notification sent to client';
                break;

            case 'cancel':
                // Update booking
                db.bookings.update(visitId, {
                    status: 'cancelled'
                });

                // Update lead - move back to Qualified
                db.leads.update(lead.id, {
                    currentStage: 'Qualified',
                    visit: undefined
                });

                // Log timeline
                addTimelineEvent({
                    leadId: lead.id,
                    type: 'visit_cancelled',
                    summary: `Visit cancelled. Reason: ${reason || 'Not specified'}`,
                    actor: 'system',
                    payload: { visitId, reason }
                });

                // Send cancellation notification
                await queueNotification({
                    leadId: lead.id,
                    channel: 'whatsapp',
                    recipient: lead.primaryPhone,
                    message: `Hi ${lead.name}, your visit scheduled for ${new Date(booking.slotStart).toLocaleDateString()} has been cancelled. ${reason ? `Reason: ${reason}` : ''} Please contact us to reschedule. 🙏`,
                    metadata: { visitId, action: 'cancelled', reason }
                });

                message = 'Visit cancelled successfully';
                notificationMessage = 'Cancellation notification sent to client';
                break;

            case 'reject':
                // Update booking
                db.bookings.update(visitId, {
                    status: 'cancelled'
                });

                // Update lead - move to Disqualified
                db.leads.update(lead.id, {
                    currentStage: 'Disqualified',
                    visit: undefined,
                    disqualification: {
                        reason: 'no_intent',
                        disqualifiedBy: 'manual',
                        notes: `Client rejected visit. ${reason || ''}`,
                        disqualifiedAt: new Date().toISOString()
                    }
                });

                // Log timeline
                addTimelineEvent({
                    leadId: lead.id,
                    type: 'visit_cancelled',
                    summary: `Visit rejected by client. Reason: ${reason || 'Not specified'}`,
                    actor: 'system',
                    payload: { visitId, reason, action: 'rejected' }
                });

                // Send acknowledgment
                await queueNotification({
                    leadId: lead.id,
                    channel: 'whatsapp',
                    recipient: lead.primaryPhone,
                    message: `Hi ${lead.name}, we've noted that you're not interested at this time. Thank you for your time. Feel free to reach out if you change your mind! 👍`,
                    metadata: { visitId, action: 'rejected' }
                });

                message = 'Visit rejected and lead disqualified';
                notificationMessage = 'Acknowledgment sent to client';
                break;

            default:
                return NextResponse.json(
                    { error: 'Invalid action. Must be: confirm, reschedule, cancel, or reject' },
                    { status: 400 }
                );
        }

        return NextResponse.json({
            success: true,
            message,
            notificationMessage,
            visitId,
            action
        });

    } catch (error) {
        console.error('Visit action error:', error);
        return NextResponse.json(
            { error: 'Failed to process visit action', details: String(error) },
            { status: 500 }
        );
    }
}
