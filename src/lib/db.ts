import fs from 'fs';
import path from 'path';
import type { Property as PropertyManagement, Tower, Unit, UnitReservation } from '../types/property';
import type { RenderRequest } from '../types/render';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

// ============================================================================
// AI-OPTIMIZED PIPELINE STAGES
// ============================================================================

export type LeadStage =
    | "New"
    | "AI_Calling"
    | "Qualified"
    | "Visit_Booked"
    | "Visit_Completed"
    | "Negotiation"
    | "Booking_Done"
    | "Disqualified"
    | "visit_no_show_followup";

export type AICallStatus =
    | "ringing"
    | "connected"
    | "not_reachable"
    | "busy"
    | "no_answer"
    | "failed";

export type DisqualificationReason =
    | "budget_mismatch"
    | "location_mismatch"
    | "no_intent"
    | "not_eligible"
    | "invalid_contact"
    | "duplicate"
    | "wrong_lead_type"
    | "other";

export type IntentLevel = "low" | "medium" | "high";
export type VisitStatus = "pending" | "confirmed" | "rescheduled" | "cancelled" | "checked_in" | "completed" | "no_show";
export type NegotiationStage = "initial" | "under_negotiation" | "offer_accepted" | "offer_rejected";
export type PaymentStatus = "pending" | "paid" | "failed";
export type KYCStatus = "pending" | "submitted" | "verified" | "rejected";

// ============================================================================
// STAGE-SPECIFIC METADATA
// ============================================================================

export interface CaptureDetails {
    formData?: Record<string, any>;
    ip?: string;
    utm?: Record<string, string>;
    referrer?: string;
}

export interface AICallRecord {
    callId: string;
    startTime: string;
    endTime?: string;
    status: AICallStatus;
    duration?: number; // seconds
    transcriptUrl?: string;
    recordingUrl?: string;
    aiConfidence?: number; // 0-100
    notes?: string;
    summary?: string;
}

export interface AICallingMetadata {
    attempts: number;
    callRecords: AICallRecord[];
    followupScheduled: boolean;
    followupAt?: string;
    lastAttemptAt?: string;
}

export interface QualificationData {
    budgetMin?: number;
    budgetMax?: number;
    budgetCurrency: string;
    timeline?: string;
    timelineWeeks?: number;
    preferredLocations: string[];
    propertyType?: string[]; // Changed to array
    configurations?: string[]; // e.g. ["2BHK", "3BHK"]
    preferredFloor?: "low" | "mid" | "high";
    preferredFacing?: string[];
    purpose?: "investment" | "self-use";
    decisionMaker?: string;
    loanPreApproved?: boolean;
    requiredDocs?: string[];
    intentLevel: IntentLevel;
    qualifier: "ai" | "manual";
    qualifiedAt: string;
    qualificationNotes?: string;
}

export interface VisitData {
    visitId: string;
    visitStatus: VisitStatus;
    visitDateTime: string;
    projectId?: string;
    projectName?: string;
    unitId?: string;
    assignedAgentId?: string;
    assignedAgentName?: string;
    meetingPoint?: string;
    confirmationSent: boolean;
    remindersSent: string[];
    geofenceCheck?: boolean;
    checkInTime?: string;
    checkOutTime?: string;
}

export interface VisitFeedback {
    visitedAt: string;
    feedbackRating?: number;
    interestLevelPostVisit?: IntentLevel;
    notes?: string;
    promisedFollowupDate?: string;
    unitsShown?: string[];
}

export interface ProposalData {
    proposalId: string;
    priceOffered: number;
    discountOffered?: number;
    paymentPlan?: Record<string, any>;
    documentsSent: string[];
    negotiationStage: NegotiationStage;
    lastNegotiationAt: string;
    proposalNotes?: string;
}

export interface BookingData {
    bookingId: string;
    amountPaid: number;
    paymentStatus: PaymentStatus;
    kycStatus: KYCStatus;
    unitLocked: boolean;
    unitId?: string;
    projectId?: string;
    bookingAt: string;
    paymentMethod?: string;
    transactionId?: string;
}

export interface DisqualificationData {
    reason: DisqualificationReason;
    disqualifiedBy: "ai" | "manual";
    notes?: string;
    disqualifiedAt: string;
}

// ============================================================================
// CORE LEAD INTERFACE
// ============================================================================

export interface Lead {
    id: string;
    createdAt: string;
    updatedAt: string;

    createdVia: "website" | "form" | "whatsapp" | "ad" | "referral" | "agent_import" | "api";
    sourceCampaignId?: string;
    page_url?: string;
    form_id?: string;

    name: string;
    firstName?: string;
    lastName?: string;
    primaryPhone: string;
    secondaryPhone?: string;
    alternatePhone?: string; // Alias for secondaryPhone
    email?: string;
    preferredContactMethod?: "phone" | "whatsapp" | "email";
    preferredLanguage?: string;
    address?: string;

    interestedProperties?: Array<{
        propertyId: string;
        propertyName: string;
        status: "viewed" | "interested" | "visit_scheduled";
        addedAt: string;
    }>;

