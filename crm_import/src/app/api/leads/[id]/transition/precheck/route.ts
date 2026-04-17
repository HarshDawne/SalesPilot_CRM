import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateTransition } from '@/lib/statemachine';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { to_stage, payload, actor_id } = body;

        const lead = db.leads.findById(id);
        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        const user = db.users.findById(actor_id);
        const actorRole = user?.role || 'agent';

        const validation = validateTransition(lead, to_stage, payload || {}, actorRole);

        return NextResponse.json({
            allowed: validation.ok,
            errors: validation.errors,
            requiredFields: validation.requiredFields
        });

    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
