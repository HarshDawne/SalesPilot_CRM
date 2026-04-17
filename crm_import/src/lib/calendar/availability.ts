// ============================================================================
// CALENDAR AVAILABILITY CHECKER
// ============================================================================

import { db, Booking, AgentAvailability, ProjectAvailability } from '../db';

/**
 * Check if a time slot overlaps with another
 */
function overlaps(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
): boolean {
    return start1 < end2 && end1 > start2;
}

/**
 * Calculate travel time between two locations (simplified)
 * In production, integrate with Google Maps Distance Matrix API
 */
export function calculateTravelTime(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
): number {
    // Simplified: 1 degree ≈ 111km, assume 40km/h avg speed
    const distance = Math.sqrt(
        Math.pow(to.lat - from.lat, 2) + Math.pow(to.lng - from.lng, 2)
    ) * 111;
    return Math.ceil((distance / 40) * 60); // minutes
}

/**
 * Check travel time conflicts for an agent
 */
function checkTravelTimeConflicts(
    agentId: string,
    startTime: Date,
    endTime: Date,
    projectId: string | undefined,
    excludeBookingId?: string
): { booking: Booking; travel_time: number; required_buffer: number }[] {
    const conflicts = [];
    const agentBookings = db.bookings.findAll()
        .filter(b =>
            (b.agent_id === agentId || b.assignedTo === agentId) &&
            b.id !== excludeBookingId &&
            b.status !== 'cancelled' &&
            b.status !== 'no_show'
        )
        .sort((a, b) => new Date(a.slotStart).getTime() - new Date(b.slotStart).getTime());

    const currentProject = projectId ? db.projectAvailability.findByProjectId(projectId) : null;

    for (const booking of agentBookings) {
        const bookingEnd = new Date(booking.slotEnd);
        const timeDiff = (startTime.getTime() - bookingEnd.getTime()) / 60000; // minutes

        // Check if previous booking ends close to this one
        if (timeDiff > 0 && timeDiff < 120) { // Within 2 hours
            const prevProject = booking.projectId ? db.projectAvailability.findByProjectId(booking.projectId) : null;

            if (currentProject && prevProject &&
                (currentProject.location.lat !== prevProject.location.lat ||
                    currentProject.location.lng !== prevProject.location.lng)) {

                const travelTime = calculateTravelTime(prevProject.location, currentProject.location);
                const requiredBuffer = booking.travel_time_buffer || travelTime;

                if (timeDiff < requiredBuffer) {
                    conflicts.push({ booking, travel_time: travelTime, required_buffer: requiredBuffer });
                }
            }
        }
    }

    return conflicts;
}

/**
 * Check agent availability for a time slot
 */
export function checkAgentAvailability(
    agentId: string,
    startTime: Date,
    endTime: Date,
    projectId?: string,
    excludeBookingId?: string
): {
    available: boolean;
    conflicts: Booking[];
    capacity: number;
    current_load: number;
    travel_conflicts: { booking: Booking; travel_time: number; required_buffer: number }[];
    reason?: string;
} {
    // 1. Check agent's availability rules
    const availabilityRules = db.agentAvailability.findByAgentId(agentId);
    const dayOfWeek = startTime.getDay();
    const timeStr = startTime.toTimeString().substring(0, 5); // "HH:MM"

    // Find matching availability rule
    const matchingRule = availabilityRules.find(rule => {
        if (rule.status !== 'active') return false;
        if (rule.date) {
            // Specific date exception
            return rule.date === startTime.toISOString().split('T')[0];
        }
        if (rule.day_of_week !== undefined) {
            // Recurring weekly availability
            return rule.day_of_week === dayOfWeek;
        }
        return false;
    });

    if (!matchingRule) {
        return {
            available: false,
            conflicts: [],
            capacity: 0,
            current_load: 0,
            travel_conflicts: [],
            reason: 'Agent not available on this day/time'
        };
    }

    // Check if time falls within business hours
    if (timeStr < matchingRule.start_time || timeStr >= matchingRule.end_time) {
        return {
            available: false,
            conflicts: [],
            capacity: matchingRule.capacity,
            current_load: 0,
            travel_conflicts: [],
            reason: `Agent available only ${matchingRule.start_time}-${matchingRule.end_time}`
        };
    }

    // 2. Check existing bookings (capacity)
    const existingBookings = db.bookings.findAll().filter(b =>
        (b.agent_id === agentId || b.assignedTo === agentId) &&
        b.id !== excludeBookingId &&
        b.status !== 'cancelled' &&
        b.status !== 'no_show' &&
        overlaps(new Date(b.slotStart), new Date(b.slotEnd), startTime, endTime)
    );

    // 3. Check travel time conflicts
    const travelConflicts = checkTravelTimeConflicts(
        agentId, startTime, endTime, projectId, excludeBookingId
    );

    const available = existingBookings.length < matchingRule.capacity && travelConflicts.length === 0;

    return {
        available,
        conflicts: existingBookings,
        capacity: matchingRule.capacity,
        current_load: existingBookings.length,
        travel_conflicts: travelConflicts,
        reason: !available ? (
            travelConflicts.length > 0
                ? 'Travel time conflict with previous booking'
                : 'Agent at capacity for this time slot'
        ) : undefined
    };
}

