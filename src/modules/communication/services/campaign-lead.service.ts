// CampaignLead Service - State machine implementation

import { CampaignLead, CampaignLeadState, StateTransition } from '../types/campaign.types';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const DATA_PATH = join(process.cwd(), 'data', 'campaign-leads.json');

interface CampaignLeadsData {
    leads: CampaignLead[];
    transitions: StateTransition[];
}

export class CampaignLeadService {

    // =========================================================================
    // STATE MACHINE RULES
    // =========================================================================

    private static readonly VALID_TRANSITIONS: Record<CampaignLeadState, CampaignLeadState[]> = {
        'queued': ['calling', 'stopped', 'failed', 'retry_scheduled'],
        'calling': ['calling', 'completed', 'failed', 'retry_scheduled'],
        'completed': [],
        'failed': [],
        'retry_scheduled': ['queued', 'stopped'],
        'stopped': [],
    };

    private static canTransition(from: CampaignLeadState, to: CampaignLeadState): boolean {
        return this.VALID_TRANSITIONS[from]?.includes(to) || false;
    }

    // =========================================================================
    // DATA PERSISTENCE
    // =========================================================================

    private static readData(): CampaignLeadsData {
        try {
            if (!existsSync(DATA_PATH)) {
                console.log(`[CampaignLeadService] Data file not found, initializing: ${DATA_PATH}`);
                return { leads: [], transitions: [] };
            }
            const data = readFileSync(DATA_PATH, 'utf-8');
            if (!data || data.trim() === '') {
                return { leads: [], transitions: [] };
            }
            const parsed = JSON.parse(data);
            return {
                leads: parsed.leads || [],
                transitions: parsed.transitions || []
            };
        } catch (error) {
            console.error('[CampaignLeadService] Critical error reading data:', error);
            // Don't return empty if file existed but was locked - this prevents "Lead not found" errors
            throw new Error(`Failed to read campaign leads data: ${error}`);
        }
    }

    private static writeData(data: CampaignLeadsData): void {
        try {
            const json = JSON.stringify(data, null, 2);
            writeFileSync(DATA_PATH, json, 'utf-8');
        } catch (error) {
            console.error('[CampaignLeadService] Critical error writing data:', error);
            throw error;
        }
    }

    // =========================================================================
    // CRUD OPERATIONS
    // =========================================================================

    static async createBatch(campaignId: string, leadIds: string[]): Promise<CampaignLead[]> {
        const data = this.readData();
        const now = new Date().toISOString();

        const campaignLeads: CampaignLead[] = leadIds.map(leadId => ({
            id: `cl_${campaignId}_${leadId}_${Math.random().toString(36).slice(2, 10)}`,
            campaignId,
            leadId,
            state: 'queued',
            attemptCount: 0,
            createdAt: now,
            updatedAt: now,
        }));

        data.leads.push(...campaignLeads);
        this.writeData(data);

        console.log(`[CampaignLeadService] Created ${campaignLeads.length} campaign leads for ${campaignId}`);
        return campaignLeads;
    }

    static async getById(id: string): Promise<CampaignLead | null> {
        const data = this.readData();
        return data.leads.find(l => l.id === id) || null;
    }

    static async getByCampaign(campaignId: string, filters?: {
        state?: CampaignLeadState;
    }): Promise<CampaignLead[]> {
        const data = this.readData();
        let leads = data.leads.filter(l => l.campaignId === campaignId);

        if (filters?.state) {
            leads = leads.filter(l => l.state === filters.state);
        }

        return leads;
    }

    static async getByLead(leadId: string): Promise<CampaignLead[]> {
        const data = this.readData();
        return data.leads.filter(l => l.leadId === leadId);
    }

    // =========================================================================
    // STATE TRANSITIONS (CRITICAL)
    // =========================================================================

    static async transition(
        id: string,
        newState: CampaignLeadState,
        reason: string,
        metadata?: {
            callId?: string;
            executionId?: string;
            retryAt?: string;
        }
    ): Promise<CampaignLead | null> {
        const data = this.readData();
        const index = data.leads.findIndex(l => l.id === id);

        if (index === -1) {
            throw new Error(`CampaignLead ${id} not found`);
        }

        const lead = data.leads[index];
        const oldState = lead.state;

        console.log(`[CampaignLeadService] Attempting transition for ${id}: ${oldState} → ${newState} (Reason: ${reason})`);

        // Validate transition
        if (!this.canTransition(oldState, newState)) {
            console.error(`[CampaignLeadService] INVALID TRANSITION: ${oldState} → ${newState}`);
            throw new Error(`Invalid transition from ${oldState} to ${newState}`);
        }

        // Record transition
        const transition: StateTransition = {
            from: oldState,
            to: newState,
            reason,
            timestamp: new Date().toISOString(),
        };
        data.transitions.push(transition);

        // Update lead
        const updates: Partial<CampaignLead> = {
            state: newState,
            previousState: oldState,
            updatedAt: new Date().toISOString(),
        };

        if (metadata?.callId) {
            updates.lastCallId = metadata.callId;
        }

        if (metadata?.executionId) {
            updates.lastExecutionId = metadata.executionId;
        }

        if (metadata?.retryAt) {
            updates.scheduledRetryAt = metadata.retryAt;
        }

        if (newState === 'completed') {
            updates.completedAt = new Date().toISOString();
        }

        if (newState === 'failed') {
            updates.failedAt = new Date().toISOString();
        }

        data.leads[index] = { ...lead, ...updates };
        this.writeData(data);

        console.log(`[CampaignLeadService] Transitioned ${id}: ${oldState} → ${newState} (${reason})`);
        return data.leads[index];
    }

    // =========================================================================
    // CONVENIENCE METHODS
    // =========================================================================

    static async markCalling(id: string, executionId: string): Promise<CampaignLead | null> {
        return this.transition(id, 'calling', 'Call initiated with Bolna', { executionId });
    }

    static async markCompleted(id: string, callId: string): Promise<CampaignLead | null> {
        return this.transition(id, 'completed', 'Call completed successfully', { callId });
    }

    static async markFailed(id: string, callId: string, permanent: boolean = false): Promise<CampaignLead | null> {
        if (permanent) {
            return this.transition(id, 'failed', 'Max retries exceeded', { callId });
        } else {
            const retryAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min
            return this.transition(id, 'retry_scheduled', 'Call failed, will retry', { callId, retryAt });
        }
    }

    static async incrementAttempt(id: string): Promise<CampaignLead | null> {
        const data = this.readData();
        const index = data.leads.findIndex(l => l.id === id);

        if (index === -1) {
            return null;
        }

        data.leads[index].attemptCount += 1;
        data.leads[index].updatedAt = new Date().toISOString();

        this.writeData(data);
        return data.leads[index];
    }

    // =========================================================================
    // QUEUE MANAGEMENT
    // =========================================================================

    static async getNextBatch(campaignId: string, batchSize: number = 10): Promise<CampaignLead[]> {
        const leads = await this.getByCampaign(campaignId, { state: 'queued' });
        return leads.slice(0, batchSize);
    }

    static async getRetryBatch(campaignId: string, batchSize: number = 10): Promise<CampaignLead[]> {
        const data = this.readData();
        const now = new Date().toISOString();

        const leads = data.leads.filter(l =>
            l.campaignId === campaignId &&
            l.state === 'retry_scheduled' &&
            l.scheduledRetryAt &&
            l.scheduledRetryAt <= now
        );

        return leads.slice(0, batchSize);
    }
}
