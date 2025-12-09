import { NextRequest, NextResponse } from "next/server";
import { db, Activity } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { realtimeEvents } from "@/lib/realtime";

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { status, reason } = body;

        if (!status) {
            return NextResponse.json(
                { error: 'Status is required' },
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

        const oldStatus = lead.status;

        // Update lead status
        db.leads.update(params.id, { status });

        // Emit real-time event
        realtimeEvents.emitLeadStatusChanged(params.id, oldStatus, status);

        // Log status change activity
        const activity: Activity = {
            id: uuidv4(),
            leadId: params.id,
            type: 'status_change',
            summary: `Status changed: ${oldStatus} → ${status}`,
            createdAt: new Date().toISOString(),
            payload: { oldStatus, newStatus: status, reason }
        };
        db.activities.create(activity);

        // Emit activity added event
        realtimeEvents.emitActivityAdded(activity);

        // Emit metrics update
        realtimeEvents.emitMetricsUpdated();

        return NextResponse.json({ success: true, status });
    } catch (error) {
        return NextResponse.json(
            { error: 'Invalid request body' },
            { status: 400 }
        );
    }
}
