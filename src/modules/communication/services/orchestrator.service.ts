// Campaign Orchestrator - Batch processor and campaign runner

import { CampaignService } from './campaign.service';
import { CampaignLeadService } from './campaign-lead.service';
import { CallRecordService } from './call-record.service';
import { VoiceService } from '../voice-service';
import { Lead } from '@/modules/leads/types';
import { VOICE_CONFIG } from '@/lib/voice-config';

export class CampaignOrchestrator {

    private static runningCampaigns: Set<string> = new Set();
    private static batchIntervals: Map<string, NodeJS.Timeout> = new Map();
    private static processingLeads: Set<string> = new Set(); // Track leads currently being triggered
    private static failedLeadCache: Set<string> = new Set(); // Circuit breaker for failed leads

    // =========================================================================
    // CAMPAIGN LIFECYCLE
    // =========================================================================

    static async startCampaign(campaignId: string, leadData: Lead[]) {
        console.log(`[Orchestrator] Starting campaign: ${campaignId}`);

        // Check if already running
        if (this.runningCampaigns.has(campaignId)) {
            throw new Error(`Campaign ${campaignId} is already running`);
        }

        // Initialize campaign leads if not already done
        const campaign = await CampaignService.getById(campaignId);
        if (!campaign) {
            throw new Error(`Campaign ${campaignId} not found`);
        }

        // Create CampaignLead records for all leads
        await CampaignLeadService.createBatch(campaignId, campaign.leadIds);

        // Start campaign
        await CampaignService.start(campaignId);
        this.runningCampaigns.add(campaignId);

        // Start batch processor
        this.startBatchProcessor(campaignId, leadData);

        console.log(`[Orchestrator] Campaign ${campaignId} started successfully`);
    }

    static async pauseCampaign(campaignId: string) {
        console.log(`[Orchestrator] Pausing campaign: ${campaignId}`);

        // Stop batch processor
        const interval = this.batchIntervals.get(campaignId);
        if (interval) {
            clearInterval(interval);
            this.batchIntervals.delete(campaignId);
        }

        // Update campaign status
        await CampaignService.pause(campaignId);
        this.runningCampaigns.delete(campaignId);

        console.log(`[Orchestrator] Campaign ${campaignId} paused`);
    }

    static async resumeCampaign(campaignId: string, leadData: Lead[]) {
        console.log(`[Orchestrator] Resuming campaign: ${campaignId}`);

        await CampaignService.start(campaignId);
        this.runningCampaigns.add(campaignId);
        this.startBatchProcessor(campaignId, leadData);

        console.log(`[Orchestrator] Campaign ${campaignId} resumed`);
    }

    static async stopCampaign(campaignId: string) {
        console.log(`[Orchestrator] Stopping campaign: ${campaignId}`);

        // Stop batch processor
        await this.pauseCampaign(campaignId);

        // Mark remaining leads as stopped
        const queuedLeads = await CampaignLeadService.getByCampaign(campaignId, { state: 'queued' });
        for (const lead of queuedLeads) {
            await CampaignLeadService.transition(lead.id, 'stopped', 'Campaign stopped by user');
        }

        // Complete campaign
        await CampaignService.complete(campaignId);

        console.log(`[Orchestrator] Campaign ${campaignId} stopped`);
    }

    // =========================================================================
    // BATCH PROCESSOR - SEQUENTIAL PROCESSING
    // =========================================================================

    private static startBatchProcessor(campaignId: string, leadData: Lead[]) {
        const BATCH_SIZE = 1; // Process one call at a time for sequential execution
        const BATCH_DELAY_MS = 5000; // 5 seconds between batches

        const interval = setInterval(async () => {
            try {
                await this.processBatch(campaignId, leadData, BATCH_SIZE);
            } catch (error) {
                console.error(`[Orchestrator] Batch processing error for ${campaignId}:`, error);
            }
        }, BATCH_DELAY_MS);

        this.batchIntervals.set(campaignId, interval);

        // Process first batch immediately
        this.processBatch(campaignId, leadData, BATCH_SIZE);
    }