/**
 * Check project availability for concurrent visits
 */
export function checkProjectAvailability(
    projectId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string
): {
    available: boolean;
    current_count: number;
    max_capacity: number;
    reason?: string;
} {
    const projectConfig = db.projectAvailability.findByProjectId(projectId);

    if (!projectConfig) {
        // No config = unlimited capacity
        return { available: true, current_count: 0, max_capacity: Infinity };
    }

    const activeVisits = db.bookings.findAll().filter(b =>
        b.projectId === projectId &&
        b.id !== excludeBookingId &&
        b.status !== 'cancelled' &&
        b.status !== 'no_show' &&
        overlaps(new Date(b.slotStart), new Date(b.slotEnd), startTime, endTime)
    );

    const available = activeVisits.length < projectConfig.concurrent_visit_capacity;

    return {
        available,
        current_count: activeVisits.length,
        max_capacity: projectConfig.concurrent_visit_capacity,
        reason: !available ? `Project at capacity (${activeVisits.length}/${projectConfig.concurrent_visit_capacity})` : undefined
    };
}

/**
 * Suggest alternative time slots for a booking
 */
export function suggestAlternativeSlots(
    agentId: string,
    preferredDate: Date,
    duration: number,
    projectId?: string,
    maxSuggestions: number = 5
): { start: Date; end: Date; score: number }[] {
    const suggestions: { start: Date; end: Date; score: number }[] = [];
    const availabilityRules = db.agentAvailability.findByAgentId(agentId);

    // Search for next 7 days
    for (let dayOffset = 0; dayOffset < 7 && suggestions.length < maxSuggestions; dayOffset++) {
        const searchDate = new Date(preferredDate);
        searchDate.setDate(searchDate.getDate() + dayOffset);
        const dayOfWeek = searchDate.getDay();

        // Find availability rule for this day
        const rule = availabilityRules.find(r =>
            r.status === 'active' &&
            (r.day_of_week === dayOfWeek || r.date === searchDate.toISOString().split('T')[0])
        );

        if (!rule) continue;

        // Try slots every 30 minutes within business hours
        const [startHour, startMin] = rule.start_time.split(':').map(Number);
        const [endHour, endMin] = rule.end_time.split(':').map(Number);

        for (let hour = startHour; hour < endHour; hour++) {
            for (let min of [0, 30]) {
                if (hour === endHour - 1 && min + duration > 60) break;

                const slotStart = new Date(searchDate);
                slotStart.setHours(hour, min, 0, 0);
                const slotEnd = new Date(slotStart.getTime() + duration * 60000);

                // Check availability
                const agentAvail = checkAgentAvailability(agentId, slotStart, slotEnd, projectId);
                const projectAvail = projectId ? checkProjectAvailability(projectId, slotStart, slotEnd) : { available: true };

                if (agentAvail.available && projectAvail.available) {
                    // Score based on proximity to preferred time and day
                    const timeDiff = Math.abs(slotStart.getTime() - preferredDate.getTime()) / (1000 * 60 * 60); // hours
                    const score = 100 - Math.min(timeDiff, 100);

                    suggestions.push({ start: slotStart, end: slotEnd, score });

                    if (suggestions.length >= maxSuggestions) break;
                }
            }
            if (suggestions.length >= maxSuggestions) break;
        }
    }

    // Sort by score descending
    return suggestions.sort((a, b) => b.score - a.score);
}

/**
 * Check multi-agent availability (all participants must be free)
 */
export function checkMultiAgentAvailability(
    agentIds: string[],
    startTime: Date,
    endTime: Date,
    projectId?: string,
    excludeBookingId?: string
): {
    available: boolean;
    agent_results: Record<string, ReturnType<typeof checkAgentAvailability>>;
} {
    const results: Record<string, ReturnType<typeof checkAgentAvailability>> = {};

    for (const agentId of agentIds) {
        results[agentId] = checkAgentAvailability(agentId, startTime, endTime, projectId, excludeBookingId);
    }

    const allAvailable = Object.values(results).every(r => r.available);

    return {
        available: allAvailable,
        agent_results: results
    };
}
