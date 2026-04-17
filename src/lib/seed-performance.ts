import { v4 as uuidv4 } from 'uuid';
import { db, TimelineEvent, TimelineEventType } from './db';

/**
 * Generates showcase performance data spanning the last 12 weeks.
 * Shows a clear upward trend in Actual performance vs the randomized Projections.
 */
export async function seedPerformanceMatrixData() {
    console.log('📊 Seeding performance matrix data...');
    
    const leads = db.leads.findAll();
    if (leads.length === 0) {
        console.warn('⚠️ No leads found. Please seed leads first.');
        return;
    }

    const now = new Date();
    const performanceEvents: TimelineEvent[] = [];

    // Probability of success increases as we get closer to "now" (AI optimization effect)
    for (let week = 11; week >= 0; week--) {
        const weekStart = new Date(now.getTime() - (week + 1) * 7 * 24 * 60 * 60 * 1000);
        
        // Intensity: Number of events per week
        // We start with ~15 events and grow to ~60 events per week
        const intensity = 15 + (11 - week) * 4 + Math.floor(Math.random() * 8);
        
        for (let i = 0; i < intensity; i++) {
            const randomLead = leads[Math.floor(Math.random() * leads.length)];
            const eventTimestamp = new Date(weekStart.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
            
            const eventTypes: TimelineEventType[] = [
                'ai_call_connected',
                'ai_qualified',
                'visit_booked',
                'lead_created',
                'wa_sent',
                'stage_changed'
            ];
            
            // Bias towards later weeks having more "success" events
            let type: TimelineEventType = 'lead_created';
            const roll = Math.random();
            if (week < 4) { // Last month: very high success
                if (roll > 0.3) type = 'ai_call_connected';
                if (roll > 0.6) type = 'ai_qualified';
                if (roll > 0.8) type = 'visit_booked';
                if (roll > 0.9) type = 'booking_paid';
            } else if (week < 8) { // Middle month: moderate success
                if (roll > 0.5) type = 'ai_call_connected';
                if (roll > 0.75) type = 'ai_qualified';
                if (roll > 0.9) type = 'visit_booked';
            } else { // Early month: low success, mostly creation
                if (roll > 0.7) type = 'ai_call_connected';
                if (roll > 0.85) type = 'lead_created';
            }

            performanceEvents.push({
                id: uuidv4(),
                leadId: randomLead.id,
                type,
                timestamp: eventTimestamp.toISOString(),
                actor: type.startsWith('ai_') ? 'ai' : 'system',
                summary: `Demo performance event: ${type.replace(/_/g, ' ')}`,
                immutable: true
            });
        }
    }

    // Sort by timestamp
    performanceEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Batch create for performance
    (db.timeline as any).createMany(performanceEvents);

    console.log(`✅ Successfully injected ${performanceEvents.length} performance events.`);
    return performanceEvents.length;
}