    private static async processBatch(campaignId: string, leadData: Lead[], batchSize: number) {
        // Fetch larger batch to allow skipping blocked leads
        const CANDIDATE_SIZE = 10;
        const queuedLeads = await CampaignLeadService.getNextBatch(campaignId, CANDIDATE_SIZE);

        // Get retry batch if needed
        const retryLeads = await CampaignLeadService.getRetryBatch(campaignId, CANDIDATE_SIZE);

        const candidates = [...queuedLeads, ...retryLeads];

        if (candidates.length === 0) {
            console.log(`[Orchestrator] No leads to process for campaign ${campaignId}`);

            // Check if campaign is complete
            const campaign = await CampaignService.getById(campaignId);
            const allLeads = await CampaignLeadService.getByCampaign(campaignId);
            const pendingLeads = allLeads.filter(l =>
                l.state === 'queued' || l.state === 'calling' || l.state === 'retry_scheduled'
            );

            if (pendingLeads.length === 0 && campaign) {
                console.log(`[Orchestrator] Campaign ${campaignId} complete`);
                await this.stopCampaign(campaignId);
            }

            return;
        }

        // STRICT SEQUENTIAL CHECK:
        // User requested: "CALL THE FIRST LEAD... THEN FIRST FETCH DETAILS OF THE CALL... THEN GO FOR THE SECOND CALL"

        // 1. Check for active calls
        const activeCalls = await CampaignLeadService.getByCampaign(campaignId, { state: 'calling' });
        if (activeCalls.length > 0) {
            console.log(`[Orchestrator] Campaign ${campaignId} has active call (${activeCalls[0].id}). Waiting for completion before next lead.`);

            // Poll for sync if it's nearing completion? 
            // Better: The webhook will update state to 'completed', then the NEXT tick will handle the next lead.
            return;
        }

        // 2. Check for RECENTLY completed calls that might not be synced yet
        // This prevents the race condition where state -> completed but webhooks haven't fully enriched cost/transcript
        const { CallRecordService } = await import('./call-record.service');
        const completedRecent = await CampaignLeadService.getByCampaign(campaignId, { state: 'completed' });

        for (const done of completedRecent) {
            // If completed in last 30 seconds, ensure we have costs
            const timeSinceDone = Date.now() - new Date(done.updatedAt).getTime();
            if (timeSinceDone < 30000 && done.lastExecutionId) {
                const records = await CallRecordService.getByExecutionId(done.lastExecutionId);
                const record = records[0]; // Get most recent

                // FIX: Allow cost to be 0 (explicit zero), only block if strictly undefined
                if (!record || record.cost === undefined || record.cost === null) {
                    console.log(`[Orchestrator] Waiting for data sync for lead ${done.id} (completed ${Math.floor(timeSinceDone / 1000)}s ago)`);

                    // Force sync attempt
                    try {
                        const { CampaignSyncService } = await import('./campaign-sync.service');
                        await CampaignSyncService.syncCampaign(campaignId);
                    } catch (e) { console.error('Auto-sync failed', e); }

                    return; // BLOCK next call until this is fully synced
                }
            }
        }


        console.log(`[Orchestrator] Processing batch candidates: ${candidates.length}`);

        // Iterate through candidates to find ONE valid lead to process (Sequential Mode)
        for (const campaignLead of candidates) {
            // Skip if already being processed in another tick
            if (this.processingLeads.has(campaignLead.id)) {
                continue;
            }

            // Self-Healing: If attempt count is absurdly high (indicating stuck loop), force fail
            if (campaignLead.attemptCount > 10) {
                console.error(`[Orchestrator] Lead ${campaignLead.id} has ${campaignLead.attemptCount} attempts! Force failing.`);
                try {
                    await CampaignLeadService.transition(campaignLead.id, 'failed', 'Force failed due to excessive attempts (stuck loop)');
                } catch (e) { console.error('Failed to force fail lead', e); }
                continue;
            }

            // Circuit Breaker: Skip if recently failed to prevent infinite retry loop
            const timeSinceUpdate = Date.now() - new Date(campaignLead.updatedAt).getTime();
            if (timeSinceUpdate < 60000 && campaignLead.attemptCount > 0) {
                console.log(`[Orchestrator] Skipping recently updated lead ${campaignLead.id} (updated ${Math.floor(timeSinceUpdate / 1000)}s ago)`);
                continue;
            }

            // Found a valid lead to process
            try {
                this.processingLeads.add(campaignLead.id);
                // Find lead data
                const lead = leadData.find(l => l.id === campaignLead.leadId);
                if (!lead) {
                    console.warn(`[Orchestrator] Lead ${campaignLead.leadId} not found`);
                    return;
                }

                // Get Campaign Context (Property Details + Knowledge Base)
                const campaign = await CampaignService.getById(campaignId);
                let callContext = {};

                if (campaign?.propertyIds && campaign.propertyIds.length > 0) {
                    try {
                        const { buildPropertyContext, formatContextForAI } = await import('@/lib/property-context-builder');
                        const propertyContext = await buildPropertyContext(campaign.propertyIds, campaign.context);
                        const formattedContext = formatContextForAI(propertyContext);

                        callContext = {
                            ai_prompt: formattedContext,
                            property_count: campaign.propertyIds.length
                        };

                        console.log(`[Orchestrator] Built context for ${campaign.propertyIds.length} properties`);
                    } catch (err) {
                        console.warn(`[Orchestrator] Failed to load property context:`, err);
                    }
                }

                // Increment attempt count
                await CampaignLeadService.incrementAttempt(campaignLead.id);

                // Initiate call
                console.log(`[Orchestrator] Initiating call for lead ${lead.id} (${lead.name})`);
                
                // NEW: Dual-Agent Agent Selection
                const { AGENT_CONFIGS } = await import('@/lib/voice-agents');
                const aiConfig = campaign?.context?.aiConfig;
                const agentMode = aiConfig?.agentMode || 'QUALIFICATION_ONLY';
                
                let agentId = VOICE_CONFIG.AGENT_ID;
                let maxDuration = undefined;

                if (agentMode === 'DUAL_AGENT' || agentMode === 'QUALIFICATION_ONLY') {
                    agentId = AGENT_CONFIGS.AGENT_1_QUALIFICATION.id;
                    maxDuration = aiConfig?.maxDurationAgent1 || AGENT_CONFIGS.AGENT_1_QUALIFICATION.maxDuration;
                    console.log(`[Orchestrator] Using Qualifier Agent (${agentId}) with ${maxDuration}s limit`);
                }

                const result = await VoiceService.triggerCall(lead, callContext, {
                    agentId,
                    maxDuration
                });

                if (result.success && result.data?.execution_id) {
                    const executionId = result.data.execution_id;

                    // Create call record
                    await CallRecordService.create({
                        campaignId,
                        leadId: lead.id,
                        campaignLeadId: campaignLead.id,
                        executionId,
                        phoneNumber: lead.phone || lead.primaryPhone || "",
                        status: 'initiated',
                        agentId,
                        agentType: (agentMode === 'DUAL_AGENT' || agentMode === 'QUALIFICATION_ONLY') ? 'qualifier' : undefined
                    });

                    // Transition to calling
                    await CampaignLeadService.markCalling(campaignLead.id, executionId);

                    // Update campaign metrics
                    await CampaignService.incrementMetric(campaignId, 'queuedLeads', -1);
                    await CampaignService.incrementMetric(campaignId, 'callingLeads', 1);

                    console.log(`[Orchestrator] Call initiated for lead ${lead.id}: ${executionId}`);

                    // Fire-and-forget: relies on webhooks
                    // Removed blocking wait to ensure throughput
                    // await this.waitForCallCompletion(campaignLead.id, executionId, 300000); 

                } else {
                    // Call failed to initiate
                    console.error(`[Orchestrator] Failed to initiate call for lead ${lead.id}:`, result.error);

                    const campaign = await CampaignService.getById(campaignId);
                    const maxRetries = campaign?.rules.maxRetries || 3;

                    try {
                        if (campaignLead.attemptCount >= maxRetries) {
                            await CampaignLeadService.markFailed(campaignLead.id, 'none', true);
                            await CampaignService.incrementMetric(campaignId, 'failedCalls', 1);
                            await CampaignService.incrementMetric(campaignId, 'queuedLeads', -1);
                        } else {
                            await CampaignLeadService.markFailed(campaignLead.id, 'none', false);
                        }
                    } catch (transitionError) {
                        // Critical: if state update fails, blacklist to prevent immediate retry
                        throw transitionError;
                    }
                }
            } catch (error: any) {
                console.error(`[Orchestrator] Error processing lead ${campaignLead.leadId}:`, error);

                // Circuit Breaker: Blacklist lead for 1 minute to prevent infinite loops
                this.failedLeadCache.add(campaignLead.id);
                setTimeout(() => this.failedLeadCache.delete(campaignLead.id), 60000);
                console.warn(`[Orchestrator] Circuit breaker activated for lead ${campaignLead.id}`);

                try {
                    // Ensure lead is moved out of 'queued' even on internal error
                    await CampaignLeadService.transition(campaignLead.id, 'failed', `Orchestrator Error: ${error.message || 'Unknown'}`);
                } catch (transitionError) {
                    console.error(`[Orchestrator] CROSS-CRITICAL: Failed to transition lead after error. Lead is now blacklisted in memory.`, transitionError);
                }
            } finally {
                this.processingLeads.delete(campaignLead.id);
            }

            // Sequential processing: processed one lead (or attempted to), so stop this batch
            break;
        }
    }

