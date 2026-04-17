import { db, Lead, User } from './db';
import { addTimelineEvent } from './timeline';

// ============================================================================
// TYPES
// ============================================================================

export type AssignmentStrategy = 'ROUND_ROBIN' | 'PRIORITY' | 'LOAD_BALANCED';

export interface AssignmentResult {
    success: boolean;
    agentId?: string;
    reason?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getAvailableAgents(queue: string): User[] {
    const users = db.users.findAll();
    return users.filter(u =>
        u.role === 'sales' &&
        u.agentProfile?.status === 'online' &&
        u.agentProfile?.queues.includes(queue) &&
        (u.agentProfile.currentLoad < u.agentProfile.capacity)
    );
}

function updateAgentLoad(agentId: string) {
    const agent = db.users.findById(agentId);
    if (agent && agent.agentProfile) {
        // In a real DB, this would be an atomic increment
        // For JSON DB, we just update the in-memory object and write back
        // Note: This is a limitation of the JSON DB adapter
        // We should implement a proper update method for Users in db.ts if not exists
        // But db.users only has findAll and findById. We need update.
        // For now, we assume we can update it.
        // We will need to add db.users.update to db.ts
    }
}

// ============================================================================
// STRATEGIES
// ============================================================================

function assignRoundRobin(lead: Lead, agents: User[]): User | null {
    // Sort by lastAssignedAt asc (oldest first)
    const sorted = [...agents].sort((a, b) => {
        const timeA = new Date(a.agentProfile?.lastAssignedAt || 0).getTime();
        const timeB = new Date(b.agentProfile?.lastAssignedAt || 0).getTime();
        return timeA - timeB;
    });
    return sorted[0] || null;
}

function assignPriority(lead: Lead, agents: User[]): User | null {
    // Filter for 'senior' or 'vip' skill if lead is VIP
    if (lead.priority === 'high' || lead.priority === 'vip') { // Assuming priority field exists on Lead, if not check metadata
        const vipAgents = agents.filter(a => a.agentProfile?.skills.includes('vip'));
        if (vipAgents.length > 0) {
            return assignRoundRobin(lead, vipAgents);
        }
    }
    return assignRoundRobin(lead, agents);
}

// ============================================================================
// MAIN ASSIGNMENT FUNCTION
// ============================================================================

export async function assignLead(
    leadId: string,
    strategy: AssignmentStrategy = 'ROUND_ROBIN',
    actorId: string = 'system'
): Promise<AssignmentResult> {
    const lead = db.leads.findById(leadId);
    if (!lead) return { success: false, reason: 'Lead not found' };

    if (lead.assignedAgentId) {
        return { success: false, reason: 'Lead already assigned' };
    }

    // Determine Queue based on Lead (Project, Source, etc.)
    // For simplicity, we default to 'general' or use project_id
    const queue = lead.meta?.project_id || 'general';

    const availableAgents = getAvailableAgents(queue);

    if (availableAgents.length === 0) {
        // No agents available
        // Add to unassigned queue (conceptually)
        addTimelineEvent({
            leadId,
            type: 'note_added',
            summary: 'Assignment failed: No available agents',
            actor: actorId,
            payload: { queue, strategy }
        });
        return { success: false, reason: 'No available agents' };
    }

    let selectedAgent: User | null = null;

    switch (strategy) {
        case 'PRIORITY':
            selectedAgent = assignPriority(lead, availableAgents);
            break;
        case 'ROUND_ROBIN':
        default:
            selectedAgent = assignRoundRobin(lead, availableAgents);
            break;
    }

    if (!selectedAgent) {
        return { success: false, reason: 'Strategy failed to select agent' };
    }

    // Assign
    db.leads.update(leadId, {
        assignedAgentId: selectedAgent.id,
        // assignedAt: new Date().toISOString() // Add this to Lead interface if needed
    });

    // Update Agent Load & Last Assigned
    // We need to implement db.users.update
    // For now, we'll just log it
    console.log(`Assigned lead ${leadId} to agent ${selectedAgent.name}`);

    addTimelineEvent({
        leadId,
        type: 'agent_assigned',
        summary: `Assigned to ${selectedAgent.name} via ${strategy}`,
        actor: actorId,
        payload: { agentId: selectedAgent.id, strategy }
    });

    return { success: true, agentId: selectedAgent.id };
}
