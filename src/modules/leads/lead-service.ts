import { eventBus } from '../core/events';
import { Lead, LeadSource, LeadStatus } from './types';
import { v4 as uuidv4 } from 'uuid'; // We need to install uuid or just use crypto
import { RuleEngine } from './rule-engine';

import { AIService } from '../ai/ai-service';

// Mock Data Store (In-memory for now, can be replaced with DB)
const leadsStore: Lead[] = [];

export class LeadService {

    static async createLead(data: Partial<Lead>): Promise<Lead> {
        // 1. Validation & Defaulting
        if (!data.name || !data.phone) {
            throw new Error('Name and Phone are required');
        }

        // 2. Deduplication (Simple Phone Check)
        const existing = leadsStore.find(l => l.phone === data.phone);
        if (existing) {
            // In real engagement, we might merge or update
            // For now, return existing to prevent dupes
            return existing;
        }

        // 3. Construction
        const newLead: Lead = {
            id: uuidv4(),
            createdAt: new Date(),
            updatedAt: new Date(),
            lastActivityAt: new Date(),

            name: data.name,
            phone: data.phone,
            email: data.email,
            source: data.source || LeadSource.WEBSITE,
            status: LeadStatus.NEW,
            leadScore: 0,

            tags: data.tags || [],
            metadata: data.metadata || {},

            ...data // Override with any specific fields passed
        } as Lead;

        // 4. Run Rule Engine (Qualification)
        const qualification = await RuleEngine.evaluate(newLead);

        newLead.leadScore = qualification.score;
        newLead.assignedTo = qualification.assignedTo;
        if (qualification.tags.length > 0) {
            newLead.tags.push(...qualification.tags);
        }

        // 4.1 AI Analysis (Enrichment)
        try {
            // We await this for the demo to ensure UI updates immediately. 
            // In prod, this might be a background job.
            const aiResult = await AIService.analyzeLead({
                name: newLead.name,
                source: newLead.source,
                budget: newLead.budget,
                preferences: newLead.preferences,
                metadata: newLead.metadata
            });

            newLead.aiScore = aiResult.score;
            newLead.aiReasoning = aiResult.reasoning;
            newLead.aiTags = aiResult.tags || [];

            // Merge AI tags into main tags for unified filtering
            if (newLead.aiTags.length > 0) {
                newLead.tags = [...new Set([...newLead.tags, ...newLead.aiTags])];
            }

            // 4.2 Automated Workflows
            if (newLead.aiScore && newLead.aiScore > 80) {
                // High Intent Lead -> Immediate Action
                eventBus.publish('TASK_CREATED', {
                    leadId: newLead.id,
                    type: 'CALL',
                    priority: 'URGENT',
                    title: `Priority Call: ${newLead.name} (High Intent)`,
                    description: `AI Analysis: ${newLead.aiReasoning}. Call immediately.`,
                    dueDate: new Date()
                });
                // Also auto-tag
                newLead.tags.push('HOT_LEAD');
            }
        } catch (error) {
            console.warn("AI Analysis Failed", error);
        }

        // 5. Save
        leadsStore.push(newLead);

        // 6. Emit Event
        eventBus.publish('LEAD_CREATED', newLead);
        if (newLead.assignedTo) {
            eventBus.publish('LEAD_ASSIGNED', { leadId: newLead.id, agentId: newLead.assignedTo });
        }

        return newLead;
    }

    static async getLeads(filters?: { status?: LeadStatus }): Promise<Lead[]> {
        if (filters?.status) {
            return leadsStore.filter(l => l.status === filters.status);
        }
        return leadsStore;
    }

    static async getLeadById(id: string): Promise<Lead | null> {
        // Use the db utility if possible, or search in store
        const lead = leadsStore.find(l => l.id === id);
        if (lead) return lead;

        // Fallback to the persistent db
        const { db } = await import('@/lib/db');
        return (db.leads.findById(id) as unknown as Lead) || null;
    }
}
