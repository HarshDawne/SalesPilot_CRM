import { NextRequest, NextResponse } from 'next/server';
import { db, ProjectAvailability } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/projects/[id]/availability
 * Get project availability configuration
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = await params;

    const availability = db.projectAvailability.findByProjectId(id);
    return NextResponse.json(availability || { message: 'No availability config found' });
}

/**
 * POST /api/projects/[id]/availability
 * Set/update project availability
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    // RBAC: Only admin/manager can set project availability
    const authError = await requireRole(request, ['admin', 'manager']);
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();

    // Check if config already exists
    const existing = db.projectAvailability.findByProjectId(id);

    if (existing) {
        // Update existing
        const updated = db.projectAvailability.update(existing.id, {
            concurrent_visit_capacity: body.concurrent_visit_capacity,
            location: body.location,
            travel_time_minutes: body.travel_time_minutes,
            business_hours: body.business_hours,
            no_show_grace_minutes: body.no_show_grace_minutes
        });
        return NextResponse.json(updated);
    }

    // Create new
    const newAvailability: ProjectAvailability = {
        id: uuidv4(),
        project_id: id,
        concurrent_visit_capacity: body.concurrent_visit_capacity || 5,
        location: body.location,
        travel_time_minutes: body.travel_time_minutes || 30,
        business_hours: body.business_hours || {
            start: '09:00',
            end: '18:00',
            days: [1, 2, 3, 4, 5] // Mon-Fri
        },
        no_show_grace_minutes: body.no_show_grace_minutes || 30,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    const created = db.projectAvailability.create(newAvailability);
    return NextResponse.json(created, { status: 201 });
}
