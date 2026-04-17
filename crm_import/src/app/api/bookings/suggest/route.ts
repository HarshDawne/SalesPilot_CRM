import { NextRequest, NextResponse } from 'next/server';
import { suggestAlternativeSlots } from '@/lib/calendar/availability';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

/**
 * GET /api/bookings/suggest
 * Smart slot suggestion API
 * Query params: lead_id, project_id, duration, preferred_date, agent_id
 */
export async function GET(request: NextRequest) {
    // RBAC: sales, manager, admin can suggest slots
    const authError = await requireRole(request, ['sales', 'manager', 'admin']);
    if (authError) return authError;

    const { searchParams } = request.nextUrl;
    const leadId = searchParams.get('lead_id');
    const projectId = searchParams.get('project_id') || undefined;
    const duration = parseInt(searchParams.get('duration') || '60');
    const preferredDate = searchParams.get('preferred_date');
    const agentId = searchParams.get('agent_id');

    if (!leadId) {
        return NextResponse.json(
            { error: 'lead_id is required' },
            { status: 400 }
        );
    }

    // Verify lead exists
    const lead = db.leads.findById(leadId);
    if (!lead) {
        return NextResponse.json(
            { error: 'Lead not found' },
            { status: 404 }
        );
    }

    const preferredDateTime = preferredDate ? new Date(preferredDate) : new Date();

    // If specific agent requested
    if (agentId) {
        const slots = suggestAlternativeSlots(
            agentId,
            preferredDateTime,
            duration,
            projectId,
            10 // Get top 10 slots
        );

        const agent = db.users.findById(agentId);
        return NextResponse.json({
            suggestions: [{
                agent_id: agentId,
                agent_name: agent?.name || 'Unknown',
                slots: slots.map(s => ({
                    start: s.start.toISOString(),
                    end: s.end.toISOString(),
                    score: s.score
                }))
            }]
        });
    }

    // Auto-suggest across all available agents
    const agents = db.users.findAll().filter(u =>
        u.role === 'sales' || u.role === 'manager'
    );

    const suggestions = [];
    for (const agent of agents) {
        const slots = suggestAlternativeSlots(
            agent.id,
            preferredDateTime,
            duration,
            projectId,
            3 // Top 3 slots per agent
        );

        if (slots.length > 0) {
            suggestions.push({
                agent_id: agent.id,
                agent_name: agent.name,
                agent_current_load: agent.agentProfile?.currentLoad || 0,
                agent_capacity: agent.agentProfile?.capacity || 1,
                slots: slots.map(s => ({
                    start: s.start.toISOString(),
                    end: s.end.toISOString(),
                    score: s.score
                }))
            });
        }
    }

    // Sort by agent availability (lower load first)
    suggestions.sort((a, b) => {
        const loadA = a.agent_current_load / a.agent_capacity;
        const loadB = b.agent_current_load / b.agent_capacity;
        return loadA - loadB;
    });

    return NextResponse.json({ suggestions });
}
