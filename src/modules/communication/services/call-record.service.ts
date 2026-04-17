// CallRecord Service - Append-only call logging

import { CallRecord, CallStatus, CallIntent, CallSentiment } from '../types/campaign.types';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const DATA_PATH = join(process.cwd(), 'data', 'call-records.json');

interface CallRecordsData {
    records: CallRecord[];
}

export class CallRecordService {

    // =========================================================================
    // DATA PERSISTENCE (APPEND-ONLY)
    // =========================================================================

    private static readData(): CallRecordsData {
        try {
            if (!existsSync(DATA_PATH)) {
                return { records: [] };
            }
            const data = readFileSync(DATA_PATH, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error('[CallRecordService] Error reading data:', error);
            return { records: [] };
        }
    }

    private static writeData(data: CallRecordsData): void {
        try {
            writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
        } catch (error) {
            console.error('[CallRecordService] Error writing data:', error);
            throw error;
        }
    }

    // =========================================================================
    // CREATE (APPEND-ONLY - NEVER UPDATE)
    // =========================================================================

    static async create(params: {
        campaignId: string;
        leadId: string;
        campaignLeadId: string;
        executionId: string;
        phoneNumber: string;
        status: CallStatus;
        agentId?: string;
        agentType?: 'qualifier' | 'closer';
    }): Promise<CallRecord> {
        const data = this.readData();

        const record: CallRecord = {
            id: `call_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            campaignId: params.campaignId,
            leadId: params.leadId,
            campaignLeadId: params.campaignLeadId,
            executionId: params.executionId,
            phoneNumber: params.phoneNumber,
            status: params.status,
            agentId: params.agentId,
            agentType: params.agentType,
            needsFollowUp: false,
            createdAt: new Date().toISOString(),
        };

        data.records.push(record);
        this.writeData(data);

        console.log(`[CallRecordService] Created call record: ${record.id}`);
        return record;
    }

    // =========================================================================
    // APPEND METADATA (CREATE NEW RECORD WITH METADATA)
    // =========================================================================

    static async appendWebhookData(executionId: string, webhookData: {
        status?: string;
        startTime?: string;
        endTime?: string;
        duration?: number;
        cost?: number;
        transcript?: string;
        summary?: string;
        recordingUrl?: string;
        intent?: CallIntent;
        sentiment?: CallSentiment;
        outcome?: string;
        metadata?: any;
        rawData?: any;
    }): Promise<CallRecord | null> {
        const data = this.readData();

        // Find the most recent record with this executionId
        const recordIndex = data.records.findIndex(r => r.executionId === executionId);

        if (recordIndex === -1) {
            console.warn(`[CallRecordService] No record found for execution: ${executionId}`);
            return null;
        }

        // Update existing record in place to prevent duplicates
        const existingRecord = data.records[recordIndex];

        // Map status to our internal CallStatus enum if needed
        let internalStatus = existingRecord.status;
        if (webhookData.status === 'completed' || webhookData.status === 'answered' || (webhookData as any).conversation_text) {
            internalStatus = 'completed';
        } else if (['no_answer', 'failed', 'busy', 'declined'].includes(webhookData.status || "")) {
            internalStatus = 'failed';
        }

        const updatedRecord: CallRecord = {
            ...existingRecord,
            status: internalStatus,
            vendorStatus: webhookData.status || existingRecord.vendorStatus,
            startTime: webhookData.startTime || existingRecord.startTime,
            endTime: webhookData.endTime || existingRecord.endTime,
            duration: Number(
                webhookData.duration ??
                webhookData.metadata?.bolnaDetails?.conversation_duration ??
                webhookData.metadata?.bolnaDetails?.duration ??
                existingRecord.duration ?? 0
            ),
            cost: Number(
                webhookData.cost ??
                webhookData.metadata?.bolnaDetails?.total_cost ??
                webhookData.metadata?.bolnaDetails?.cost ??
                webhookData.metadata?.cost ??
                webhookData.metadata?.usage_cost ??
                existingRecord.cost ?? 0
            ),
            transcript: webhookData.transcript || (webhookData as any).conversation_text || webhookData.metadata?.bolnaDetails?.transcript || existingRecord.transcript,
            summary: webhookData.summary || (webhookData as any).call_summary || webhookData.metadata?.bolnaDetails?.summary || existingRecord.summary,
            recordingUrl: webhookData.recordingUrl || webhookData.metadata?.bolnaDetails?.recording_url || existingRecord.recordingUrl,
            intent: webhookData.intent || (webhookData as any).detected_intent || webhookData.metadata?.bolnaDetails?.intent || existingRecord.intent,
            sentiment: webhookData.sentiment || existingRecord.sentiment,
            outcome: webhookData.outcome || existingRecord.outcome,
            rawWebhookData: webhookData.rawData || existingRecord.rawWebhookData,
            metadata: {
                ...((existingRecord as any).metadata || {}),
                ...(webhookData.metadata || {}),
                lastSyncAt: new Date().toISOString()
            },
            needsFollowUp: this.determineFollowUpNeed(webhookData.intent) || existingRecord.needsFollowUp,
            followUpType: this.determineFollowUpType(webhookData.intent) || existingRecord.followUpType,
        };

        data.records[recordIndex] = updatedRecord;
        this.writeData(data);

        console.log(`[CallRecordService] Updated call record for execution: ${executionId}`);

        // NEW: Trigger AI Analysis immediately if transcript is available
        if (updatedRecord.transcript && updatedRecord.transcript.length > 10) {
            try {
                // Dynamic import to avoid circular dependency
                const { CallAnalysisService } = await import('../call-analysis-service');
                console.log(`[CallRecordService] Triggering post-call analysis for ${executionId}`);
                // Fire and forget analysis
                CallAnalysisService.extractAndScheduleVisit(updatedRecord.leadId, updatedRecord.transcript)
                    .catch(err => console.error('[CallRecordService] Analysis failed:', err));
            } catch (err) {
                console.warn('[CallRecordService] Could not load analysis service:', err);
            }
        }

        return updatedRecord;
    }

    private static determineFollowUpNeed(intent?: CallIntent): boolean {
        return intent === 'interested' || intent === 'callback' || intent === 'site_visit';
    }

    private static determineFollowUpType(intent?: CallIntent): CallRecord['followUpType'] {
        switch (intent) {
            case 'interested':
                return 'whatsapp';
            case 'callback':
                return 'callback';
            case 'site_visit':
                return 'whatsapp'; // Send location & details
            default:
                return undefined;
        }
    }

    // =========================================================================
    // READ OPERATIONS
    // =========================================================================

    static async getById(id: string): Promise<CallRecord | null> {
        const data = this.readData();
        return data.records.find(r => r.id === id) || null;
    }

    static async getByExecutionId(executionId: string): Promise<CallRecord[]> {
        const data = this.readData();
        return data.records.filter(r => r.executionId === executionId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    static async getByCampaign(campaignId: string): Promise<CallRecord[]> {
        const data = this.readData();
        return data.records
            .filter(r => r.campaignId === campaignId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    static async getByLead(leadId: string): Promise<CallRecord[]> {
        const data = this.readData();
        return data.records
            .filter(r => r.leadId === leadId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    static async getLatestByLead(leadId: string): Promise<CallRecord | null> {
        const records = await this.getByLead(leadId);
        return records[0] || null;
    }

    // =========================================================================
    // ANALYTICS
    // =========================================================================

    static async getCampaignStats(campaignId: string): Promise<{
        total: number;
        completed: number;
        failed: number;
        avgDuration: number;
        intents: Record<string, number>;
    }> {
        const records = await this.getByCampaign(campaignId);

        const stats = {
            total: records.length,
            completed: records.filter(r => r.status === 'completed').length,
            failed: records.filter(r => r.status === 'failed').length,
            avgDuration: 0,
            intents: {} as Record<string, number>,
        };

        // Calculate average duration
        const durations = records.filter(r => r.duration).map(r => r.duration!);
        if (durations.length > 0) {
            stats.avgDuration = Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length);
        }

        // Count intents
        records.forEach(r => {
            if (r.intent) {
                stats.intents[r.intent] = (stats.intents[r.intent] || 0) + 1;
            }
        });

        return stats;
    }

    // =========================================================================
    // FOLLOW-UP QUEUE
    // =========================================================================

    static async getPendingFollowUps(): Promise<CallRecord[]> {
        const data = this.readData();
        return data.records.filter(r =>
            r.needsFollowUp &&
            !r.followUpScheduledAt // Not yet scheduled
        );
    }
}
