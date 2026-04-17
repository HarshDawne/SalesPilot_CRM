// Follow-up Service - Intent detection and rule-based actions

import { CallRecord, CallIntent } from '../types/campaign.types';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const WHATSAPP_TEMPLATES_PATH = join(process.cwd(), 'data', 'whatsapp-templates.json');
const EMAIL_TEMPLATES_PATH = join(process.cwd(), 'data', 'email-templates.json');

interface FollowUpRule {
    id: string;
    intent: CallIntent;
    delayMinutes: number;
    channels: ('whatsapp' | 'email' | 'sms')[];
    templateId?: string;
    priority: 'high' | 'medium' | 'low';
}

const DEFAULT_RULES: FollowUpRule[] = [
    {
        id: 'interested',
        intent: 'interested',
        delayMinutes: 5,
        channels: ['whatsapp', 'email'],
        priority: 'high',
    },
    {
        id: 'site_visit',
        intent: 'site_visit',
        delayMinutes: 2,
        channels: ['whatsapp'],
        priority: 'high',
    },
    {
        id: 'callback',
        intent: 'callback',
        delayMinutes: 30,
        channels: ['whatsapp'],
        priority: 'medium',
    },
];

export class FollowUpService {

    // =========================================================================
    // INTENT DETECTION
    // =========================================================================

    static detectIntent(transcript?: string, summary?: string): CallIntent {
        if (!transcript && !summary) {
            return 'unknown';
        }

        const text = `${transcript || ''} ${summary || ''}`.toLowerCase();

        // Intent keywords
        const interestedKeywords = ['interested', 'yes', 'tell me more', 'sounds good', 'i like'];
        const notInterestedKeywords = ['not interested', 'no thanks', 'not now', 'busy'];
        const siteVisitKeywords = ['site visit', 'want to see', 'show me', 'visit', 'come see'];
        const callbackKeywords = ['call back', 'call later', 'call me', 'reach out'];

        // Check for site visit (highest priority)
        if (siteVisitKeywords.some(kw => text.includes(kw))) {
            return 'site_visit';
        }

        // Check for callback
        if (callbackKeywords.some(kw => text.includes(kw))) {
            return 'callback';
        }

        // Check for interested
        if (interestedKeywords.some(kw => text.includes(kw))) {
            return 'interested';
        }

        // Check for not interested
        if (notInterestedKeywords.some(kw => text.includes(kw))) {
            return 'not_interested';
        }

        return 'unknown';
    }

    // =========================================================================
    // RULE ENGINE
    // =========================================================================

    static getFollowUpActions(callRecord: CallRecord): {
        shouldFollowUp: boolean;
        actions: Array<{
            channel: 'whatsapp' | 'email' | 'sms';
            delayMinutes: number;
            templateId?: string;
            priority: string;
        }>;
    } {
        const intent = callRecord.intent || 'unknown';

        // Find matching rule
        const rule = DEFAULT_RULES.find(r => r.intent === intent);

        if (!rule) {
            return { shouldFollowUp: false, actions: [] };
        }

        const actions = rule.channels.map(channel => ({
            channel,
            delayMinutes: rule.delayMinutes,
            templateId: rule.templateId,
            priority: rule.priority,
        }));

        return { shouldFollowUp: true, actions };
    }

    // =========================================================================
    // CHANNEL EXECUTION
    // =========================================================================

    static async sendWhatsApp(params: {
        phoneNumber: string;
        leadName: string;
        templateId?: string;
        propertyName?: string;
    }): Promise<{ success: boolean; error?: string }> {
        try {
            console.log(`[FollowUp] Sending WhatsApp to ${params.phoneNumber}`);

            // Read templates
            let templates: any = {};
            if (existsSync(WHATSAPP_TEMPLATES_PATH)) {
                const data = readFileSync(WHATSAPP_TEMPLATES_PATH, 'utf-8');
                templates = JSON.parse(data);
            }

            const template = templates[params.templateId || 'default'] || {
                message: `Hi ${params.leadName}, thank you for your interest! Our team will contact you shortly with more details about ${params.propertyName || 'our properties'}.`
            };

            // TODO: Integrate with actual WhatsApp service (Twilio/etc)
            // For now, just log
            console.log(`[FollowUp] WhatsApp message: ${template.message}`);

            return { success: true };
        } catch (error) {
            console.error('[FollowUp] WhatsApp error:', error);
            return { success: false, error: String(error) };
        }
    }

    static async sendEmail(params: {
        email: string;
        leadName: string;
        templateId?: string;
        propertyName?: string;
    }): Promise<{ success: boolean; error?: string }> {
        try {
            console.log(`[FollowUp] Sending email to ${params.email}`);

            // Read templates
            let templates: any = {};
            if (existsSync(EMAIL_TEMPLATES_PATH)) {
                const data = readFileSync(EMAIL_TEMPLATES_PATH, 'utf-8');
                templates = JSON.parse(data);
            }

            const template = templates[params.templateId || 'default'] || {
                subject: 'Thank you for your interest',
                body: `Dear ${params.leadName},\n\nThank you for expressing interest in ${params.propertyName || 'our properties'}. Our team will reach out to you shortly.\n\nBest regards,\nCitizen Properties`
            };

            // TODO: Integrate with actual email service (Resend/etc)
            console.log(`[FollowUp] Email subject: ${template.subject}`);

            return { success: true };
        } catch (error) {
            console.error('[FollowUp] Email error:', error);
            return { success: false, error: String(error) };
        }
    }

    static async sendSMS(params: {
        phoneNumber: string;
        message: string;
    }): Promise<{ success: boolean; error?: string }> {
        try {
            console.log(`[FollowUp] Sending SMS to ${params.phoneNumber}`);

            // TODO: Integrate with actual SMS service
            console.log(`[FollowUp] SMS message: ${params.message}`);

            return { success: true };
        } catch (error) {
            console.error('[FollowUp] SMS error:', error);
            return { success: false, error: String(error) };
        }
    }

    // =========================================================================
    // AUTO-TRIGGER
    // =========================================================================

    static async processCallForFollowUp(callRecord: CallRecord, leadData: {
        name: string;
        phone: string;
        email?: string;
    }): Promise<void> {
        const { shouldFollowUp, actions } = this.getFollowUpActions(callRecord);

        if (!shouldFollowUp) {
            console.log(`[FollowUp] No follow-up needed for call ${callRecord.id}`);
            return;
        }

        console.log(`[FollowUp] Processing ${actions.length} follow-up actions for call ${callRecord.id}`);

        for (const action of actions) {
            // Schedule based on delay
            setTimeout(async () => {
                switch (action.channel) {
                    case 'whatsapp':
                        await this.sendWhatsApp({
                            phoneNumber: leadData.phone,
                            leadName: leadData.name,
                            templateId: action.templateId,
                        });
                        break;

                    case 'email':
                        if (leadData.email) {
                            await this.sendEmail({
                                email: leadData.email,
                                leadName: leadData.name,
                                templateId: action.templateId,
                            });
                        }
                        break;

                    case 'sms':
                        await this.sendSMS({
                            phoneNumber: leadData.phone,
                            message: `Hi ${leadData.name}, thank you for your interest! We'll be in touch soon.`,
                        });
                        break;
                }
            }, action.delayMinutes * 60 * 1000);
        }
    }
}
