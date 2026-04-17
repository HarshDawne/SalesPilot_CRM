import { NextRequest, NextResponse } from 'next/server';
import { db, Booking, Activity } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { scheduledAt, propertyId } = body;

        if (!scheduledAt) {
            return NextResponse.json(
                { error: 'Scheduled time is required' },
                { status: 400 }
            );
        }

        const lead = db.leads.findById(params.id);
        if (!lead) {
            return NextResponse.json(
                { error: 'Lead not found' },
                { status: 404 }
            );
        }

        // Create booking
        const booking: Booking = {
            id: uuidv4(),
            leadId: params.id,
            propertyId,
            scheduledAt,
            status: 'confirmed',
            createdAt: new Date().toISOString()
        };
        db.bookings.create(booking);

        // Update lead status to Visit Booked
        db.leads.update(params.id, { status: 'Visit Booked' });

        // Log booking activity
        const activity: Activity = {
            id: uuidv4(),
            leadId: params.id,
            type: 'booking',
            summary: `Visit booked for ${new Date(scheduledAt).toLocaleString()}`,
            createdAt: new Date().toISOString(),
            payload: booking
        };
        db.activities.create(activity);

        return NextResponse.json(booking, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { error: 'Invalid request body' },
            { status: 400 }
        );
    }
}
