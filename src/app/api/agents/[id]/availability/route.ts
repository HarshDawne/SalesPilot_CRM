import { NextRequest, NextResponse } from 'next/server';
import { db, AgentAvailability } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/agents/[id]/availability
 * Get agent's availability rules
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const availability = db.agentAvailability.findByAgentId(id);
    return NextResponse.json(availability);
}

/**
 * POST /api/agents/[id]/availability
 * Set/update agent availability
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    // RBAC: Only admin/manager can set availability
    const authError = await requireRole(request, ['admin', 'manager']);
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();

    const newAvailability: AgentAvailability = {
        id: uuidv4(),
        agent_id: id,
        day_of_week: body.day_of_week,
        date: body.date,
        start_time: body.start_time,
        end_time: body.end_time,
        timezone: body.timezone || 'Asia/Kolkata',
        capacity: body.capacity || 1,
        status: body.status || 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    const created = db.agentAvailability.create(newAvailability);
    return NextResponse.json(created, { status: 201 });
}