    // =========================================================================
    // SEQUENTIAL CALL COMPLETION TRACKING
    // =========================================================================

    private static async waitForCallCompletion(
        campaignLeadId: string,
        executionId: string,
        timeoutMs: number = 300000
    ): Promise<void> {
        const startTime = Date.now();
        const pollInterval = 3000; // Poll every 3 seconds

        console.log(`[Orchestrator] Waiting for call completion: ${executionId}`);

        while (Date.now() - startTime < timeoutMs) {
            const campaignLead = await CampaignLeadService.getById(campaignLeadId);

            if (!campaignLead) {
                console.warn(`[Orchestrator] Campaign lead not found: ${campaignLeadId}`);
                return;
            }

            // Check if call is no longer in 'calling' state
            if (campaignLead.state === 'completed' || campaignLead.state === 'failed') {
                console.log(`[Orchestrator] Call completed with state: ${campaignLead.state}`);

                // Give a small delay to ensure call details are fetched
                await new Promise(resolve => setTimeout(resolve, 2000));

                // NEW: Trigger AI Analysis for Visits
                try {
                    const { CallRecordService } = await import('./call-record.service');
                    const { CallAnalysisService } = await import('../call-analysis-service');

                    const record = await CallRecordService.getLatestByLead(campaignLead.leadId);
                    if (record && record.transcript) {
                        await CallAnalysisService.extractAndScheduleVisit(campaignLead.leadId, record.transcript);
                    }
                } catch (err) {
                    console.error('[Orchestrator] Post-call analysis failed:', err);
                }

                return;
            }

            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }

        console.warn(`[Orchestrator] Call completion timeout for execution: ${executionId}`);
    }
}
