import { v4 as uuidv4 } from 'uuid';
import { Lead } from './db';
import { addTimelineEvent } from './timeline';

/**
 * Notification Service - Multi-channel notification system
 * 
 * Channels: WhatsApp, SMS, Email, In-app, Webhooks
 * Features: Templates, retry logic, idempotency, delivery tracking
 * 
 * NOTE: This is a mock implementation for MVP. 
 * In production, integrate with actual services:
 * - WhatsApp Business API
 * - Twilio/AWS SNS for SMS
 * - SendGrid/AWS SES for Email
 */

export type NotificationChannel = "whatsapp" | "sms" | "email" | "in_app" | "webhook";
export type NotificationStatus = "pending" | "sent" | "delivered" | "failed" | "read";

export interface NotificationTemplate {
    id: string;
    name: string;
    channel: NotificationChannel;
    template: string;
    variables: string[];
}

export interface Notification {
    id: string;
    leadId: string;
    channel: NotificationChannel;
    templateId?: string;
    recipient: string; // phone/email/userId
    subject?: string;
    message: string;
    status: NotificationStatus;
    attempts: number;
    maxAttempts: number;
    createdAt: string;
    sentAt?: string;
    deliveredAt?: string;
    failureReason?: string;
    metadata?: Record<string, any>;
}

// ============================================================================
// NOTIFICATION TEMPLATES
// ============================================================================

const TEMPLATES: Record<string, NotificationTemplate> = {
    // WhatsApp Templates
    VISIT_CONFIRMATION_WA: {
        id: "visit_confirmation_wa",
        name: "Visit Confirmation (WhatsApp)",
        channel: "whatsapp",
        template: "Hi {name}, your visit to {projectName} is confirmed on {date} at {time}. Agent: {agentName} ({agentPhone}). Reply YES to confirm or RESCHEDULE to change.",
        variables: ["name", "projectName", "date", "time", "agentName", "agentPhone"]
    },
    VISIT_REMINDER_24H: {
        id: "visit_reminder_24h",
        name: "Visit Reminder 24h",
        channel: "whatsapp",
        template: "Hi {name}, reminder: Your visit to {projectName} is tomorrow at {time}. Location: {meetingPoint}. Contact {agentName} at {agentPhone} if you need to reschedule.",
        variables: ["name", "projectName", "time", "meetingPoint", "agentName", "agentPhone"]
    },
    VISIT_REMINDER_2H: {
        id: "visit_reminder_2h",
        name: "Visit Reminder 2h",
        channel: "whatsapp",
        template: "Hi {name}, your visit to {projectName} is in 2 hours at {time}. See you soon! 🏡",
        variables: ["name", "projectName", "time"]
    },

    // Email Templates
    VISIT_CONFIRMATION_EMAIL: {
        id: "visit_confirmation_email",
        name: "Visit Confirmation (Email)",
        channel: "email",
        template: `Dear {name},

Your site visit has been confirmed!

Project: {projectName}
Date & Time: {date} at {time}
Meeting Point: {meetingPoint}
Agent: {agentName} ({agentPhone})

We look forward to showing you around!

Best regards,
{companyName}`,
        variables: ["name", "projectName", "date", "time", "meetingPoint", "agentName", "agentPhone", "companyName"]
    },

    PROPOSAL_SENT_EMAIL: {
        id: "proposal_sent_email",
        name: "Proposal Sent",
        channel: "email",
        template: `Dear {name},

Thank you for your interest in {projectName}.

Please find attached our proposal for {unitType} at ₹{price}.

Our team will follow up with you shortly.

Best regards,
{companyName}`,
        variables: ["name", "projectName", "unitType", "price", "companyName"]
    },

    // SMS Templates
    VISIT_CONFIRMATION_SMS: {
        id: "visit_confirmation_sms",
        name: "Visit Confirmation (SMS)",
        channel: "sms",
        template: "Visit confirmed: {projectName} on {date} at {time}. Agent: {agentName} {agentPhone}",
        variables: ["projectName", "date", "time", "agentName", "agentPhone"]
    },

    // In-app Templates
    NEW_LEAD_ASSIGNED: {
        id: "new_lead_assigned",
        name: "New Lead Assigned",
        channel: "in_app",
        template: "New Lead — {name} ({propertyType}). AI calling queued.",
        variables: ["name", "propertyType"]
    },

    LEAD_QUALIFIED: {
        id: "lead_qualified",
        name: "Lead Qualified",
        channel: "in_app",
        template: "Lead {name} qualified by AI (score {aiScore}). Visit booked for {date} {time}.",
        variables: ["name", "aiScore", "date", "time"]
    },

    VISIT_NO_SHOW_ALERT: {
        id: "visit_no_show_alert",
        name: "Visit No-Show Alert",
        channel: "in_app",
        template: "⚠️ No-show: {name} missed visit at {time}. Follow up required.",
        variables: ["name", "time"]
    }
};

