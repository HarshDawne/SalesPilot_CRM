import { Resend } from 'resend';
import fs from 'fs/promises';
import path from 'path';
import { AIPersonalizationService } from './ai-personalization-service';

// Lazy initialize Resend to avoid build-time errors if API key is missing
let resendInstance: Resend | null = null;
const getResend = () => {
    if (!resendInstance) {
        resendInstance = new Resend(process.env.RESEND_API_KEY || 'no-key-at-build');
    }
    return resendInstance;
};

interface EmailTemplate {
    subject: string;
    template: string;
    variables: string[];
}

interface EmailConfig {
    leadEmail: string;
    leadName: string;
    leadPhone?: string;
    templateId: string;
    data: Record<string, any>;
    attachments?: string[];
    // AI Personalization (optional)
    useAI?: boolean;
    callTranscript?: string;
    callOutcome?: string;
    leadPreferences?: any;
}

export class EmailService {
    private static async getTemplate(templateId: string): Promise<EmailTemplate> {
        const templatesPath = path.join(process.cwd(), 'data', 'email-templates.json');
        const content = await fs.readFile(templatesPath, 'utf-8');
        const templates = JSON.parse(content);

        if (!templates[templateId]) {
            throw new Error(`Email template '${templateId}' not found`);
        }

        return templates[templateId];
    }

    private static renderTemplate(template: EmailTemplate, data: Record<string, any>): { subject: string; html: string } {
        let subject = template.subject;
        let html = template.template;

        // Replace all variables
        Object.entries(data).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            subject = subject.replace(regex, String(value || ''));
            html = html.replace(regex, String(value || ''));
        });

        return { subject, html };
    }

    static async sendTemplateEmail(config: EmailConfig) {
        try {
            if (!process.env.RESEND_API_KEY) {
                console.warn('[EmailService] RESEND_API_KEY not configured. Skipping email.');
                return { success: false, error: 'Email service not configured' };
            }

            let subject: string;
            let html: string;
            let isPersonalized = false;

            // **AI PERSONALIZATION** (NEW!)
            if (config.useAI !== false) { // Default to AI if not explicitly disabled
                try {
                    const personalized = await AIPersonalizationService.personalizeMessage({
                        leadName: config.leadName,
                        leadPhone: config.leadPhone || '',
                        leadEmail: config.leadEmail,
                        leadPreferences: config.leadPreferences,
                        callTranscript: config.callTranscript,
                        callOutcome: config.callOutcome,
                        propertyData: config.data as any,
                        templateId: config.templateId,
                        channel: 'EMAIL'
                    });

                    subject = personalized.subject || 'Follow-up from our call';
                    html = personalized.content;
                    isPersonalized = personalized.isPersonalized;

                    if (isPersonalized) {
                        console.log(`[EmailService] 🤖 AI-personalized email for ${config.leadName}`);
                    }
                } catch (aiError) {
                    console.warn('[EmailService] AI personalization failed, using template:', aiError);
                    // Fallback to template
                    const template = await this.getTemplate(config.templateId);
                    const rendered = this.renderTemplate(template, {
                        leadName: config.leadName,
                        ...config.data
                    });
                    subject = rendered.subject;
                    html = rendered.html;
                }
            } else {
                // Template only (AI disabled)
                const template = await this.getTemplate(config.templateId);
                const rendered = this.renderTemplate(template, {
                    leadName: config.leadName,
                    ...config.data
                });
                subject = rendered.subject;
                html = rendered.html;
            }

            const resend = getResend();
            const result = await resend.emails.send({
                from: process.env.EMAIL_FROM || 'Sales Team <sales@yourdomain.com>',
                to: config.leadEmail,
                subject,
                html,
                attachments: config.attachments?.map(url => ({
                    filename: path.basename(url),
                    path: url
                }))
            });

            console.log(`[EmailService] Email sent to ${config.leadEmail}:`, result);

            return {
                success: true,
                messageId: result.data?.id,
                isPersonalized,
                error: result.error?.message
            };
        } catch (error) {
            console.error('[EmailService] Error sending email:', error);
            return {
                success: false,
                error: String(error)
            };
        }
    }

    static async logMessage(config: {
        campaignId: string;
        leadId: string;
        jobId: string;
        templateId: string;
        to: string;
        status: string;
        messageId?: string;
        error?: string;
    }) {
        const messagesPath = path.join(process.cwd(), 'data', 'messages.json');
        const messages = JSON.parse(await fs.readFile(messagesPath, 'utf-8'));

        messages.push({
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            campaignId: config.campaignId,
            leadId: config.leadId,
            jobId: config.jobId,
            channel: 'EMAIL',
            direction: 'OUTBOUND',
            status: config.status,
            templateId: config.templateId,
            content: { to: config.to },
            metadata: {
                messageId: config.messageId,
                error: config.error
            },
            createdAt: new Date().toISOString()
        });

        await fs.writeFile(messagesPath, JSON.stringify(messages, null, 2));
    }
}
