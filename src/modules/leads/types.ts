import { Entity, Priority, UUID } from '../core/types';

import { LeadPropertyContext } from '@/shared/domain';

export enum LeadStatus {
    NEW = 'NEW',
    CONTACTED = 'CONTACTED',
    INTERESTED = 'INTERESTED',
    SITE_VISIT_SCHEDULED = 'SITE_VISIT_SCHEDULED',
    SITE_VISIT_DONE = 'SITE_VISIT_DONE',
    NEGOTIATION = 'NEGOTIATION',
    BOOKING = 'BOOKING',
    WON = 'WON',
    LOST = 'LOST',
    JUNK = 'JUNK',
}

export enum LeadSource {
    WEBSITE = 'WEBSITE',
    FACEBOOK_ADS = 'FACEBOOK_ADS',
    GOOGLE_ADS = 'GOOGLE_ADS',
    REFERRAL = 'REFERRAL',
    SULEKHA = 'SULEKHA',
    MAGICBRICKS = 'MAGICBRICKS',
    WHATSAPP = 'WHATSAPP',
    WALK_IN = 'WALK_IN',
    CHANNEL_PARTNER = 'CHANNEL_PARTNER',
    OTHER = 'OTHER',
}

export interface Lead extends Entity {
    // Basic Info
    name: string;
    phone: string;
    primaryPhone?: string; // For compatibility with db.ts
    email?: string;

    // Qualification
    source: LeadSource;
    createdVia?: string; // For compatibility with db.ts
    status: LeadStatus;
    leadScore: number; // 0-100
    budget?: {
        min: number;
        max: number;
    };
    preferences?: {
        location?: string[];
        configuration?: string[]; // e.g., "2BHK", "3BHK"
        possessionTimeline?: string;
    };

    // Assignment
    assignedTo?: UUID; // User ID of Sales Agent
    assignedAt?: Date;

    // Metadata
    metadata: Record<string, any>; // Flexible for campaign IDs, UTM tags
    tags: string[];

    // AI Enrichment
    aiScore?: number;
    aiReasoning?: string;
    aiTags?: string[];

    // Activity
    lastActivityAt: Date;
    nextFollowUpAt?: Date;

    // Integration with Property Management OS
    propertyContext?: LeadPropertyContext;

    // Compatibility
    updatedAt: Date;
    version?: number;
    priority?: string;
}