    leadTags?: string[];
    assignedAgentId?: string;
    currentStage: LeadStage;
    aiScore?: number;

    // New Scoring Breakdown
    scoreBreakdown?: {
        demographics: number;
        behavior: number;
        engagement: number;
        aiAdjustment: number;
    };

    device?: {
        ip?: string;
        user_agent?: string;
        session_id?: string;
    };
    consent?: boolean;
    meta?: Record<string, any>;
    dedupe_keys?: string[];

    captureDetails?: CaptureDetails;
    aiCalling?: AICallingMetadata;
    qualification?: QualificationData;
    visit?: VisitData;
    visitFeedback?: VisitFeedback;
    proposal?: ProposalData;
    booking?: BookingData;
    disqualification?: DisqualificationData;

    // Legacy fields
    lastContactedAt?: string;
    budgetMin?: number;
    budgetMax?: number;
    preferredLocation?: string;
    unitType?: string;
    preferenceProfile?: QualificationData;
    source?: string;
    utm?: Record<string, string>;
    score?: number;
    status?: string;
    version: number;

    // Compatibility aliases
    phone?: string;
    priority?: string;
}

// ============================================================================
// TIMELINE / AUDIT TRAIL
// ============================================================================

export type TimelineEventType =
    | "lead_created"
    | "ai_call_attempt"
    | "ai_call_connected"
    | "ai_call_failed"
    | "ai_qualified"
    | "ai_disqualified"
    | "visit_booked"
    | "visit_rescheduled"
    | "visit_cancelled"
    | "visit_reminder_sent"
    | "visit_reminder_failed"
    | "visit_checked_in"
    | "visit_completed"
    | "visit_no_show"
    | "calendar_invite_sent"
    | "whatsapp_confirmation_sent"
    | "wa_sent"
    | "wa_delivered"
    | "form_submission"
    | "sms_sent"
    | "email_sent"
    | "proposal_sent"
    | "negotiation_updated"
    | "booking_paid"
    | "payment_failed"
    | "stage_changed"
    | "note_added"
    | "manual_call"
    | "document_uploaded"
    | "agent_assigned"
    | "property_assigned"
    | "unit_reserved"
    | "unit_released"
    | "unit_booked"
    | "reservation_extended"
    | "reservation_expired"
    | "calendar_event_created"
    | "visit_no_show_followup"
    | "visit_feedback_logged"
    | "auto_followup_scheduled";

export interface TimelineEvent {
    id: string;
    leadId: string;
    type: TimelineEventType;
    timestamp: string;
    actor: "system" | "ai" | string; // "system", "ai", or userId
    summary: string;
    payload?: Record<string, any>;
    visibleTo?: "all" | "agent" | "admin";
    immutable: boolean;
    metadata?: Record<string, any>;
}

// ============================================================================
// EXISTING INTERFACES (kept for compatibility)
// ============================================================================

export interface Evidence {
    type: 'transcript' | 'recording' | 'receipt' | 'calendar_event' | 'other';
    url?: string;
    hash?: string;
    timestamp: string;
    origin?: string;
    metadata?: Record<string, any>;
}

export interface Activity {
    id: string;
    leadId: string;
    type: 'form_submission' | 'ai_call' | 'whatsapp' | 'booking' | 'status_change' | 'note' | 'call_initiated' | 'call_qualified' | 'wa_sent' | 'wa_delivered' | 'calendar_event_created';
    summary: string;
    createdAt: string;
    metadata?: Record<string, any>;
    evidence?: Evidence[];
    immutable?: boolean;
    payload?: any;
}

export interface CallLog {
    id: string;
    leadId: string;
    provider: string;
    callSid: string;
    status: string;
    attempt: number;
    transcriptUrl?: string;
    summaryText?: string;
    recordingUrl?: string;
    createdAt: string;
}

export interface Booking {
    id: string;
    leadId: string;
    propertyId?: string;
    projectId?: string;
    unitId?: string;
    slotStart: string;
    slotEnd: string;
    duration: number;
    mode: 'site_visit' | 'virtual_meeting' | 'phone_call';
    status: 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'no_show' | 'in_progress' | 'rescheduled';
    visitType: 'first_visit' | 'follow_up' | 'final_negotiation';
    assignedTo?: string;
    teamId?: string;
    meetingPoint?: string;
    address?: string;
    coordinates?: { lat: number; lng: number };
    notes?: string;
    outcome?: 'interested' | 'not_interested' | 'booked' | 'negotiating';
    feedback?: string;
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
    reminderSent?: boolean;
    reminderTime?: string;

    // Enterprise features (backward compatible - all optional)
    version?: number; // optimistic locking
    agent_id?: string; // primary agent (replaces assignedTo)
    participants?: string[]; // multi-agent support
    source?: 'manual' | 'agent' | 'system' | 'campaign';
    timezone?: string;
    calendar_event_id?: string; // Google Calendar event ID
    reminders_sent?: { t24?: boolean; t2?: boolean; post?: boolean };
    location?: string; // structured location
    travel_time_buffer?: number; // minutes
    meta?: Record<string, any>; // extensible metadata

    // Compatibility aliases
    scheduledAt?: string;
    date?: string;
}

