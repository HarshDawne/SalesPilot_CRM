import { Lead, LeadStatus, LeadSource } from './types';
import { eventBus } from '../core/events';

interface RuleResult {
    score: number;
    assignedTo?: string; // Agent ID
    tags: string[];
}

export class RuleEngine {

    static async evaluate(lead: Lead): Promise<RuleResult> {
        const result: RuleResult = {
            score: 0,
            tags: [],
        };

        // 1. Scoring Logic
        // Source based scoring
        if (lead.source === LeadSource.WALK_IN) result.score += 50; // Hot!
        if (lead.source === LeadSource.WEBSITE) result.score += 20;
        if (lead.source === LeadSource.REFERRAL) result.score += 40;

        // Budget based scoring (Example: High budget = High priority)
        if (lead.budget && lead.budget.min > 10000000) { // > 1 Cr
            result.score += 30;
            result.tags.push('HNI');
        }

        // 2. Assignment Logic
        // Google Ads -> Team A (Simulated ID)
        if (lead.source === LeadSource.GOOGLE_ADS) {
            result.assignedTo = 'agent-001'; // "Team A"
            result.tags.push('PAID_CAMPAIGN');
        }

        // Walk-ins -> Senior Manager
        if (lead.source === LeadSource.WALK_IN) {
            result.assignedTo = 'manager-001';
        }

        // 3. Status Update based on score
        if (result.score > 60) {
            result.tags.push('HOT_LEAD');
        }

        return result;
    }
}
