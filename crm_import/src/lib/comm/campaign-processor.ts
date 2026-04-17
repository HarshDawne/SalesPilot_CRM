import { db } from '@/lib/db';
import { MockAdapter } from './adapters/mock-adapter';
import { addTimelineEvent } from '@/lib/timeline';
import { v4 as uuidv4 } from 'uuid';

const dialer = new MockAdapter();

// This function simulates a worker processing a batch of jobs
export async function processCampaignJobs() {
    console.log('[CampaignProcessor] Checking for pending jobs...');

    // 1. Fetch Pending Jobs
    const pendingJobs = db.campaignJobs.findPending();

    // Simple concurrency limit per run
    const BATCH_SIZE = 5;
    const jobsToProcess = pendingJobs.slice(0, BATCH_SIZE);

    for (const job of jobsToProcess) {
        const campaign = db.campaigns.findById(job.campaignId);
        if (!campaign || campaign.status !== 'running') continue;

        const lead = db.leads.findById(job.leadId);
        if (!lead) {
            db.campaignJobs.update(job.id, { status: 'failed', last_error: 'Lead not found' });
            continue;
        }

        // 2. Process Job
        try {
            console.log(`[CampaignProcessor] Processing job ${job.id} for lead ${lead.name}`);

            // Update status to processing
            db.campaignJobs.update(job.id, { status: 'processing', attempt: job.attempt + 1 });

            // Dial
            const { providerCallId } = await dialer.dial({
                id: job.id,
                leadId: lead.id,
                phoneNumber: lead.primaryPhone,
                scriptId: campaign.script_id,
                voiceId: campaign.voice_id
            });

            // Update Job with Provider ID
            db.campaignJobs.update(job.id, {
                status: 'completed', // Optimistic completion, real status comes via webhook
                provider_call_id: providerCallId
            });

            // Log Activity
            addTimelineEvent({
                leadId: lead.id,
                type: 'ai_call_attempt',
                summary: `Campaign call initiated: ${campaign.name}`,
                actor: 'system',
                payload: {
                    campaignId: campaign.id,
                    jobId: job.id,
                    providerCallId
                }
            });

            // Update Campaign Metrics (Simple increment)
            const currentMetrics = campaign.metrics;
            db.campaigns.update(campaign.id, {
                metrics: {
                    ...currentMetrics,
                    attempted: currentMetrics.attempted + 1
                }
            });

        } catch (error: any) {
            console.error(`[CampaignProcessor] Job ${job.id} failed:`, error);

            // Retry Logic
            const maxAttempts = campaign.retry_policy?.attempts || 3;
            if (job.attempt + 1 < maxAttempts) {
                db.campaignJobs.update(job.id, {
                    status: 'retrying',
                    last_error: error.message,
                    // Calculate next attempt time based on backoff
                });
            } else {
                db.campaignJobs.update(job.id, { status: 'failed', last_error: error.message });

                // Fallback Trigger
                if (campaign.fallback === 'whatsapp') {
                    // Send fallback WA
                    addTimelineEvent({
                        leadId: lead.id,
                        type: 'wa_sent',
                        summary: `Fallback WhatsApp sent (Call failed)`,
                        actor: 'system',
                        payload: { campaignId: campaign.id }
                    });
                }
            }
        }
    }
}