// ============================================================================
// NOTIFICATION QUEUE (In-memory for MVP)
// ============================================================================

const notificationQueue: Notification[] = [];

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Render a template with variables
 */
function renderTemplate(template: string, variables: Record<string, any>): string {
    let rendered = template;
    for (const [key, value] of Object.entries(variables)) {
        rendered = rendered.replace(new RegExp(`{${key}}`, 'g'), String(value));
    }
    return rendered;
}

/**
 * Send a notification (mock implementation)
 */
async function sendNotification(notification: Notification): Promise<boolean> {
    // Mock implementation - simulate API call
    console.log(`[NOTIFICATION] Sending ${notification.channel} to ${notification.recipient}`);
    console.log(`[NOTIFICATION] Message: ${notification.message}`);

    // Simulate 90% success rate
    const success = Math.random() > 0.1;

    if (success) {
        notification.status = "sent";
        notification.sentAt = new Date().toISOString();

        // Simulate delivery confirmation after 1-2 seconds
        setTimeout(() => {
            notification.status = "delivered";
            notification.deliveredAt = new Date().toISOString();
        }, 1000 + Math.random() * 1000);

        return true;
    } else {
        notification.status = "failed";
        notification.failureReason = "Mock failure for testing";
        return false;
    }
}

/**
 * Retry failed notifications with exponential backoff
 */
async function retryNotification(notification: Notification): Promise<void> {
    if (notification.attempts >= notification.maxAttempts) {
        console.log(`[NOTIFICATION] Max attempts reached for ${notification.id}`);
        return;
    }

    notification.attempts++;
    const backoffMs = Math.pow(2, notification.attempts) * 1000; // 2s, 4s, 8s, etc.

    console.log(`[NOTIFICATION] Retrying ${notification.id} in ${backoffMs}ms (attempt ${notification.attempts})`);

    setTimeout(async () => {
        const success = await sendNotification(notification);
        if (!success && notification.attempts < notification.maxAttempts) {
            await retryNotification(notification);
        }
    }, backoffMs);
}

/**
 * Queue a notification for sending
 */
export async function queueNotification(params: {
    leadId: string;
    channel: NotificationChannel;
    templateId?: string;
    recipient: string;
    subject?: string;
    message?: string;
    variables?: Record<string, any>;
    metadata?: Record<string, any>;
}): Promise<Notification> {

    let message = params.message || "";

    // Render template if provided
    if (params.templateId && TEMPLATES[params.templateId]) {
        const template = TEMPLATES[params.templateId];
        message = renderTemplate(template.template, params.variables || {});
    }

    const notification: Notification = {
        id: uuidv4(),
        leadId: params.leadId,
        channel: params.channel,
        templateId: params.templateId,
        recipient: params.recipient,
        subject: params.subject,
        message,
        status: "pending",
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date().toISOString(),
        metadata: params.metadata
    };

    notificationQueue.push(notification);

    // Send immediately
    const success = await sendNotification(notification);

    // Retry if failed
    if (!success) {
        await retryNotification(notification);
    }

    return notification;
}

// ============================================================================
// NOTIFICATION TRIGGERS (Business Logic)
// ============================================================================

/**
 * Send visit confirmation to lead
 */
export async function sendVisitConfirmation(lead: Lead, visitData: {
    projectName: string;
    date: string;
    time: string;
    meetingPoint: string;
    agentName: string;
    agentPhone: string;
}) {
    const variables = {
        name: lead.name || lead.firstName || "there",
        projectName: visitData.projectName,
        date: visitData.date,
        time: visitData.time,
        meetingPoint: visitData.meetingPoint,
        agentName: visitData.agentName,
        agentPhone: visitData.agentPhone
    };

    // Send WhatsApp
    if (lead.preferredContactMethod === "whatsapp" || !lead.preferredContactMethod) {
        await queueNotification({
            leadId: lead.id,
            channel: "whatsapp",
            templateId: "VISIT_CONFIRMATION_WA",
            recipient: lead.primaryPhone,
            variables
        });

        addTimelineEvent({
            leadId: lead.id,
            type: "whatsapp_confirmation_sent",
            summary: "WhatsApp visit confirmation sent",
            actor: "system"
        });
    }

    // Send Email
    if (lead.email) {
        await queueNotification({
            leadId: lead.id,
            channel: "email",
            templateId: "VISIT_CONFIRMATION_EMAIL",
            recipient: lead.email,
            subject: `Visit Confirmed - ${visitData.projectName}`,
            variables: { ...variables, companyName: "Your Real Estate Company" }
        });

        addTimelineEvent({
            leadId: lead.id,
            type: "email_sent",
            summary: "Email visit confirmation sent",
            actor: "system"
        });
    }

    // Fallback to SMS
    if (!lead.email && lead.preferredContactMethod !== "whatsapp") {
        await queueNotification({
            leadId: lead.id,
            channel: "sms",
            templateId: "VISIT_CONFIRMATION_SMS",
            recipient: lead.primaryPhone,
            variables
        });

        addTimelineEvent({
            leadId: lead.id,
            type: "sms_sent",
            summary: "SMS visit confirmation sent",
            actor: "system"
        });
    }
}

