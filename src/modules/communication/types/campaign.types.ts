// Communication Engine 2.0 - Type Definitions

// ============================================================================
// CAMPAIGN TYPES
// ============================================================================

export type CampaignStatus = 'draft' | 'running' | 'paused' | 'completed' | 'cancelled';
export type CampaignType = 'launch' | 'follow-up' | 'clearance' | 'reengagement';
export type CampaignSourceType = 'PROJECT' | 'TOWER' | 'UNIT' | 'MULTI' | 'LEAD_LIST';
export type IntentLevel = 'low' | 'medium' | 'high';

export interface CampaignRules {
    maxRetries: number;
    retryDelayMinutes: number;
    followUpEnabled: boolean;
    followUpDelayMinutes: number;
    workingHoursOnly: boolean;
    workingHours: {
        start: string; // HH:mm format
        end: string;   // HH:mm format
        timezone: string;
    };
}

// ============================================================================
// PROPERTY-BASED CAMPAIGN CONTEXT
// ============================================================================

export interface InventoryScope {
    propertyId?: string;
    towerIds?: string[];
    unitIds?: string[];
    criteria?: {
        status?: string[]; // ['AVAILABLE', 'RESERVED']
        minPrice?: number;
        maxPrice?: number;
        type?: string[]; // ['TWO_BHK', 'THREE_BHK']
    };
}

export interface SegmentCriteria {
    budgetMin?: number;
    budgetMax?: number;
    locations?: string[];
    intent?: IntentLevel[];
    timeline?: string; // e.g., '3_months', '6_months'
}

export interface AIConfig {
    agentMode: 'QUALIFICATION_ONLY' | 'DUAL_AGENT';
    maxDurationAgent1?: number; // seconds, default 60
    qualificationThresholds?: {
        minBudgetMatch?: number; // percentage, e.g., 0.80 for 80%
        minIntentLevel?: IntentLevel;
        maxTimelineMonths?: number;
    };
}

export interface CostLimits {
    maxCostPerCall?: number;
    maxTotalCost?: number;
    autoPauseOnBudget?: boolean;
}

export interface CampaignContext {
    sourceType: CampaignSourceType;
    inventoryScope?: InventoryScope;
    segmentCriteria?: SegmentCriteria;
    aiConfig?: AIConfig;
    costLimits?: CostLimits;
    createdFrom?: {
        page: string; // e.g., 'tower_page', 'property_page'
        entityId: string;
        timestamp: string;
    };
}

export interface Campaign {
    id: string;
    name: string;
    type: CampaignType;
    status: CampaignStatus;

    // Lead filtering
    propertyIds: string[]; // Legacy support
    leadIds: string[];

    // NEW: Property-based campaign context
    context?: CampaignContext;

    // Metrics
    totalLeads: number;
    queuedLeads: number;
    callingLeads: number;
    completedCalls: number;
    successfulCalls: number;
    qualifiedLeads: number; // NEW: Leads that passed Agent 1 qualification
    failedCalls: number;
    retryCount: number;
    totalCost: number; // NEW: Cumulative cost of all calls

    // Configuration
    rules: CampaignRules;
    scriptId?: string;

    // Timestamps
    createdAt: string;
    startedAt?: string;
    pausedAt?: string;
    completedAt?: string;
    updatedAt: string;
}

// ============================================================================
// CAMPAIGN LEAD (STATE MACHINE)
// ============================================================================

export type CampaignLeadState =
    | 'queued'           // Initial state, waiting to be processed
    | 'calling'          // Call initiated
    | 'completed'        // Call finished successfully
    | 'failed'           // Call failed (max retries exceeded)
    | 'retry_scheduled'  // Call failed but will retry
    | 'stopped';         // Campaign stopped, lead won't be processed

export interface CampaignLead {
    id: string;
    campaignId: string;
    leadId: string;

    // State machine
    state: CampaignLeadState;
    previousState?: CampaignLeadState;