export interface Property {
    id: string;
    projectId: string;
    name: string;
    unitNumber: string;
    type: '1BHK' | '2BHK' | '3BHK' | '4BHK' | 'Duplex' | 'Villa' | 'Penthouse';
    area: number;
    price: number;
    status: 'available' | 'booked' | 'sold';
    floor: number;
    facing: 'North' | 'South' | 'East' | 'West' | 'North-East' | 'North-West' | 'South-East' | 'South-West';
    amenities: string[];
    availableFrom?: string;
    createdAt: string;
    updatedAt: string;

    // Compatibility
    location?: any;
    projectType?: string;
}

export interface Project {
    id: string;
    name: string;
    developer: string;
    location: string;
    address: string;
    totalUnits: number;
    availableUnits: number;
    priceRange: { min: number; max: number };
    status: 'upcoming' | 'under_construction' | 'ready_to_move' | 'completed';
    possessionDate?: string;
    amenities: string[];
    coordinates?: { lat: number; lng: number };
    images?: string[];
    brochure?: string;
    createdAt: string;
    updatedAt: string;
}

export interface AgentProfile {
    status: 'online' | 'offline' | 'busy';
    capacity: number;
    currentLoad: number;
    skills: string[]; // e.g., 'english', 'hindi', 'vip'
    queues: string[]; // e.g., 'project_a', 'website_leads'
    lastAssignedAt?: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'sales' | 'viewer' | 'manager';
    agentProfile?: AgentProfile;
}

// ============================================================================
// COMMUNICATION ENGINE
// ============================================================================

export interface ProviderConfig {
    id: string;
    provider: 'vapi' | 'twilio' | 'exotel' | 'meta';
    name: string;
    enabled: boolean;
    credentials: Record<string, string>; // encrypted in real app
    settings: {
        region?: string;
        phone_number?: string;
        concurrency_limit?: number;
    };
    createdAt: string;
    updatedAt: string;
}

export interface CommSettings {
    retry_policy: {
        default_attempts: number;
        default_backoff: 'linear' | 'exponential';
        default_interval: number; // seconds
    };
    business_hours: {
        start: string; // "09:00"
        end: string; // "19:00"
        timezone: string;
        days: number[]; // [1,2,3,4,5]
    };
    fallback_enabled: boolean;
}

export interface Campaign {
    id: string;
    name: string;
    created_by: string;
    lead_query: any; // filter criteria or list of IDs

    // Property-First Campaign Fields
    inventoryScope?: {
        propertyId?: string;
        towerIds?: string[];
        unitIds?: string[]; // Specific units (e.g. dead stock)
        criteria?: {
            status?: string[];
            minPrice?: number;
            maxPrice?: number;
            type?: string[];
        };
    };
    segmentCriteria?: {
        budgetMin?: number;
        budgetMax?: number;
        locations?: string[];
        intent?: string[];
    };

    script_id: string;
    voice_id?: string;
    mode: 'ai_call' | 'human_call' | 'whatsapp_blast';
    start_at: string;
    status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'failed';
    concurrency: number;
    retry_policy?: {
        attempts: number;
        backoff: 'linear' | 'exponential';
        interval_seconds: number;
    };
    fallback?: 'whatsapp' | 'sms' | 'notify_agent';
    metrics: {
        total: number;
        attempted: number;
        connected: number;
        answered: number;
        qualified: number;
        failed: number;
        cost: number;
    };
    createdAt: string;
    updatedAt: string;
}