/**
 * Send visit reminders (24h, 2h, 30m before)
 */
export async function sendVisitReminder(lead: Lead, visitData: {
    projectName: string;
    time: string;
    meetingPoint: string;
    agentName: string;
    agentPhone: string;
}, reminderType: "24h" | "2h" | "30m") {

    const variables = {
        name: lead.name || lead.firstName || "there",
        projectName: visitData.projectName,
        time: visitData.time,
        meetingPoint: visitData.meetingPoint,
        agentName: visitData.agentName,
        agentPhone: visitData.agentPhone
    };

    const templateId = reminderType === "24h" ? "VISIT_REMINDER_24H" : "VISIT_REMINDER_2H";

    await queueNotification({
        leadId: lead.id,
        channel: "whatsapp",
        templateId,
        recipient: lead.primaryPhone,
        variables
    });

    addTimelineEvent({
        leadId: lead.id,
        type: "visit_reminder_sent",
        summary: `Visit reminder sent (${reminderType} before)`,
        actor: "system",
        payload: { reminderType }
    });
}

/**
 * Notify agent of new qualified lead
 */
export async function notifyAgentNewLead(agentId: string, lead: Lead) {
    await queueNotification({
        leadId: lead.id,
        channel: "in_app",
        templateId: "NEW_LEAD_ASSIGNED",
        recipient: agentId,
        variables: {
            name: lead.name,
            propertyType: lead.qualification?.propertyType || "Property"
        }
    });
}

/**
 * Notify agent of qualified lead
 */
export async function notifyAgentLeadQualified(agentId: string, lead: Lead, visitDateTime: string) {
    const date = new Date(visitDateTime);

    await queueNotification({
        leadId: lead.id,
        channel: "in_app",
        templateId: "LEAD_QUALIFIED",
        recipient: agentId,
        variables: {
            name: lead.name,
            aiScore: lead.aiScore || 0,
            date: date.toLocaleDateString(),
            time: date.toLocaleTimeString()
        }
    });
}

/**
 * Alert for visit no-show
 */
export async function alertVisitNoShow(agentId: string, lead: Lead, visitTime: string) {
    await queueNotification({
        leadId: lead.id,
        channel: "in_app",
        templateId: "VISIT_NO_SHOW_ALERT",
        recipient: agentId,
        variables: {
            name: lead.name,
            time: visitTime
        }
    });
}

/**
 * Send proposal to lead
 */
export async function sendProposal(lead: Lead, proposalData: {
    projectName: string;
    unitType: string;
    price: number;
}) {
    if (!lead.email) {
        console.log("[NOTIFICATION] Cannot send proposal - no email address");
        return;
    }

    await queueNotification({
        leadId: lead.id,
        channel: "email",
        templateId: "PROPOSAL_SENT_EMAIL",
        recipient: lead.email,
        subject: `Proposal for ${proposalData.projectName}`,
        variables: {
            name: lead.name,
            projectName: proposalData.projectName,
            unitType: proposalData.unitType,
            price: proposalData.price.toLocaleString(),
            companyName: "Your Real Estate Company"
        }
    });

    addTimelineEvent({
        leadId: lead.id,
        type: "proposal_sent",
        summary: `Proposal sent for ${proposalData.projectName}`,
        actor: "system",
        payload: proposalData
    });
}

/**
 * Get notification history for a lead
 */
export function getLeadNotifications(leadId: string): Notification[] {
    return notificationQueue.filter(n => n.leadId === leadId);
}

/**
 * Get all pending notifications
 */
export function getPendingNotifications(): Notification[] {
    return notificationQueue.filter(n => n.status === "pending" || n.status === "failed");
}

export { TEMPLATES };
