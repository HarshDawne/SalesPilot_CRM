// ============================================================================
// CALENDAR BOOKING VALIDATOR
// ============================================================================

import { db, Booking, Lead } from '../db';
import { checkAgentAvailability, checkProjectAvailability, checkMultiAgentAvailability } from './availability';

export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: string[];
}

/**
 * Validate booking duration
 */
function validateDuration(duration: number): ValidationError[] {
    const errors: ValidationError[] = [];
    const MIN_DURATION = 15; // minutes
    const MAX_DURATION = 480; // 8 hours

    if (duration < MIN_DURATION) {
        errors.push({
            field: 'duration',
            message: `Duration must be at least ${MIN_DURATION} minutes`
        });
    }

    if (duration > MAX_DURATION) {
        errors.push({
            field: 'duration',
            message: `Duration cannot exceed ${MAX_DURATION} minutes (8 hours)`
        });
    }

    return errors;
}

/**
 * Check if date falls on a blackout date
 */
function checkBlackoutDates(
    startTime: Date,
    endTime: Date,
    projectId?: string
): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check global blackouts
    const globalBlackouts = db.blackoutDates.findGlobal();
    for (const blackout of globalBlackouts) {
        const blackoutStart = new Date(blackout.start_date);
        const blackoutEnd = new Date(blackout.end_date);

        if (startTime <= blackoutEnd && endTime >= blackoutStart) {
            errors.push({
                field: 'slotStart',
                message: `Date falls on blackout period: ${blackout.reason}`
            });
        }
    }

    // Check project-specific blackouts
    if (projectId) {
        const projectBlackouts = db.blackoutDates.findByProjectId(projectId);
        for (const blackout of projectBlackouts) {
            const blackoutStart = new Date(blackout.start_date);
            const blackoutEnd = new Date(blackout.end_date);

            if (startTime <= blackoutEnd && endTime >= blackoutStart) {
                errors.push({
                    field: 'slotStart',
                    message: `Date falls on project blackout: ${blackout.reason}`
                });
            }
        }
    }

    return errors;
}

/**
 * Validate business hours
 */
function validateBusinessHours(
    startTime: Date,
    endTime: Date,
    projectId?: string
): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!projectId) return errors;

    const projectConfig = db.projectAvailability.findByProjectId(projectId);
    if (!projectConfig) return errors;

    const dayOfWeek = startTime.getDay();
    if (!projectConfig.business_hours.days.includes(dayOfWeek)) {
        errors.push({
            field: 'slotStart',
            message: 'Project not available on this day of week'
        });
        return errors;
    }

    const timeStr = startTime.toTimeString().substring(0, 5);
    if (timeStr < projectConfig.business_hours.start || timeStr >= projectConfig.business_hours.end) {
        errors.push({
            field: 'slotStart',
            message: `Project business hours: ${projectConfig.business_hours.start}-${projectConfig.business_hours.end}`
        });
    }

    return errors;
}

/**
 * Validate unit lock (if unit is assigned)
 */
function validateUnitLock(
    unitId: string | undefined,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string
): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!unitId) return errors;

    // Check if unit is already booked for this time
    const conflictingBookings = db.bookings.findAll().filter(b =>
        b.unitId === unitId &&
        b.id !== excludeBookingId &&
        b.status !== 'cancelled' &&
        b.status !== 'no_show' &&
        new Date(b.slotStart) < endTime &&
        new Date(b.slotEnd) > startTime
    );

    if (conflictingBookings.length > 0) {
        errors.push({
            field: 'unitId',
            message: `Unit already booked for this time slot`
        });
    }

    return errors;
}

/**
 * Validate lead contact information for reminders
 */
function validateContactInfo(leadId: string): ValidationError[] {
    const errors: ValidationError[] = [];
    const lead = db.leads.findById(leadId);

    if (!lead) {
        errors.push({
            field: 'leadId',
            message: 'Lead not found'
        });
        return errors;
    }

    // Check if lead has phone for reminders
    if (!lead.phone && !lead.primaryPhone) {
        errors.push({
            field: 'leadId',
            message: 'Lead must have a phone number for visit reminders'
        });
    }

    return errors;
}

