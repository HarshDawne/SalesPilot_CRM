import { NextRequest, NextResponse } from 'next/server';
import { unitService } from '@/lib/property-service';
import { db } from '@/lib/db';
import { addTimelineEvent } from '@/lib/timeline';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: unitId } = await params;
        const { leadId, hours } = await request.json();

        if (!leadId) {
            return NextResponse.json(
                { success: false, error: 'leadId is required' },
                { status: 400 }
            );
        }

        const lead = db.leads.findById(leadId);
        if (!lead) {
            return NextResponse.json(
                { success: false, error: 'Lead not found' },
                { status: 404 }
            );
        }

        const unit = unitService.reserve(unitId, leadId, lead.name, hours || 48);
        if (!unit) {
            return NextResponse.json(
                { success: false, error: 'Unit not available for reservation' },
                { status: 400 }
            );
        }

        // Add timeline event
        addTimelineEvent({
            leadId,
            type: 'note_added',
            summary: `Unit ${unit.unitNumber} reserved`,
            actor: 'system',
            payload: {
                unitId: unit.id,
                propertyId: unit.propertyId,
                expiresAt: unit.reservation?.expiresAt,
            },
        });

        return NextResponse.json({ success: true, data: unit });
    } catch (error: unknown) {
        console.error('Error reserving unit:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to reserve unit' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: unitId } = await params;

        const unit = unitService.releaseReservation(unitId);
        if (!unit) {
            return NextResponse.json(
                { success: false, error: 'No active reservation found' },
                { status: 400 }
            );
        }

        // Add timeline event if there was a reservation
        if (unit.reservation?.leadId) {
            addTimelineEvent({
                leadId: unit.reservation.leadId,
                type: 'note_added',
                summary: `Unit ${unit.unitNumber} reservation released`,
                actor: 'system',
                payload: { unitId: unit.id },
            });
        }

        return NextResponse.json({ success: true, data: unit });
    } catch (error: unknown) {
        console.error('Error releasing reservation:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to release reservation' },
            { status: 500 }
        );
    }
}