    // Call tracking
    attemptCount: number;
    lastCallId?: string;
    lastExecutionId?: string;

    // Scheduling
    nextActionAt?: string;
    scheduledRetryAt?: string;

    // Metadata
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
    failedAt?: string;
}

// State transition rules
export type StateTransition = {
    from: CampaignLeadState;
    to: CampaignLeadState;
    reason: string;
    timestamp: string;
};

// ============================================================================
// CALL RECORD (APPEND-ONLY)
// ============================================================================

export type CallStatus =
    | 'initiated'    // Call sent to provider
    | 'in_progress'  // Call is ongoing
    | 'completed'    // Call finished successfully
    | 'failed'       // Call failed
    | 'no_answer'    // No answer from recipient
    | 'busy'         // Recipient was busy
    | 'voicemail';   // Went to voicemail

export type CallIntent =
    | 'interested'      // Lead is interested
    | 'not_interested'  // Lead is not interested
    | 'callback'        // Lead wants callback
    | 'site_visit'      // Lead wants site visit
    | 'unknown';        // Could not determine intent

export type CallSentiment = 'positive' | 'neutral' | 'negative' | 'unknown';

export interface CallRecord {
    id: string;
    campaignId: string;
    leadId: string;
    campaignLeadId: string;

    // Voice AI integration
    executionId: string;
    vendorStatus?: string;

    // Call details
    status: CallStatus;
    phoneNumber: string;
    agentId?: string;
    agentType?: 'qualifier' | 'closer';
    startTime?: string;
    endTime?: string;
    duration?: number; // in seconds
    cost?: number;     // Call cost

    // AI Analysis
    transcript?: string;
    summary?: string;
    intent?: CallIntent;
    sentiment?: CallSentiment;
    recordingUrl?: string;
    outcome?: string;
    keyPoints?: string[];

    // Follow-up flags
    needsFollowUp: boolean;
    followUpType?: 'whatsapp' | 'email' | 'sms' | 'callback';
    followUpScheduledAt?: string;

    // Raw data (for debugging)
    rawWebhookData?: any;
    metadata?: any;

    // Timestamps
    createdAt: string;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export type EventType =
    | 'call.initiated'
    | 'call.started'
    | 'call.ended'
    | 'call.failed'
    | 'campaign.started'
    | 'campaign.paused'
    | 'campaign.completed'
    | 'lead.state_changed';

export interface CampaignEvent {
    id: string;
    type: EventType;
    campaignId: string;
    leadId?: string;
    callId?: string;

    payload: any;

    processed: boolean;
    processedAt?: string;
    error?: string;

    createdAt: string;
}

// ============================================================================
// FOLLOW-UP TYPES
// ============================================================================

export interface FollowUpAction {
    id: string;
    campaignId: string;
    leadId: string;
    callId: string;

    type: 'whatsapp' | 'email' | 'sms' | 'callback' | 'site_visit';
    status: 'pending' | 'sent' | 'failed';

    // Scheduling
    scheduledAt: string;
    sentAt?: string;

    // Content
    template?: string;
    message?: string;

    // Results
    error?: string;

    createdAt: string;
}

// ============================================================================
// API SECURITY TYPES
// ============================================================================

export interface ApiUsageLog {
    id: string;
    endpoint: string;
    method: string;
    ip: string;
    userAgent?: string;

    // Request details
    requestId: string;
    campaignId?: string;

    // Timing
    timestamp: string;
    duration?: number;

    // Status
    statusCode: number;
    error?: string;
}

export interface AnomalyDetection {
    id: string;
    type: 'unusual_volume' | 'off_hours' | 'suspicious_ip' | 'rapid_requests';
    severity: 'low' | 'medium' | 'high';
    description: string;

    // Context
    endpoint?: string;
    ip?: string;
    requestCount?: number;
    timeWindow?: string;

    // Action taken
    blocked: boolean;
    notified: boolean;

    timestamp: string;
}
