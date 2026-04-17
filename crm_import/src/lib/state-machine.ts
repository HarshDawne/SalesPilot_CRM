// State Machine Validation Module
// TODO: Implement full state machine validation logic

export interface ValidationResult {
    ok: boolean;
    errors?: string[];
}

export function validateTransition(
    lead: any,
    toStage: string,
    payload: any,
    actorRole: string
): ValidationResult {
    // Basic validation stub - always allow transitions for now
    // TODO: Implement business rules per stage transition

    // Example validation rules (add more as needed):
    const validStages = [
        'NEW',
        'CONTACTED',
        'QUALIFIED',
        'Visit_Booked',
        'Visit_Completed',
        'Negotiation',
        'Booking_Done',
        'Disqualified',
        'Lost'
    ];

    if (!validStages.includes(toStage)) {
        return {
            ok: false,
            errors: [`Invalid target stage: ${toStage}`]
        };
    }

    // Role-based validation
    if (toStage === 'Booking_Done' && actorRole !== 'admin' && actorRole !== 'manager') {
        return {
            ok: false,
            errors: ['Only admin or manager can mark as Booking Done']
        };
    }

    // All validations passed
    return { ok: true };
}
