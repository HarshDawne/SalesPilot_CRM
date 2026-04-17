// Campaign Service - Master campaign management with state machine logic

import { Campaign, CampaignStatus, CampaignRules, CampaignContext } from '../types/campaign.types';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const DATA_PATH = join(process.cwd(), 'data', 'campaigns-v2.json');

interface CampaignsData {
    campaigns: Campaign[];
}

export class CampaignService {

    // =========================================================================
    // DATA PERSISTENCE
    // =========================================================================

    private static readData(): CampaignsData {
        try {
            if (!existsSync(DATA_PATH)) {
                return { campaigns: [] };
            }
            const data = readFileSync(DATA_PATH, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error('[CampaignService] Error reading data:', error);
            return { campaigns: [] };
        }
    }

    private static writeData(data: CampaignsData): void {
        try {
            writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
        } catch (error) {
            console.error('[CampaignService] Error writing data:', error);
            throw error;
        }
    }

    // =========================================================================
    // CRUD OPERATIONS
    // =========================================================================

    static async create(params: {
        name: string;
        type: Campaign['type'];
        propertyIds: string[];
        leadIds: string[];
        rules: CampaignRules;
        scriptId?: string;
        context?: CampaignContext; // NEW: Property-based campaign context
    }): Promise<Campaign> {
    
        // VALIDATION RULE: Ensure inventory scope matches source type
        if (params.context) {
            const { sourceType, inventoryScope } = params.context;
            if (sourceType === 'PROJECT' && !inventoryScope?.propertyId) {
                throw new Error("Property ID is required in inventoryScope for PROJECT campaigns");
            }
            if (sourceType === 'TOWER' && (!inventoryScope?.towerIds || inventoryScope.towerIds.length === 0)) {
                throw new Error("Tower IDs are required in inventoryScope for TOWER campaigns");
            }
            if (sourceType === 'UNIT' && (!inventoryScope?.unitIds || inventoryScope.unitIds.length === 0)) {
                throw new Error("Unit IDs are required in inventoryScope for UNIT campaigns");
            }
        }

        const data = this.readData();

        const campaign: Campaign = {
            id: `camp_${Date.now()}`,
            name: params.name,
            type: params.type,
            status: 'draft',
            propertyIds: params.propertyIds,
            leadIds: params.leadIds,
            context: params.context, // Store campaign context
            totalLeads: params.leadIds.length,
            queuedLeads: params.leadIds.length,
            callingLeads: 0,
            completedCalls: 0,
            successfulCalls: 0,
            qualifiedLeads: 0,
            failedCalls: 0,
            retryCount: 0,
            totalCost: 0,
            rules: params.rules,
            scriptId: params.scriptId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        data.campaigns.push(campaign);
        this.writeData(data);

        console.log(`[CampaignService] Created campaign: ${campaign.id}`);
        return campaign;
    }

    static async getById(id: string): Promise<Campaign | null> {
        const data = this.readData();
        return data.campaigns.find(c => c.id === id) || null;
    }

    static async getAll(filters?: {
        status?: CampaignStatus;
        type?: Campaign['type'];
    }): Promise<Campaign[]> {
        const data = this.readData();
        let campaigns = data.campaigns;

        if (filters?.status) {
            campaigns = campaigns.filter(c => c.status === filters.status);
        }

        if (filters?.type) {
            campaigns = campaigns.filter(c => c.type === filters.type);
        }

        return campaigns.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    static async update(id: string, updates: Partial<Campaign>): Promise<Campaign | null> {
        const data = this.readData();
        const index = data.campaigns.findIndex(c => c.id === id);

        if (index === -1) {
            return null;
        }

        const existingCampaign = data.campaigns[index];

        // IMMUTABILITY RULE: Prevent context modification after campaign starts
        if (updates.context && existingCampaign.status !== 'draft') {
            console.warn(`[CampaignService] Cannot modify context for campaign ${id} - campaign already started`);
            throw new Error('Campaign context is immutable after campaign starts');
        }

        data.campaigns[index] = {
            ...data.campaigns[index],
            ...updates,
            updatedAt: new Date().toISOString(),
        };

        this.writeData(data);
        return data.campaigns[index];
    }

    static async delete(id: string): Promise<boolean> {
        const data = this.readData();
        const index = data.campaigns.findIndex(c => c.id === id);

        if (index === -1) {
            return false;
        }

        data.campaigns.splice(index, 1);
        this.writeData(data);
        return true;
    }

    // =========================================================================
    // STATE MANAGEMENT
    // =========================================================================

    static async start(id: string): Promise<Campaign | null> {
        const campaign = await this.getById(id);

        if (!campaign) {
            throw new Error(`Campaign ${id} not found`);
        }

        if (campaign.status !== 'draft' && campaign.status !== 'paused') {
            throw new Error(`Cannot start campaign in status: ${campaign.status}`);
        }

        return this.update(id, {
            status: 'running',
            startedAt: campaign.startedAt || new Date().toISOString(),
        });
    }

    static async pause(id: string): Promise<Campaign | null> {
        const campaign = await this.getById(id);

        if (!campaign) {
            throw new Error(`Campaign ${id} not found`);
        }

        if (campaign.status !== 'running') {
            throw new Error(`Cannot pause campaign in status: ${campaign.status}`);
        }

        return this.update(id, {
            status: 'paused',
            pausedAt: new Date().toISOString(),
        });
    }

    static async complete(id: string): Promise<Campaign | null> {
        return this.update(id, {
            status: 'completed',
            completedAt: new Date().toISOString(),
        });
    }

    static async cancel(id: string): Promise<Campaign | null> {
        return this.update(id, {
            status: 'cancelled',
            completedAt: new Date().toISOString(),
        });
    }

    // =========================================================================
    // METRICS UPDATE
    // =========================================================================

    static async updateMetrics(id: string, metrics: {
        queuedLeads?: number;
        callingLeads?: number;
        completedCalls?: number;
        successfulCalls?: number;
        failedCalls?: number;
        retryCount?: number;
    }): Promise<Campaign | null> {
        const campaign = await this.getById(id);

        if (!campaign) {
            return null;
        }

        return this.update(id, metrics);
    }

    static async incrementMetric(
        id: string,
        metric: 'queuedLeads' | 'callingLeads' | 'completedCalls' | 'successfulCalls' | 'failedCalls' | 'retryCount' | 'qualifiedLeads' | 'totalCost',
        delta: number = 1
    ): Promise<Campaign | null> {
        const campaign = await this.getById(id);

        if (!campaign) {
            return null;
        }

        return this.update(id, {
            [metric]: campaign[metric] + delta,
        });
    }
}
