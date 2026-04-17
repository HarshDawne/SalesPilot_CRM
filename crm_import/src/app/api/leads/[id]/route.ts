import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const lead = db.leads.findById(params.id);

    if (!lead) {
        return NextResponse.json(
            { error: 'Lead not found' },
            { status: 404 }
        );
    }

    const activities = db.activities.findByLeadId(params.id);

    return NextResponse.json({
        ...lead,
        activities
    });
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const updatedLead = db.leads.update(params.id, body);

        if (!updatedLead) {
            return NextResponse.json(
                { error: 'Lead not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(updatedLead);
    } catch (error) {
        return NextResponse.json(
            { error: 'Invalid request body' },
            { status: 400 }
        );
    }
}
