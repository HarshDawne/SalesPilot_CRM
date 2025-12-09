// If agent_id is provided, it's a manual assignment (override)
if (agent_id) {
    const lead = db.leads.findById(lead_id);
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    const agent = db.users.findById(agent_id);
    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

    db.leads.update(lead_id, { assignedAgentId: agent_id });

    // Log event
    const { addTimelineEvent } = await import('@/lib/timeline');
    addTimelineEvent({
        leadId: lead_id,
        type: 'agent_assigned',
        summary: `Manually assigned to ${agent.name}`,
        actor: actor_id || 'system',
        payload: { agentId: agent_id, manual: true }
    });

    return NextResponse.json({ success: true, agentId: agent_id });
}

// Otherwise use assignment engine
const result = await assignLead(lead_id, strategy || 'ROUND_ROBIN', actor_id);

if (result.success) {
    return NextResponse.json(result);
} else {
    return NextResponse.json({ error: result.reason }, { status: 400 });
}

    } catch (error) {
    console.error('Assignment Error:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
}
}
