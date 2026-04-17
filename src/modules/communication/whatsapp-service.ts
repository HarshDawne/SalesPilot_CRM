import twilio from 'twilio';
import fs from 'fs/promises';
import path from 'path';
import { AIPersonalizationService } from './ai-personalization-service';

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID || '',
    process.env.TWILIO_AUTH_TOKEN || ''
);

interface WhatsAppTemplate {
    text: string;
    variables: string[];
}

interface WhatsAppConfig {
    to: string; // Phone number in E.164 format
    templateId: string;
    data: Record<string, any>;
    mediaUrls?: string[];
    // AI Personalization (optional)
    useAI?: boolean;
    leadName?: string;
    callTranscript?: string;
    callOutcome?: string;
    leadPreferences?: any;
}

export class WhatsAppService {
    private static async getTemplate(templateId: string): Promise<WhatsAppTemplate> {
        const templatesPath = path.join(process.cwd(), 'data', 'whatsapp-templates.json');
        const content = await fs.readFile(templatesPath, 'utf-8');
        const templates = JSON.parse(content);

        if (!templates[templateId]) {
            throw new Error(`WhatsApp template '${templateId}' not found`);
        }

        return templates[templateId];
    }

    private static renderTemplate(template: WhatsAppTemplate, data: Record<string, any>): string {
        let text = template.text;

        // Replace all variables
        Object.entries(data).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            text = text.replace(regex, String(value || ''));
        });

        // Replace \\n with actual newlines
        text = text.replace(/\\\\n/g, '\\n');

        return text;
    }

    static async sendMessage(config: WhatsAppConfig) {
        try {
            if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
                console.warn('[WhatsAppService] Twilio credentials not configured. Skipping WhatsApp.');
                return { success: false, error: 'WhatsApp service not configured' };
            }

            let message: string;
            let isPersonalized = false;

            // **AI PERSONALIZATION** (NEW!)
            if (config.useAI !== false && config.leadName) { // Default to AI if lead name provided
                try {
                    const personalized = await AIPersonalizationService.personalizeMessage({
                        leadName: config.leadName,
                        leadPhone: config.to,
                        leadPreferences: config.leadPreferences,
                        callTranscript: config.callTranscript,
                        callOutcome: config.callOutcome,
                        propertyData: config.data as any,
                        templateId: config.templateId,
                        channel: 'WHATSAPP'
                    });

                    message = personalized.content;
                    isPersonalized = personalized.isPersonalized;

                    if (isPersonalized) {
                        console.log(`[WhatsAppService] 🤖 AI-personalized WhatsApp for ${config.leadName}`);
                    }
                } catch (aiError) {
                    console.warn('[WhatsAppService] AI personalization failed, using template:', aiError);
                    // Fallback to template
                    const template = await this.getTemplate(config.templateId);
                    message = this.renderTemplate(template, config.data);
                }
            } else {
                // Template only (AI disabled or no lead name)
                const template = await this.getTemplate(config.templateId);
                message = this.renderTemplate(template, config.data);
            }

            // Ensure phone number is in E.164 format
            let toNumber = config.to;
            if (!toNumber.startsWith('+')) {
                toNumber = `+${toNumber}`;
            }

            const result = await client.messages.create({
                from: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886',
                to: `whatsapp:${toNumber}`,
                body: message,
                mediaUrl: config.mediaUrls
            });

            console.log(`[WhatsAppService] WhatsApp sent to ${config.to}:`, result.sid);

            return {
                success: true,
                messageSid: result.sid,
                status: result.status,
                isPersonalized
            };
        } catch (error: any) {
            console.error('[WhatsAppService] Error sending WhatsApp:', error);
            return {
                success: false,
                error: error.message || String(error)
            };
        }
    }

    static async sendSMS(config: {
        to: string;
        message: string;
    }) {
        try {
            if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
                console.warn('[WhatsAppService] Twilio credentials not configured. Skipping SMS.');
                return { success: false, error: 'SMS service not configured' };
            }

            // Ensure phone number is in E.164 format
            let toNumber = config.to;
            if (!toNumber.startsWith('+')) {
                toNumber = `+${toNumber}`;
            }

            const result = await client.messages.create({
                from: process.env.TWILIO_PHONE_NUMBER || '',
                to: toNumber,
                body: config.message
            });

            console.log(`[WhatsAppService] SMS sent to ${config.to}:`, result.sid);

            return {
                success: true,
                messageSid: result.sid,
                status: result.status
            };
        } catch (error: any) {
            console.error('[WhatsAppService] Error sending SMS:', error);
            return {
                success: false,
                error: error.message || String(error)
            };
        }
    }

    static async logMessage(config: {
        campaignId: string;
        leadId: string;
        jobId: string;
        templateId: string;
        to: string;
        channel: 'WHATSAPP' | 'SMS';
        status: string;
        messageSid?: string;
        error?: string;
    }) {
        const messagesPath = path.join(process.cwd(), 'data', 'messages.json');
        const messages = JSON.parse(await fs.readFile(messagesPath, 'utf-8'));

        messages.push({
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            campaignId: config.campaignId,
            leadId: config.leadId,
            jobId: config.jobId,
            channel: config.channel,
            direction: 'OUTBOUND',
            status: config.status,
            templateId: config.templateId,
            content: { to: config.to },
            metadata: {
                twilioMessageSid: config.messageSid,
                error: config.error
            },
            createdAt: new Date().toISOString()
        });

        await fs.writeFile(messagesPath, JSON.stringify(messages, null, 2));
    }
}
