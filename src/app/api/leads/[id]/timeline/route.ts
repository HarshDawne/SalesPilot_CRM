import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const leadId = id;
    const timeline = db.timeline.findByLeadId(leadId);

    return NextResponse.json(timeline);
}
