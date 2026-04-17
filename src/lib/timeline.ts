import { v4 as uuidv4 } from 'uuid';
import { db, TimelineEvent, TimelineEventType } from './db';

/**
 * Timeline Service - Manages append-only audit trail for all lead interactions
 * 
 * Features:
 * - Immutable event logging
 * - Multi-actor support (system, AI, agents)
 * - Flexible payload structure
 * - Visibility controls
 */

export interface CreateTimelineEventParams {
    leadId: string;
    type: TimelineEventType;
    summary: string;
    actor?: "system" | "ai" | string;
    payload?: Record<string, any>;
    visibleTo?: "all" | "agent" | "admin";
    immutable?: boolean;
}

/**
 * Add a new timeline event for a lead
 */
export function addTimelineEvent(params: CreateTimelineEventParams): TimelineEvent {
    const event: TimelineEvent = {
        id: uuidv4(),
        leadId: params.leadId,
        type: params.type,
        timestamp: new Date().toISOString(),
        actor: params.actor || "system",
        summary: params.summary,
        payload: params.payload,
        visibleTo: params.visibleTo || "all",
        immutable: params.immutable !== undefined ? params.immutable : true,
        metadata: {}
    };

    return db.timeline.create(event);
}

/**
 * Get all timeline events for a lead (sorted by timestamp, newest first)
 */
export function getLeadTimeline(leadId: string): TimelineEvent[] {
    return db.timeline.findByLeadId(leadId);
}

/**
 * Filter timeline events by type
 */
export function filterByEventType(leadId: string, types: TimelineEventType[]): TimelineEvent[] {
    const allEvents = getLeadTimeline(leadId);
    return allEvents.filter(event => types.includes(event.type));
}

/**
 * Get timeline events within a date range
 */
export function getTimelineByDateRange(
    leadId: string,
    startDate: string,
    endDate: string
): TimelineEvent[] {
    const allEvents = getLeadTimeline(leadId);
    return allEvents.filter(event =>
        event.timestamp >= startDate && event.timestamp <= endDate
    );
}

/**
 * Get recent timeline events (last N events)
 */
export function getRecentTimeline(leadId: string, limit: number = 10): TimelineEvent[] {
    const allEvents = getLeadTimeline(leadId);
    return allEvents.slice(0, limit);
}

/**
 * Helper functions for common timeline events
 */

export function logLeadCreated(leadId: string, source: string, payload?: Record<string, any>) {
    return addTimelineEvent({
        leadId,
        type: "lead_created",
        summary: `Lead created from ${source}`,
        actor: "system",
        payload: { source, ...payload },
        immutable: true
    });
}

export function logAICallAttempt(
    leadId: string,
    attemptNumber: number,
    callId: string,
    payload?: Record<string, any>
) {
    return addTimelineEvent({
        leadId,
        type: "ai_call_attempt",
        summary: `AI call attempt #${attemptNumber}`,
        actor: "ai",
        payload: { attemptNumber, callId, ...payload }
    });
}

export function logAICallConnected(
    leadId: string,
    callId: string,
    duration: number,
    transcriptUrl?: string,
    payload?: Record<string, any>
) {
    return addTimelineEvent({
        leadId,
        type: "ai_call_connected",
        summary: `AI call connected (${Math.floor(duration / 60)}m ${duration % 60}s)`,
        actor: "ai",
        payload: { callId, duration, transcriptUrl, ...payload },
        immutable: true
    });
}

export function logAIQualified(
    leadId: string,
    aiScore: number,
    qualification: Record<string, any>
) {
    return addTimelineEvent({
        leadId,
        type: "ai_qualified",
        summary: `Lead qualified by AI (Score: ${aiScore}/100)`,
        actor: "ai",
        payload: { aiScore, qualification },
        immutable: true
    });
}

export function logAIDisqualified(
    leadId: string,
    reason: string,
    notes?: string
) {
    return addTimelineEvent({
        leadId,
        type: "ai_disqualified",
        summary: `Lead disqualified: ${reason}`,
        actor: "ai",
        payload: { reason, notes },
        immutable: true
    });
}

export function logVisitBooked(
    leadId: string,
    visitId: string,
    dateTime: string,
    projectName: string,
    agentName?: string
) {
    return addTimelineEvent({
        leadId,
        type: "visit_booked",
        summary: `Visit booked for ${new Date(dateTime).toLocaleString()} at ${projectName}`,
        actor: "system",
        payload: { visitId, dateTime, projectName, agentName },
        immutable: true
    });
}

export function logVisitCompleted(
    leadId: string,
    visitId: string,
    feedback?: Record<string, any>
) {
    return addTimelineEvent({
        leadId,
        type: "visit_completed",
        summary: "Site visit completed",
        actor: "system",
        payload: { visitId, feedback },
        immutable: true
    });
}

export function logVisitFeedback(
    leadId: string,
    outcome: string,
    notes?: string
) {
    return addTimelineEvent({
        leadId,
        type: "visit_feedback_logged",
        summary: `Visit Outcome: ${outcome}`,
        actor: "agent",
        payload: { outcome, notes },
        immutable: true
    });
}

export function logVisitNoShow(leadId: string, visitId: string) {
    return addTimelineEvent({
        leadId,
        type: "visit_no_show",
        summary: "Client did not show up for scheduled visit",
        actor: "system",
        payload: { visitId }
    });
}

export function logWhatsAppSent(
    leadId: string,
    templateId: string,
    messageId: string
) {
    return addTimelineEvent({
        leadId,
        type: "whatsapp_confirmation_sent",
        summary: "WhatsApp confirmation sent",
        actor: "system",
        payload: { templateId, messageId }
    });
}

export function logCalendarInvite(
    leadId: string,
    inviteId: string,
    eventDetails: Record<string, any>
) {
    return addTimelineEvent({
        leadId,
        type: "calendar_invite_sent",
        summary: "Calendar invite sent",
        actor: "system",
        payload: { inviteId, ...eventDetails }
    });
}

export function logProposalSent(
    leadId: string,
    proposalId: string,
    amount: number
) {
    return addTimelineEvent({
        leadId,
        type: "proposal_sent",
        summary: `Proposal sent (₹${amount.toLocaleString()})`,
        actor: "system",
        payload: { proposalId, amount },
        immutable: true
    });
}

export function logBookingPaid(
    leadId: string,
    bookingId: string,
    amount: number,
    transactionId: string
) {
    return addTimelineEvent({
        leadId,
        type: "booking_paid",
        summary: `Booking amount paid: ₹${amount.toLocaleString()}`,
        actor: "system",
        payload: { bookingId, amount, transactionId },
        immutable: true
    });
}

export function logStageChange(
    leadId: string,
    fromStage: string,
    toStage: string,
    actor: string = "system"
) {
    return addTimelineEvent({
        leadId,
        type: "stage_changed",
        summary: `Stage changed from ${fromStage} to ${toStage}`,
        actor,
        payload: { fromStage, toStage }
    });
}

export function logNote(
    leadId: string,
    note: string,
    actor: string
) {
    return addTimelineEvent({
        leadId,
        type: "note_added",
        summary: note,
        actor,
        immutable: false,
        visibleTo: "all"
    });
}

export function logAgentAssigned(
    leadId: string,
    agentId: string,
    agentName: string
) {
    return addTimelineEvent({
        leadId,
        type: "agent_assigned",
        summary: `Assigned to ${agentName}`,
        actor: "system",
        payload: { agentId, agentName }
    });
}
