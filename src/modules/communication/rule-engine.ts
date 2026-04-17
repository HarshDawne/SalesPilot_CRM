import fs from 'fs/promises';
import path from 'path';
import { EmailService } from './email-service';
import { WhatsAppService } from './whatsapp-service';

interface FollowUpAction {
    type: 'EMAIL' | 'WHATSAPP' | 'SMS';
    templateId: string;
    delayMinutes: number;
}

interface FollowUpRule {
    trigger: string; // Call outcome
    actions: FollowUpAction[];
}

interface Campaign {
    campaignId: string;
    followUpRules?: FollowUpRule[];
    [key: string]: any;
}

interface Job {
    id: string;
    campaignId: string;
    leadId: string;
    outcome?: string;
    [key: string]: any;
}

interface FollowUpQueueItem {
    id: string;
    campaignId: string;
    leadId: string;
    jobId: string;
    action: {
        type: string;
        templateId: string;
        scheduledFor: string;
    };
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    retries: number;
    lastError: string | null;
    createdAt: string;
    processedAt: string | null;
}

export class CommunicationRuleEngine {
    /**
     * Process call outcome and queue appropriate follow-up actions
     */
    static async processCallOutcome(jobId: string, outcome: string) {
        try {
            console.log(`[RuleEngine] Processing outcome ${outcome} for job ${jobId}`);

            const job = await this.getJob(jobId);
            if (!job || !job.campaignId) {
                console.warn(`[RuleEngine] Job or campaignId not found for ${jobId}`);
                return;
            }

            const campaign = await this.getCampaign(job.campaignId);
            if (!campaign || !campaign.followUpRules) {
                console.log(`[RuleEngine] No follow-up rules for campaign ${job.campaignId}`);
                return;
            }

            // Find matching rule
            const matchingRules = campaign.followUpRules.filter((r: FollowUpRule) => r.trigger === outcome);
            if (matchingRules.length === 0) {
                console.log(`[RuleEngine] No matching rule for outcome ${outcome}`);
                return;
            }

            // Queue all actions from all matching rules
            for (const rule of matchingRules) {
                for (const action of rule.actions) {
                    const scheduledTime = new Date(Date.now() + action.delayMinutes * 60000);

                    await this.queueFollowUp({
                        campaignId: campaign.campaignId,
                        leadId: job.leadId,
                        jobId: job.id,
                        action: {
                            type: action.type,
                            templateId: action.templateId,
                            scheduledFor: scheduledTime.toISOString()
                        }
                    });

                    console.log(`[RuleEngine] Queued ${action.type} for ${action.delayMinutes}min delay`);
                }
            }
        } catch (error) {
            console.error(`[RuleEngine] Error processing outcome:`, error);
        }
    }

    /**
     * Queue a follow-up action
     */
    private static async queueFollowUp(config: {
        campaignId: string;
        leadId: string;
        jobId: string;
        action: {
            type: string;
            templateId: string;
            scheduledFor: string;
        };
    }) {
        const queuePath = path.join(process.cwd(), 'data', 'follow-up-queue.json');
        const queue: FollowUpQueueItem[] = JSON.parse(await fs.readFile(queuePath, 'utf-8'));

        const item: FollowUpQueueItem = {
            id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            campaignId: config.campaignId,
            leadId: config.leadId,
            jobId: config.jobId,
            action: config.action,
            status: 'PENDING',
            retries: 0,
            lastError: null,
            createdAt: new Date().toISOString(),
            processedAt: null
        };

        queue.push(item);
        await fs.writeFile(queuePath, JSON.stringify(queue, null, 2));
    }

    /**
     * Get job details from jobs.json
     */
    private static async getJob(jobId: string): Promise<Job | null> {
        const jobsPath = path.join(process.cwd(), 'data', 'jobs.json');
        const jobs = JSON.parse(await fs.readFile(jobsPath, 'utf-8'));
        return jobs.find((j: Job) => j.id === jobId) || null;
    }

    /**
     * Get campaign details from campaigns.json
     */
    private static async getCampaign(campaignId: string): Promise<Campaign | null> {
        const campaignsPath = path.join(process.cwd(), 'data', 'campaigns.json');
        const data = JSON.parse(await fs.readFile(campaignsPath, 'utf-8'));
        return data.campaigns?.find((c: Campaign) => c.campaignId === campaignId) || null;
    }

