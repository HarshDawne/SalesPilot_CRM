import { Entity, UUID } from '../core/types';
import { LeadSource } from '../leads/types';

export enum CampaignStatus {
    DRAFT = 'DRAFT',
    RUNNING = 'RUNNING',
    PAUSED = 'PAUSED',
    COMPLETED = 'COMPLETED',
    ARCHIVED = 'ARCHIVED'
}

export enum CampaignType {
    AI_CALL = 'AI_CALL',
    WHATSAPP_BLAST = 'WHATSAPP_BLAST',
    EMAIL_DRIP = 'EMAIL_DRIP',
    SMS_BLAST = 'SMS_BLAST'
}

export interface Campaign extends Entity {
    name: string;
    type: CampaignType;
    status: CampaignStatus;

    audience: {
        filters: {
            sources?: LeadSource[];
            statuses?: string[];
            tags?: string[];
            createdAtRange?: { start: Date; end: Date };
        };
        excludedTags?: string[];
    };

    config: {
        // For AI Calls
        dailyBudget?: number;
        maxCallsPerDay?: number;
        startTime?: string; // "09:00"
        endTime?: string;   // "20:00"
        retryAttempts?: number;

        // Scripts
        scriptId?: string;

        // WhatsApp/Email
        templateId?: string;
    };

    stats: {
        totalLeads: number;
        processed: number;
        success: number;
        failed: number;
        cost: number;
    };
}

export interface CallJob extends Entity {
    campaignId: UUID;
    leadId: UUID;

    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
    outcome?: 'INTERESTED' | 'NOT_INTERESTED' | 'BUSY' | 'WRONG_NUMBER' | 'CALLBACK_REQUESTED';

    durationSeconds: number;
    recordingUrl?: string; // S3/Cloud storage URL
    transcript?: string;

    aiAnalysis?: {
        sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
        summary: string;
        actionItems: string[];
    };

    attemptCount: number;
    nextRetryAt?: Date;
}
