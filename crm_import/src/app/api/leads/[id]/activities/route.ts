import { NextRequest, NextResponse } from 'next/server';
import { db, Activity } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();

        if (!body.type || !body.summary) {
            return NextResponse.json(
                { error: 'Missing required fields' },
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

        const newActivity: Activity = {
            id: uuidv4(),
            leadId: params.id,
            type: body.type,
            summary: body.summary,
            createdAt: new Date().toISOString(),
            payload: body.payload
        };

        const createdActivity = db.activities.create(newActivity);

        // Update last contacted if it's an interaction
        if (['ai_call', 'whatsapp', 'manual_call'].includes(body.type)) {
            db.leads.update(params.id, { lastContactedAt: new Date().toISOString() });
        }

        return NextResponse.json(createdActivity, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { error: 'Invalid request body' },
            { status: 400 }
        );
    }
}
