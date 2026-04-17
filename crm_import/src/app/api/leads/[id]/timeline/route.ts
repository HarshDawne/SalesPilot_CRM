import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const leadId = params.id;
    const timeline = db.timeline.findByLeadId(leadId);

    return NextResponse.json(timeline);
}
