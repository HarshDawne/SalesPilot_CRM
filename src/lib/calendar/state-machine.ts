// ============================================================================
// BOOKING STATE MACHINE
// ============================================================================

import { Booking } from '../db';

/**
 * Allowed booking status transitions
 */
export const BOOKING_TRANSITIONS: Record<string, string[]> = {
    // Initial states
    pending: ['confirmed', 'cancelled'],
    booked: ['confirmed', 'cancelled'],

    // Confirmed can go to in-progress (check-in), rescheduled, no-show, or cancelled
    confirmed: ['in_progress', 'rescheduled', 'no_show', 'cancelled'],

    // In-progress (checked in) can only go to completed
    in_progress: ['completed'],

    // Rescheduled can be confirmed again
    rescheduled: ['confirmed'],

    // Terminal states
    completed: [],
    cancelled: [],
    no_show: ['rescheduled'] // Allow re-booking after no-show
};

/**
 * Required fields for each transition
 */
const REQUIRED_FIELDS: Record<string, string[]> = {
    completed: ['feedback'],
    in_progress: ['checked_in_at'],
    rescheduled: ['reschedule_reason']
};

/**
 * RBAC rules for transitions
 */
const TRANSITION_RBAC: Record<string, string[]> = {
    no_show: ['admin', 'manager'], // Only admin/manager can manually mark no-show
    cancelled: ['admin', 'manager', 'sales'], // Sales can cancel their own bookings
    completed: ['admin', 'manager', 'sales'],
    in_progress: ['admin', 'manager', 'sales'], // Check-in
    rescheduled: ['admin', 'manager', 'sales']
};

export interface TransitionValidationResult {
    valid: boolean;
    errors: string[];
}

/**
 * Validate a booking status transition
 */
export function validateTransition(
    currentStatus: string,
    targetStatus: string,
    payload: any,
    actor: string,
    actorRole?: string
): TransitionValidationResult {
    const errors: string[] = [];

    // Check if transition is allowed
    const allowedTransitions = BOOKING_TRANSITIONS[currentStatus];
    if (!allowedTransitions || !allowedTransitions.includes(targetStatus)) {
        errors.push(`Cannot transition from ${currentStatus} to ${targetStatus}`);
        return { valid: false, errors };
    }

    // Check required fields
    const requiredFields = REQUIRED_FIELDS[targetStatus] || [];
    for (const field of requiredFields) {
        if (!payload[field]) {
            errors.push(`Field '${field}' is required for transition to ${targetStatus}`);
        }
    }

    // Check RBAC
    const requiredRoles = TRANSITION_RBAC[targetStatus];
    if (requiredRoles && actorRole && !requiredRoles.includes(actorRole)) {
        errors.push(`Role '${actorRole}' not authorized for transition to ${targetStatus}`);
    }

    // Special validations
    if (targetStatus === 'completed') {
        // Must have been in_progress or confirmed
        if (currentStatus !== 'in_progress' && currentStatus !== 'confirmed') {
            errors.push('Can only complete bookings that are in_progress or confirmed');
        }

        // Feedback should be meaningful
        if (payload.feedback && payload.feedback.length < 5) {
            errors.push('Feedback must be at least 5 characters');
        }
    }

    if (targetStatus === 'in_progress') {
        // Can only check-in from confirmed
        if (currentStatus !== 'confirmed') {
            errors.push('Can only check-in confirmed bookings');
        }

        // Check-in time should be reasonable (within 2 hours of start time)
        if (payload.checked_in_at) {
            const checkinTime = new Date(payload.checked_in_at);
            const now = new Date();
            const diffHours = Math.abs(checkinTime.getTime() - now.getTime()) / (1000 * 60 * 60);

            if (diffHours > 2) {
                errors.push('Check-in time must be within 2 hours of current time');
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Get allowed next states for a booking
 */
export function getAllowedTransitions(currentStatus: string): string[] {
    return BOOKING_TRANSITIONS[currentStatus] || [];
}

/**
 * Check if a transition is allowed
 */
export function isTransitionAllowed(
    currentStatus: string,
    targetStatus: string
): boolean {
    const allowed = BOOKING_TRANSITIONS[currentStatus];
    return allowed ? allowed.includes(targetStatus) : false;
}

/**
 * Get human-readable status labels
 */
export const STATUS_LABELS: Record<string, string> = {
    pending: 'Pending Confirmation',
    booked: 'Booked',
    confirmed: 'Confirmed',
    in_progress: 'In Progress (Checked In)',
    completed: 'Completed',
    rescheduled: 'Rescheduled',
    cancelled: 'Cancelled',
    no_show: 'No Show'
};

/**
 * Get status color for UI
 */
export const STATUS_COLORS: Record<string, string> = {
    pending: 'yellow',
    booked: 'blue',
    confirmed: 'green',
    in_progress: 'purple',
    completed: 'gray',
    rescheduled: 'orange',
    cancelled: 'red',
    no_show: 'red'
};