    /**
     * Get lead details from db.json
     */
    private static async getLead(leadId: string) {
        const dbPath = path.join(process.cwd(), 'data', 'db.json');
        const db = JSON.parse(await fs.readFile(dbPath, 'utf-8'));
        return db.leads?.find((l: any) => l.id === leadId) || null;
    }

    /**
     * Get property/project details for templates
     */
    private static async getPropertyData(campaignId: string) {
        // This would fetch from properties.json or projects based on campaign config
        // For now, return mock data
        return {
            propertyName: 'Luxury Heights',
            locality: 'Bandra West',
            city: 'Mumbai',
            bedrooms: '3',
            priceFormatted: '₹2.5 Cr',
            priceRange: '₹2.2 Cr - ₹2.8 Cr',
            areaRange: '1200-1500',
            salesPhone: '+91 98765 43210',
            salesTeamName: 'Citizen Properties Sales Team'
        };
    }

    /**
     * Execute a specific follow-up action
     */
    static async executeFollowUp(item: FollowUpQueueItem) {
        try {
            const lead = await this.getLead(item.leadId);
            if (!lead) {
                throw new Error(`Lead ${item.leadId} not found`);
            }

            // **Get job details for AI context** (NEW!)
            const job = await this.getJob(item.jobId);
            const callTranscript = job?.metadata?.transcript || job?.metadata?.webhookPayload?.transcript;
            const callOutcome = job?.outcome;

            const propertyData = await this.getPropertyData(item.campaignId);

            const templateData = {
                leadName: lead.name,
                ...propertyData
            };

            let result;

            switch (item.action.type.toUpperCase()) {
                case 'WHATSAPP':
                    result = await WhatsAppService.sendMessage({
                        to: lead.primaryPhone || lead.phone,
                        templateId: item.action.templateId,
                        data: templateData,
                        // **AI Personalization Context** (NEW!)
                        leadName: lead.name,
                        callTranscript,
                        callOutcome,
                        leadPreferences: lead.preferences
                    });

                    await WhatsAppService.logMessage({
                        campaignId: item.campaignId,
                        leadId: item.leadId,
                        jobId: item.jobId,
                        channel: 'WHATSAPP',
                        templateId: item.action.templateId,
                        to: lead.primaryPhone || lead.phone,
                        status: result.success ? 'SENT' : 'FAILED',
                        messageSid: result.messageSid,
                        error: result.error
                    });
                    break;

                case 'EMAIL':
                    if (!lead.email) {
                        throw new Error(`Lead ${item.leadId} has no email`);
                    }

                    result = await EmailService.sendTemplateEmail({
                        leadEmail: lead.email,
                        leadName: lead.name,
                        leadPhone: lead.primaryPhone || lead.phone,
                        templateId: item.action.templateId,
                        data: templateData,
                        // **AI Personalization Context** (NEW!)
                        callTranscript,
                        callOutcome,
                        leadPreferences: lead.preferences
                    });

                    await EmailService.logMessage({
                        campaignId: item.campaignId,
                        leadId: item.leadId,
                        jobId: item.jobId,
                        templateId: item.action.templateId,
                        to: lead.email,
                        status: result.success ? 'SENT' : 'FAILED',
                        messageId: result.messageId,
                        error: result.error
                    });
                    break;

                case 'SMS':
                    result = await WhatsAppService.sendSMS({
                        to: lead.primaryPhone || lead.phone,
                        message: `Hi ${lead.name}, follow-up from our call...` // Would use template
                    });

                    await WhatsAppService.logMessage({
                        campaignId: item.campaignId,
                        leadId: item.leadId,
                        jobId: item.jobId,
                        channel: 'SMS',
                        templateId: item.action.templateId,
                        to: lead.primaryPhone || lead.phone,
                        status: result.success ? 'SENT' : 'FAILED',
                        messageSid: result.messageSid,
                        error: result.error
                    });
                    break;

                default:
                    throw new Error(`Unknown action type: ${item.action.type}`);
            }

            if (!result.success) {
                throw new Error(result.error || 'Unknown error');
            }

        } catch (error) {
            throw error;
        }
    }
}
