import { Lead, LeadStage } from './db';
import { z } from 'zod';

// ============================================================================
// STATE MACHINE DEFINITION
// ============================================================================

export const ALLOWED_TRANSITIONS: Record<LeadStage, LeadStage[]> = {
    New: ['AI_Calling', 'Disqualified'],
    AI_Calling: ['Qualified', 'Disqualified'],
    Qualified: ['Visit_Booked', 'Negotiation', 'Disqualified'], // Added Disqualified as per PRD exception note (manager only)
    Visit_Booked: ['Visit_Completed', 'Disqualified'],
    Visit_Completed: ['Negotiation', 'Booking_Done', 'Disqualified'],
    Negotiation: ['Booking_Done', 'Disqualified'],
    Booking_Done: [], // Terminal
    Disqualified: ['Qualified'], // Reopen (Manager only)
};

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const VisitBookedPayloadSchema = z.object({
    visit_date: z.string().datetime(),
    agent_id: z.string().min(1),
});

const VisitCompletedPayloadSchema = z.object({
    feedback_score: z.number().min(1).max(5),
    visit_outcome: z.enum(['interested', 'not_interested', 'follow_up']),
    comments: z.string().optional(),
});

const NegotiationPayloadSchema = z.object({
    offered_price: z.number().positive(),
    payment_plan: z.string().optional(),
});

const BookingDonePayloadSchema = z.object({
    unit_id: z.string().min(1),
    booking_amount: z.number().positive(),
    payment_proof: z.string().optional(), // URL or ID
    kyc_status: z.enum(['verified']),
});

const DisqualifiedPayloadSchema = z.object({
    reason: z.string().min(1),
    notes: z.string().optional(),
});

// ============================================================================
// VALIDATION LOGIC
// ============================================================================

export interface TransitionResult {
    ok: boolean;
    errors?: Array<{ field: string; message: string }>;
    requiredFields?: string[];
}

export function validateTransition(
    lead: Lead,
    toStage: LeadStage,
    payload: any,
    actorRole: string
): TransitionResult {
    // 1. Check if transition is allowed
    const allowedNextStages = ALLOWED_TRANSITIONS[lead.currentStage];
    if (!allowedNextStages.includes(toStage)) {
        return {
            ok: false,
            errors: [{ field: 'to_stage', message: `Transition from ${lead.currentStage} to ${toStage} is not allowed.` }],
        };
    }

    // 2. RBAC Checks (Basic implementation, can be expanded)
    if (toStage === 'Disqualified' && actorRole !== 'manager' && actorRole !== 'admin') {
        // Exception: System/AI can disqualify? PRD says "Manager&Admin can Disqualify". 
        // But AI also disqualifies. We'll assume 'system' or 'ai' role is allowed.
        if (actorRole !== 'system' && actorRole !== 'ai') {
            return {
                ok: false,
                errors: [{ field: 'actor_role', message: 'Only Managers or Admins can disqualify leads.' }],
            };
        }
    }

    if (lead.currentStage === 'Disqualified' && toStage === 'Qualified') {
        if (actorRole !== 'manager' && actorRole !== 'admin') {
            return {
                ok: false,
                errors: [{ field: 'actor_role', message: 'Only Managers can reopen disqualified leads.' }],
            };
        }
    }

    // 3. Payload Validation based on target stage
    let schema;
    switch (toStage) {
        case 'Visit_Booked':
            schema = VisitBookedPayloadSchema;
            break;
        case 'Visit_Completed':
            schema = VisitCompletedPayloadSchema;
            break;
        case 'Negotiation':
            schema = NegotiationPayloadSchema;
            break;
        case 'Booking_Done':
            schema = BookingDonePayloadSchema;
            break;
        case 'Disqualified':
            schema = DisqualifiedPayloadSchema;
            break;
        default:
            schema = z.object({});
    }

    const validation = schema.safeParse(payload);
    if (!validation.success) {
        const errors = validation.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        return { ok: false, errors };
    }

    // 4. Business Logic Checks (e.g., Unit Availability)
    // For Booking_Done, we might need to check if unit is already booked.
    // This requires DB access which might be better done in the route handler or a service.
    // For now, we assume the payload validation covers the immediate data requirements.

    return { ok: true };
}