/**
 * Validate multi-agent participants
 */
function validateParticipants(
    participants: string[] | undefined,
    startTime: Date,
    endTime: Date,
    projectId?: string,
    excludeBookingId?: string
): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!participants || participants.length === 0) return errors;

    // Check if all participants exist
    for (const userId of participants) {
        const user = db.users.findById(userId);
        if (!user) {
            errors.push({
                field: 'participants',
                message: `User ${userId} not found`
            });
        }
    }

    // Check if all participants are available
    const multiAgentCheck = checkMultiAgentAvailability(
        participants,
        startTime,
        endTime,
        projectId,
        excludeBookingId
    );

    if (!multiAgentCheck.available) {
        for (const [agentId, result] of Object.entries(multiAgentCheck.agent_results)) {
            if (!result.available) {
                const user = db.users.findById(agentId);
                errors.push({
                    field: 'participants',
                    message: `${user?.name || agentId}: ${result.reason}`
                });
            }
        }
    }

    return errors;
}

/**
 * Main booking validation function
 */
export function validateBooking(
    booking: Partial<Booking>,
    excludeBookingId?: string
): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!booking.leadId) {
        errors.push({ field: 'leadId', message: 'Lead ID is required' });
    }
    if (!booking.slotStart) {
        errors.push({ field: 'slotStart', message: 'Start time is required' });
    }
    if (!booking.slotEnd) {
        errors.push({ field: 'slotEnd', message: 'End time is required' });
    }

    if (errors.length > 0) {
        return { valid: false, errors, warnings };
    }

    const startTime = new Date(booking.slotStart!);
    const endTime = new Date(booking.slotEnd!);
    const duration = (endTime.getTime() - startTime.getTime()) / 60000; // minutes

    // Validate start < end
    if (startTime >= endTime) {
        errors.push({
            field: 'slotEnd',
            message: 'End time must be after start time'
        });
        return { valid: false, errors, warnings };
    }

    // Validate duration
    errors.push(...validateDuration(duration));

    // Validate contact info
    errors.push(...validateContactInfo(booking.leadId!));

    // Validate blackout dates
    errors.push(...checkBlackoutDates(startTime, endTime, booking.projectId));

    // Validate business hours
    errors.push(...validateBusinessHours(startTime, endTime, booking.projectId));

    // Validate unit lock
    errors.push(...validateUnitLock(booking.unitId, startTime, endTime, excludeBookingId));

    // Validate agent availability
    const agentId = booking.agent_id || booking.assignedTo;
    if (agentId) {
        const agentAvail = checkAgentAvailability(
            agentId,
            startTime,
            endTime,
            booking.projectId,
            excludeBookingId
        );

        if (!agentAvail.available) {
            errors.push({
                field: 'agent_id',
                message: agentAvail.reason || 'Agent not available'
            });

            // Add travel conflicts as separate errors
            for (const conflict of agentAvail.travel_conflicts) {
                errors.push({
                    field: 'slotStart',
                    message: `Travel time conflict: Need ${conflict.required_buffer} min buffer from previous booking`
                });
            }
        }

        // Warn if agent is getting close to capacity
        if (agentAvail.current_load / agentAvail.capacity > 0.8) {
            warnings.push(`Agent is at ${Math.round(agentAvail.current_load / agentAvail.capacity * 100)}% capacity`);
        }
    }

    // Validate project capacity
    if (booking.projectId) {
        const projectAvail = checkProjectAvailability(
            booking.projectId,
            startTime,
            endTime,
            excludeBookingId
        );

        if (!projectAvail.available) {
            errors.push({
                field: 'projectId',
                message: projectAvail.reason || 'Project at capacity'
            });
        }

        // Warn if project is getting close to capacity
        if (projectAvail.current_count / projectAvail.max_capacity > 0.8) {
            warnings.push(`Project is at ${Math.round(projectAvail.current_count / projectAvail.max_capacity * 100)}% capacity`);
        }
    }

    // Validate multi-agent participants
    errors.push(...validateParticipants(
        booking.participants,
        startTime,
        endTime,
        booking.projectId,
        excludeBookingId
    ));

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}
