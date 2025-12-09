import { NextRequest, NextResponse } from 'next/server';
import { db, Booking, VisitStatus } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { addTimelineEvent, logVisitBooked } from '@/lib/timeline';
import { sendVisitConfirmation } from '@/lib/notifications';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const leadId = searchParams.get('leadId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status') as VisitStatus | null;

    let bookings = db.bookings.findAll();

    if (leadId) {
        bookings = bookings.filter(b => b.leadId === leadId);
    }

    if (startDate && endDate) {
        bookings = db.bookings.findByDateRange(startDate, endDate);
    }

    if (status) {
        bookings = bookings.filter(b => b.status === status);
    }

    // Sort by slotStart
    bookings.sort((a, b) =>
        new Date(a.slotStart).getTime() - new Date(b.slotStart).getTime()
    );

    return NextResponse.json(bookings);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            leadId,
            projectId,
            projectName,
            unitId,
            dateTime,
            duration = 60,
            assignedAgentId,
            assignedAgentName,
            meetingPoint,
            mode = 'site_visit',
            visitType = 'first_visit'
        } = body;

        if (!leadId || !dateTime) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const lead = db.leads.findById(leadId);
        if (!lead) {
            return NextResponse.json(
                { error: "Lead not found" },
                { status: 404 }
            );
        }

        const visitId = uuidv4();
        const slotStart = new Date(dateTime).toISOString();
        const slotEnd = new Date(new Date(dateTime).getTime() + duration * 60000).toISOString();

        // Create booking
        const booking: Booking = {
            id: visitId,
            leadId,
            projectId,
            unitId,
            slotStart,
            slotEnd,
            duration,
            mode,
            status: 'confirmed',
            visitType,
            assignedTo: assignedAgentId,
            meetingPoint,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            reminderSent: false
        };

        const createdBooking = db.bookings.create(booking);

        // Update lead with visit data
        db.leads.update(leadId, {
            currentStage: 'Visit_Booked',
            visit: {
                visitId,
                visitStatus: 'confirmed',
                visitDateTime: slotStart,
                projectId,
                projectName,
                unitId,
                assignedAgentId,
                assignedAgentName,
                meetingPoint,
                confirmationSent: false,
                remindersSent: []
            }
        });

        // Log in timeline
        logVisitBooked(
            leadId,
            visitId,
            slotStart,
            projectName || 'Project',
            assignedAgentName
        );

        // Send confirmation notifications
        if (projectName && assignedAgentName && assignedAgentId) {
            await sendVisitConfirmation(lead, {
                projectName,
                date: new Date(slotStart).toLocaleDateString(),
                time: new Date(slotStart).toLocaleTimeString(),
                meetingPoint: meetingPoint || 'TBD',
                agentName: assignedAgentName,
                agentPhone: '+91 9876543210' // TODO: Get from agent data
            });

            // Update confirmation sent flag
            db.leads.update(leadId, {
                visit: {
                    ...lead.visit!,
                    confirmationSent: true
                }
            });
        }

        return NextResponse.json({
            status: "created",
            booking: createdBooking
        }, { status: 201 });

    } catch (error) {
        console.error("Visit booking error:", error);
        return NextResponse.json(
            { error: "ServerError", message: "Failed to create visit booking" },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { bookingId, updates } = body;

        if (!bookingId) {
            return NextResponse.json(
                { error: "Missing bookingId" },
                { status: 400 }
            );
        }

        const existingBooking = db.bookings.findById(bookingId);
        if (!existingBooking) {
            return NextResponse.json(
                { error: "Booking not found" },
                { status: 404 }
            );
        }

        const updatedBooking = db.bookings.update(bookingId, updates);

        // Log status changes in timeline
        if (updates.status && updates.status !== existingBooking.status) {
            const eventTypeMap: Record<string, any> = {
                'completed': 'visit_completed',
                'cancelled': 'visit_cancelled',
                'no_show': 'visit_no_show',
                'rescheduled': 'visit_rescheduled'
            };

            const eventType = eventTypeMap[updates.status] || 'note_added';

            addTimelineEvent({
                leadId: existingBooking.leadId,
                type: eventType,
                summary: `Visit ${updates.status}`,
                actor: "system",
                payload: { bookingId, previousStatus: existingBooking.status }
            });

            // Update lead stage if visit completed
            if (updates.status === 'completed') {
                db.leads.update(existingBooking.leadId, {
                    currentStage: 'Visit_Completed'
                });
            }
        }

        return NextResponse.json(updatedBooking);

    } catch (error) {
        console.error("Visit update error:", error);
        return NextResponse.json(
            { error: "ServerError", message: "Failed to update visit" },
            { status: 500 }
        );
    }
}