export interface CampaignJob {
    id: string;
    campaignId: string;
    leadId: string;
    status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'retrying';
    attempt: number;
    next_attempt_at?: string;
    last_error?: string;
    provider_call_id?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CallActivity extends Activity {
    campaign_id?: string;
    agent_id?: string;
    initiator: 'system' | 'user';
    direction: 'outbound' | 'inbound';
    provider_call_id?: string;
    status: 'queued' | 'ringing' | 'connected' | 'failed' | 'completed' | 'voicemail';
    attempt_number: number;
    recording_url?: string;
    transcript?: string;
    structured_answers?: Record<string, any>;
    duration_seconds?: number;
    cost?: number;
}

export interface WhatsAppMessage {
    id: string;
    leadId: string;
    direction: 'outbound' | 'inbound';
    template_id?: string;
    content?: string; // for inbound or non-template
    media_url?: string;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    provider_msg_id?: string;
    created_at: string;
    metadata?: Record<string, any>;
}

// ============================================================================
// CALENDAR ENTERPRISE ENTITIES
// ============================================================================

export interface AgentAvailability {
    id: string;
    agent_id: string;
    day_of_week?: number; // 0-6 for recurring availability
    date?: string; // for specific date exceptions
    start_time: string; // "09:00"
    end_time: string; // "18:00"
    timezone: string;
    capacity: number; // concurrent visits allowed
    status: 'active' | 'inactive' | 'on_leave';
    createdAt: string;
    updatedAt: string;
}

export interface ProjectAvailability {
    id: string;
    project_id: string;
    concurrent_visit_capacity: number; // max simultaneous visits
    location: { lat: number; lng: number };
    travel_time_minutes: number; // avg travel time from office
    business_hours: { start: string; end: string; days: number[] };
    no_show_grace_minutes?: number; // grace period before marking no-show
    createdAt: string;
    updatedAt: string;
}

export interface VisitParticipant {
    id: string;
    booking_id: string;
    user_id: string;
    role: 'primary' | 'secondary' | 'driver';
    status: 'invited' | 'accepted' | 'declined';
    createdAt: string;
}

export interface NotificationPreference {
    id: string;
    user_id: string;
    channel_priority: ('whatsapp' | 'sms' | 'email' | 'push')[];
    quiet_hours?: { start: string; end: string };
    createdAt: string;
    updatedAt: string;
}

export interface BlackoutDate {
    id: string;
    project_id?: string; // null = all projects
    start_date: string;
    end_date: string;
    reason: string;
    all_day: boolean;
    createdAt: string;
}

export interface VisitConflict {
    id: string;
    booking_a: string;
    booking_b: string;
    conflict_type: 'agent_overlap' | 'unit_lock' | 'capacity_exceeded' | 'travel_time';
    detected_at: string;
    resolved_by?: string;
    resolution?: string;
    status: 'pending' | 'resolved' | 'ignored';
    createdAt: string;
}

export interface VisitReminderJob {
    id: string;
    visit_id: string;
    type: 't24' | 't2' | 'post';
    scheduled_at: string;
    sent_at?: string;
    status: 'pending' | 'sent' | 'failed';
    attempt_count: number;
    last_error?: string;
    channel_used?: 'whatsapp' | 'sms' | 'email' | 'push';
    createdAt: string;
}

// ============================================================================
// DATABASE SCHEMA
// ============================================================================

export interface DatabaseSchema {
    users: User[];
    leads: Lead[];
    timeline: TimelineEvent[];
    activities: Activity[];
    bookings: Booking[];
    properties: Property[];
    projects: Project[];
    callLogs: CallLog[];
    // Comm Engine
    campaigns: Campaign[];
    campaignJobs: CampaignJob[];
    providerConfigs: ProviderConfig[];
    whatsappMessages: WhatsAppMessage[];
    commSettings: CommSettings;
    // Calendar Enterprise
    agentAvailability: AgentAvailability[];
    projectAvailability: ProjectAvailability[];
    visitParticipants: VisitParticipant[];
    notificationPreferences: NotificationPreference[];
    blackoutDates: BlackoutDate[];
    visitConflicts: VisitConflict[];
    visitReminderJobs: VisitReminderJob[];
    // Property Management (New)
    propertyManagement: PropertyManagement[];
    towers: Tower[];
    units: Unit[];
    unitReservations: UnitReservation[];
    renderRequests: RenderRequest[];
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

function readDb(): DatabaseSchema {
    if (!fs.existsSync(DB_PATH)) {
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        return {
            users: [],
            leads: [],
            timeline: [],
            activities: [],
            bookings: [],
            properties: [],
            projects: [],
            callLogs: [],
            campaigns: [],
            campaignJobs: [],
            providerConfigs: [],
            whatsappMessages: [],
            commSettings: {
                retry_policy: { default_attempts: 3, default_backoff: 'exponential', default_interval: 300 },
                business_hours: { start: "09:00", end: "19:00", timezone: "Asia/Kolkata", days: [1, 2, 3, 4, 5] },
                fallback_enabled: true
            },
            agentAvailability: [],
            projectAvailability: [],
            visitParticipants: [],
            notificationPreferences: [],
            blackoutDates: [],
            visitConflicts: [],
            visitReminderJobs: [],
            propertyManagement: [],
            towers: [],
            units: [],
            unitReservations: [],
            renderRequests: []
        };
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
}

function writeDb(data: DatabaseSchema) {
    try {
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // Convert to JSON first to catch circular references early
        const json = JSON.stringify(data, null, 2);
        
        // Atomic write: write to temp file then rename
        const tempPath = `${DB_PATH}.tmp`;
        fs.writeFileSync(tempPath, json);
        fs.renameSync(tempPath, DB_PATH);
    } catch (error) {
        console.error('❌ CRITICAL: Database write failed!', error);
        throw error; // Rethrow to let API handle it
    }
}

export const db = {
    users: {
        findAll: () => readDb().users,
        findById: (id: string) => readDb().users.find((u) => u.id === id),
        update: (id: string, updates: Partial<User>) => {
            const data = readDb();
            const index = data.users.findIndex((u) => u.id === id);
            if (index === -1) return null;
            data.users[index] = { ...data.users[index], ...updates };
            writeDb(data);
            return data.users[index];
        },
    },
    leads: {
        findAll: () => readDb().leads,
        findById: (id: string) => readDb().leads.find((l) => l.id === id),
        findByStage: (stage: LeadStage) => readDb().leads.filter(l => l.currentStage === stage),
        findByPhoneOrEmail: (phone: string, email?: string) => {
            const leads = readDb().leads;
            return leads.find(l => l.primaryPhone === phone || (email && l.email === email));
        },
        create: (lead: Lead) => {
            const data = readDb();
            // Initialize version
            lead.version = 1;
            data.leads.push(lead);
            writeDb(data);
            return lead;
        },
        update: (id: string, updates: Partial<Lead>) => {
            const data = readDb();
            const index = data.leads.findIndex((l) => l.id === id);
            if (index === -1) return null;

            // Optimistic locking check should be done by caller, but we increment version here
            const currentVersion = data.leads[index].version || 1;
            const newVersion = currentVersion + 1;

            data.leads[index] = {
                ...data.leads[index],
                ...updates,
                version: newVersion,
                updatedAt: new Date().toISOString()
            };
            writeDb(data);
            return data.leads[index];
        },
    },
    timeline: {
        findAll: () => readDb().timeline || [],
        findByLeadId: (leadId: string) => {
            const events = readDb().timeline || [];
            return events
                .filter((e) => e.leadId === leadId)
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        },
        findByType: (type: TimelineEventType) => {
            const events = readDb().timeline || [];
            return events.filter((e) => e.type === type);
        },
        create: (event: TimelineEvent) => {
            const data = readDb();
            if (!data.timeline) data.timeline = [];
            data.timeline.push(event);
            writeDb(data);
            return event;
        },
        createMany: (events: TimelineEvent[]) => {
            const data = readDb();
            if (!data.timeline) data.timeline = [];
            data.timeline.push(...events);
            writeDb(data);
            return events;
        },
    },
    activities: {
        findAll: () => readDb().activities,
        findByLeadId: (leadId: string) => readDb().activities.filter((a) => a.leadId === leadId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        create: (activity: Activity) => {
            const data = readDb();
            data.activities.push(activity);
            writeDb(data);
            return activity;
        },
    },
    bookings: {
        findAll: () => readDb().bookings,
        findById: (id: string) => readDb().bookings.find((b) => b.id === id),
        findByLeadId: (leadId: string) => readDb().bookings.filter((b) => b.leadId === leadId),
        findByDateRange: (startDate: string, endDate: string) => {
            return readDb().bookings.filter(b =>
                b.slotStart >= startDate && b.slotStart <= endDate
            );
        },
        create: (booking: Booking) => {
            const data = readDb();
            data.bookings.push(booking);
            writeDb(data);
            return booking;
        },
        update: (id: string, updates: Partial<Booking>) => {
            const data = readDb();
            const index = data.bookings.findIndex((b) => b.id === id);
            if (index === -1) return null;
            data.bookings[index] = { ...data.bookings[index], ...updates, updatedAt: new Date().toISOString() };
            writeDb(data);
            return data.bookings[index];
        },
    },
    properties: {
        findAll: () => readDb().properties || [],
        findById: (id: string) => (readDb().properties || []).find((p) => p.id === id),
        findByProjectId: (projectId: string) => (readDb().properties || []).filter((p) => p.projectId === projectId),
        create: (property: Property) => {
            const data = readDb();
            if (!data.properties) data.properties = [];
            data.properties.push(property);
            writeDb(data);
            return property;
        },
    },
    projects: {
        findAll: () => readDb().projects || [],
        findById: (id: string) => (readDb().projects || []).find((p) => p.id === id),
        create: (project: Project) => {
            const data = readDb();
            if (!data.projects) data.projects = [];
            data.projects.push(project);
            writeDb(data);
            return project;
        },
    },
    callLogs: {
        findAll: () => readDb().callLogs || [],
        findByLeadId: (leadId: string) => (readDb().callLogs || []).filter((c) => c.leadId === leadId),
        create: (callLog: CallLog) => {
            const data = readDb();
            if (!data.callLogs) data.callLogs = [];
            data.callLogs.push(callLog);
            writeDb(data);
            return callLog;
        }
    },
    campaigns: {
        findAll: () => readDb().campaigns || [],
        findById: (id: string) => (readDb().campaigns || []).find(c => c.id === id),
        create: (campaign: Campaign) => {
            const data = readDb();
            if (!data.campaigns) data.campaigns = [];
            data.campaigns.push(campaign);
            writeDb(data);
            return campaign;
        },
        update: (id: string, updates: Partial<Campaign>) => {
            const data = readDb();
            if (!data.campaigns) data.campaigns = [];
            const index = data.campaigns.findIndex(c => c.id === id);
            if (index === -1) return null;
            data.campaigns[index] = { ...data.campaigns[index], ...updates, updatedAt: new Date().toISOString() };
            writeDb(data);
            return data.campaigns[index];
        }
    },
    campaignJobs: {
        findAll: () => readDb().campaignJobs || [],
        findByCampaignId: (campaignId: string) => (readDb().campaignJobs || []).filter(j => j.campaignId === campaignId),
        findPending: () => (readDb().campaignJobs || []).filter(j => j.status === 'pending' || j.status === 'retrying'),
        create: (job: CampaignJob) => {
            const data = readDb();
            if (!data.campaignJobs) data.campaignJobs = [];
            data.campaignJobs.push(job);
            writeDb(data);
            return job;
        },
        update: (id: string, updates: Partial<CampaignJob>) => {
            const data = readDb();
            if (!data.campaignJobs) data.campaignJobs = [];
            const index = data.campaignJobs.findIndex(j => j.id === id);
            if (index === -1) return null;
            data.campaignJobs[index] = { ...data.campaignJobs[index], ...updates, updatedAt: new Date().toISOString() };
            writeDb(data);
            return data.campaignJobs[index];
        }
    },
    providerConfigs: {
        findAll: () => readDb().providerConfigs || [],
        findById: (id: string) => (readDb().providerConfigs || []).find(p => p.id === id),
        create: (config: ProviderConfig) => {
            const data = readDb();
            if (!data.providerConfigs) data.providerConfigs = [];
            data.providerConfigs.push(config);
            writeDb(data);
            return config;
        },
        update: (id: string, updates: Partial<ProviderConfig>) => {
            const data = readDb();
            if (!data.providerConfigs) data.providerConfigs = [];
            const index = data.providerConfigs.findIndex(p => p.id === id);
            if (index === -1) return null;
            data.providerConfigs[index] = { ...data.providerConfigs[index], ...updates, updatedAt: new Date().toISOString() };
            writeDb(data);
            return data.providerConfigs[index];
        }
    },
    whatsappMessages: {
        findAll: () => readDb().whatsappMessages || [],
        findByLeadId: (leadId: string) => (readDb().whatsappMessages || []).filter(m => m.leadId === leadId),
        create: (msg: WhatsAppMessage) => {
            const data = readDb();
            if (!data.whatsappMessages) data.whatsappMessages = [];
            data.whatsappMessages.push(msg);
            writeDb(data);
            return msg;
        }
    },
    // Calendar Enterprise Operations
    agentAvailability: {
        findAll: () => readDb().agentAvailability || [],
        findByAgentId: (agentId: string) => (readDb().agentAvailability || []).filter(a => a.agent_id === agentId),
        findById: (id: string) => (readDb().agentAvailability || []).find(a => a.id === id),
        create: (availability: AgentAvailability) => {
            const data = readDb();
            if (!data.agentAvailability) data.agentAvailability = [];
            data.agentAvailability.push(availability);
            writeDb(data);
            return availability;
        },
        update: (id: string, updates: Partial<AgentAvailability>) => {
            const data = readDb();
            if (!data.agentAvailability) data.agentAvailability = [];
            const index = data.agentAvailability.findIndex(a => a.id === id);
            if (index === -1) return null;
            data.agentAvailability[index] = { ...data.agentAvailability[index], ...updates, updatedAt: new Date().toISOString() };
            writeDb(data);
            return data.agentAvailability[index];
        },
        delete: (id: string) => {
            const data = readDb();
            if (!data.agentAvailability) return false;
            const index = data.agentAvailability.findIndex(a => a.id === id);
            if (index === -1) return false;
            data.agentAvailability.splice(index, 1);
            writeDb(data);
            return true;
        }
    },
    projectAvailability: {
        findAll: () => readDb().projectAvailability || [],
        findByProjectId: (projectId: string) => (readDb().projectAvailability || []).find(p => p.project_id === projectId),
        findById: (id: string) => (readDb().projectAvailability || []).find(p => p.id === id),
        create: (availability: ProjectAvailability) => {
            const data = readDb();
            if (!data.projectAvailability) data.projectAvailability = [];
            data.projectAvailability.push(availability);
            writeDb(data);
            return availability;
        },
        update: (id: string, updates: Partial<ProjectAvailability>) => {
            const data = readDb();
            if (!data.projectAvailability) data.projectAvailability = [];
            const index = data.projectAvailability.findIndex(p => p.id === id);
            if (index === -1) return null;
            data.projectAvailability[index] = { ...data.projectAvailability[index], ...updates, updatedAt: new Date().toISOString() };
            writeDb(data);
            return data.projectAvailability[index];
        }
    },
    visitParticipants: {
        findAll: () => readDb().visitParticipants || [],
        findByBookingId: (bookingId: string) => (readDb().visitParticipants || []).filter(p => p.booking_id === bookingId),
        findByUserId: (userId: string) => (readDb().visitParticipants || []).filter(p => p.user_id === userId),
        create: (participant: VisitParticipant) => {
            const data = readDb();
            if (!data.visitParticipants) data.visitParticipants = [];
            data.visitParticipants.push(participant);
            writeDb(data);
            return participant;
        },
        update: (id: string, updates: Partial<VisitParticipant>) => {
            const data = readDb();
            if (!data.visitParticipants) data.visitParticipants = [];
            const index = data.visitParticipants.findIndex(p => p.id === id);
            if (index === -1) return null;
            data.visitParticipants[index] = { ...data.visitParticipants[index], ...updates };
            writeDb(data);
            return data.visitParticipants[index];
        }
    },
    notificationPreferences: {
        findAll: () => readDb().notificationPreferences || [],
        findByUserId: (userId: string) => (readDb().notificationPreferences || []).find(p => p.user_id === userId),
        create: (pref: NotificationPreference) => {
            const data = readDb();
            if (!data.notificationPreferences) data.notificationPreferences = [];
            data.notificationPreferences.push(pref);
            writeDb(data);
            return pref;
        },
        update: (id: string, updates: Partial<NotificationPreference>) => {
            const data = readDb();
            if (!data.notificationPreferences) data.notificationPreferences = [];
            const index = data.notificationPreferences.findIndex(p => p.id === id);
            if (index === -1) return null;
            data.notificationPreferences[index] = { ...data.notificationPreferences[index], ...updates, updatedAt: new Date().toISOString() };
            writeDb(data);
            return data.notificationPreferences[index];
        }
    },
    blackoutDates: {
        findAll: () => readDb().blackoutDates || [],
        findByProjectId: (projectId: string) => (readDb().blackoutDates || []).filter(b => b.project_id === projectId),
        findGlobal: () => (readDb().blackoutDates || []).filter(b => !b.project_id),
        create: (blackout: BlackoutDate) => {
            const data = readDb();
            if (!data.blackoutDates) data.blackoutDates = [];
            data.blackoutDates.push(blackout);
            writeDb(data);
            return blackout;
        },
        delete: (id: string) => {
            const data = readDb();
            if (!data.blackoutDates) return false;
            const index = data.blackoutDates.findIndex(b => b.id === id);
            if (index === -1) return false;
            data.blackoutDates.splice(index, 1);
            writeDb(data);
            return true;
        }
    },
    visitConflicts: {
        findAll: () => readDb().visitConflicts || [],
        findPending: () => (readDb().visitConflicts || []).filter(c => c.status === 'pending'),
        findById: (id: string) => (readDb().visitConflicts || []).find(c => c.id === id),
        create: (conflict: VisitConflict) => {
            const data = readDb();
            if (!data.visitConflicts) data.visitConflicts = [];
            data.visitConflicts.push(conflict);
            writeDb(data);
            return conflict;
        },
        update: (id: string, updates: Partial<VisitConflict>) => {
            const data = readDb();
            if (!data.visitConflicts) data.visitConflicts = [];
            const index = data.visitConflicts.findIndex(c => c.id === id);
            if (index === -1) return null;
            data.visitConflicts[index] = { ...data.visitConflicts[index], ...updates };
            writeDb(data);
            return data.visitConflicts[index];
        }
    },
    visitReminderJobs: {
        findAll: () => readDb().visitReminderJobs || [],
        findByVisitId: (visitId: string) => (readDb().visitReminderJobs || []).filter(j => j.visit_id === visitId),
        findPending: () => (readDb().visitReminderJobs || []).filter(j => j.status === 'pending'),
        findDue: () => {
            const now = new Date();
            return (readDb().visitReminderJobs || []).filter(j =>
                j.status === 'pending' && new Date(j.scheduled_at) <= now
            );
        },
        create: (job: VisitReminderJob) => {
            const data = readDb();
            if (!data.visitReminderJobs) data.visitReminderJobs = [];
            data.visitReminderJobs.push(job);
            writeDb(data);
            return job;
        },
        update: (id: string, updates: Partial<VisitReminderJob>) => {
            const data = readDb();
            if (!data.visitReminderJobs) data.visitReminderJobs = [];
            const index = data.visitReminderJobs.findIndex(j => j.id === id);
            if (index === -1) return null;
            data.visitReminderJobs[index] = { ...data.visitReminderJobs[index], ...updates };
            writeDb(data);
            return data.visitReminderJobs[index];
        }
    },
    // Property Management Operations
    propertyManagement: {
        findAll: () => readDb().propertyManagement || [],
        findById: (id: string) => (readDb().propertyManagement || []).find(p => p.id === id),
        findByStatus: (status: string) => (readDb().propertyManagement || []).filter(p => p.status === status),
        findByCity: (city: string) => (readDb().propertyManagement || []).filter(p => p.location.city === city),
        create: (property: PropertyManagement) => {
            const data = readDb();
            if (!data.propertyManagement) data.propertyManagement = [];
            const index = data.propertyManagement.findIndex(p => p.id === property.id);
            if (index !== -1) {
                data.propertyManagement[index] = property;
            } else {
                data.propertyManagement.push(property);
            }
            writeDb(data);
            return property;
        },
        update: (id: string, updates: Partial<PropertyManagement>) => {
            const data = readDb();
            if (!data.propertyManagement) data.propertyManagement = [];
            const index = data.propertyManagement.findIndex(p => p.id === id);
            if (index === -1) return null;
            data.propertyManagement[index] = { ...data.propertyManagement[index], ...updates, updatedAt: new Date().toISOString() };
            writeDb(data);
            return data.propertyManagement[index];
        },
        delete: (id: string) => {
            const data = readDb();
            if (!data.propertyManagement) return false;
            const index = data.propertyManagement.findIndex(p => p.id === id);
            if (index === -1) return false;
            data.propertyManagement.splice(index, 1);
            writeDb(data);
            return true;
        }
    },
    towers: {
        findAll: () => readDb().towers || [],
        findById: (id: string) => (readDb().towers || []).find(t => t.id === id),
        findByProperty: (propertyId: string) => (readDb().towers || []).filter(t => t.propertyId === propertyId),
        create: (tower: Tower) => {
            const data = readDb();
            if (!data.towers) data.towers = [];
            const index = data.towers.findIndex(t => t.id === tower.id);
            if (index !== -1) {
                data.towers[index] = tower;
            } else {
                data.towers.push(tower);
            }
            writeDb(data);
            return tower;
        },
        update: (id: string, updates: Partial<Tower>) => {
            const data = readDb();
            if (!data.towers) data.towers = [];
            const index = data.towers.findIndex(t => t.id === id);
            if (index === -1) return null;
            data.towers[index] = { ...data.towers[index], ...updates, updatedAt: new Date().toISOString() };
            writeDb(data);
            return data.towers[index];
        },
        delete: (id: string) => {
            const data = readDb();
            if (!data.towers) return false;
            const index = data.towers.findIndex(t => t.id === id);
            if (index === -1) return false;
            data.towers.splice(index, 1);
            writeDb(data);
            return true;
        }
    },
    units: {
        findAll: () => readDb().units || [],
        findById: (id: string) => (readDb().units || []).find(u => u.id === id),
        findByProperty: (propertyId: string) => (readDb().units || []).filter(u => u.propertyId === propertyId),
        findByTower: (towerId: string) => (readDb().units || []).filter(u => u.towerId === towerId),
        findByStatus: (status: string) => (readDb().units || []).filter(u => u.status === status),
        findAvailable: (propertyId?: string) => {
            const units = readDb().units || [];
            return units.filter(u => u.status === 'AVAILABLE' && (!propertyId || u.propertyId === propertyId));
        },
        create: (unit: Unit) => {
            const data = readDb();
            if (!data.units) data.units = [];
            const index = data.units.findIndex(u => u.id === unit.id);
            if (index !== -1) {
                data.units[index] = unit;
            } else {
                data.units.push(unit);
            }
            writeDb(data);
            return unit;
        },
        update: (id: string, updates: Partial<Unit>) => {
            const data = readDb();
            if (!data.units) data.units = [];
            const index = data.units.findIndex(u => u.id === id);
            if (index === -1) return null;
            data.units[index] = { ...data.units[index], ...updates, updatedAt: new Date().toISOString() };
            writeDb(data);
            return data.units[index];
        },
        delete: (id: string) => {
            const data = readDb();
            if (!data.units) return false;
            const index = data.units.findIndex(u => u.id === id);
            if (index === -1) return false;
            data.units.splice(index, 1);
            writeDb(data);
            return true;
        }
    },
    unitReservations: {
        findAll: () => readDb().unitReservations || [],
        findById: (id: string) => (readDb().unitReservations || []).find(r => r.id === id),
        findByUnit: (unitId: string) => (readDb().unitReservations || []).find(r => r.unitId === unitId && r.isActive),
        findByLead: (leadId: string) => (readDb().unitReservations || []).filter(r => r.leadId === leadId),
        findActive: () => (readDb().unitReservations || []).filter(r => r.isActive),
        findExpired: () => {
            const now = new Date();
            return (readDb().unitReservations || []).filter(r =>
                r.isActive && new Date(r.expiresAt) < now
            );
        },
        create: (reservation: UnitReservation) => {
            const data = readDb();
            if (!data.unitReservations) data.unitReservations = [];
            data.unitReservations.push(reservation);
            writeDb(data);
            return reservation;
        },
        update: (id: string, updates: Partial<UnitReservation>) => {
            const data = readDb();
            if (!data.unitReservations) data.unitReservations = [];
            const index = data.unitReservations.findIndex(r => r.id === id);
            if (index === -1) return null;
            data.unitReservations[index] = { ...data.unitReservations[index], ...updates };
            writeDb(data);
            return data.unitReservations[index];
        },
        delete: (id: string) => {
            const data = readDb();
            if (!data.unitReservations) return false;
            const index = data.unitReservations.findIndex(r => r.id === id);
            if (index === -1) return false;
            data.unitReservations.splice(index, 1);
            writeDb(data);
            return true;
        }
    },
    renderRequests: {
        findAll: () => {
            const data = readDb();
            return data.renderRequests || [];
        },
        findById: (id: string) => {
            const data = readDb();
            return (data.renderRequests || []).find(r => r.id === id);
        },
        create: (request: RenderRequest) => {
            const data = readDb();
            if (!data.renderRequests) data.renderRequests = [];
            data.renderRequests.push(request);
            writeDb(data);
            return request;
        },
        update: (id: string, updates: Partial<RenderRequest>) => {
            const data = readDb();
            if (!data.renderRequests) data.renderRequests = [];
            const index = data.renderRequests.findIndex(r => r.id === id);
            if (index === -1) return null;
            data.renderRequests[index] = { ...data.renderRequests[index], ...updates };
            writeDb(data);
            return data.renderRequests[index];
        },
        delete: (id: string) => {
            const data = readDb();
            if (!data.renderRequests) return false;
            const index = data.renderRequests.findIndex(r => r.id === id);
            if (index === -1) return false;
            data.renderRequests.splice(index, 1);
            writeDb(data);
            return true;
        }
    }
};

export const leadService = {
    getAllResults: () => db.leads.findAll(),
};
