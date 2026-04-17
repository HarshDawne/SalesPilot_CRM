
import { CampaignLeadService } from './campaign-lead.service';
import { CallRecordService } from './call-record.service';
import { CampaignService } from './campaign.service';
import { VoiceService } from '../voice-service';

export class CampaignSyncService {

    static async syncCampaign(campaignId: string): Promise<{ success: boolean, syncCount: number, message: string }> {
        // 1. Get campaign
        const campaign = await CampaignService.getById(campaignId);
        if (!campaign) {
            throw new Error('Campaign not found');
        }

        // 2. Get all leads for this campaign
        const campaignLeads = await CampaignLeadService.getByCampaign(campaignId);
        console.log(`[CampaignSyncService] ${campaignId} total leads: ${campaignLeads.length}`);


        const syncableLeads = campaignLeads.filter(cl => {
            // Include leads currently being called
            if (cl.state === 'calling') return true;

            // Include leads that have an execution but aren't fully completed/synced
            if (cl.lastExecutionId) {
                // If it's not completed, definitely sync
                if (cl.state !== 'completed') return true;

                // Even if completed, if it has 0 cost or duration, try to sync one more time (maybe the provider was slow)
                // We'll trust our records for this
                return true; // For now, let's just sync everything with an execution ID that isn't too old?
                // Actually, let's check the record
            }
            return false;
        });

        console.log(`[CampaignSyncService] Found ${syncableLeads.length} leads to sync for campaign ${campaignId}`);

        let syncCount = 0;

        for (const cl of syncableLeads) {
            if (!cl.lastExecutionId) continue;

            try {
                const bolnaDetails = await VoiceService.getCallDetails(cl.lastExecutionId);

                if (!bolnaDetails) {
                    console.log(`[CampaignSyncService] No details found for ${cl.lastExecutionId}`);
                    continue;
                }

                // DATA DEBUGGING:
                console.log(`[CampaignSyncService] Raw Bolna Details for ${cl.lastExecutionId}:`, JSON.stringify(bolnaDetails, null, 2));

                // Map status
                let actualStatus = bolnaDetails.status || 'unknown';
                let callOutcome = 'unknown';

                // FORCE COMPLETED if transcript exists (regardless of status from provider)
                const hasTranscript = (bolnaDetails.transcript || bolnaDetails.conversation_text)?.length > 10;
                if (hasTranscript) {
                    actualStatus = 'completed';
                    callOutcome = 'completed';
                }

                if (actualStatus === 'completed' || actualStatus === 'answered') {
                    actualStatus = 'completed';
                    callOutcome = 'completed';
                } else if (['no_answer', 'no-answer', 'not_answered'].includes(actualStatus)) {
                    actualStatus = 'failed';
                    callOutcome = 'no_answer';
                } else if (['declined', 'rejected', 'busy'].includes(actualStatus)) {
                    actualStatus = 'failed';
                    callOutcome = actualStatus === 'busy' ? 'busy' : 'declined';
                } else if (['failed', 'error', 'cancelled'].includes(actualStatus)) {
                    actualStatus = 'failed';
                    callOutcome = actualStatus;
                }

                // EXTRACT COST & DURATION (Handle multiple possible API variations)
                const duration =
                    bolnaDetails.conversation_duration ??
                    bolnaDetails.duration ??
                    bolnaDetails.call_duration ??
                    bolnaDetails.telephony_data?.duration ??
                    (bolnaDetails.metadata?.duration);

                const cost =
                    bolnaDetails.total_cost ??
                    bolnaDetails.cost ??
                    bolnaDetails.usage_cost ??
                    bolnaDetails.cost_breakdown?.total ??
                    (bolnaDetails.metadata?.cost) ??
                    (bolnaDetails.metadata?.usage_cost);

                console.log(`[CampaignSyncService] Extracted Data - Status: ${actualStatus}, Duration: ${duration}, Cost: ${cost} (from Source: ${cl.lastExecutionId})`);

                // Updated Call Record
                const enrichedRecord = await CallRecordService.appendWebhookData(cl.lastExecutionId, {
                    // FORCE OVERWRITE of status if we have better info
                    status: actualStatus,
                    duration: duration !== undefined ? Number(duration) : undefined,
                    cost: cost !== undefined ? Number(cost) : undefined,
                    recordingUrl: bolnaDetails.recording_url || bolnaDetails.telephony_data?.recording_url,
                    transcript: bolnaDetails.transcript || bolnaDetails.conversation_text,
                    summary: bolnaDetails.summary || bolnaDetails.call_summary,
                    intent: bolnaDetails.intent || bolnaDetails.detected_intent || bolnaDetails.extracted_data?.intent,
                    outcome: callOutcome,
                    metadata: {
                        syncSource: 'manual_sync_service',
                        bolnaDetails,
                        syncedAt: new Date().toISOString()
                    }
                });

                if (enrichedRecord) {
                    // Update Lead State logic (Important: Only change state if it matches the Voice AI status outcome)
                    // If local state is 'calling', we definitely update.
                    // If local state is 'failed' but Voice AI says 'completed', we update to completed.

                    const shouldUpdateState = cl.state === 'calling' || (cl.state !== 'completed' && actualStatus === 'completed');

                    if (shouldUpdateState) {
                        if (actualStatus === 'completed') {
                            await CampaignLeadService.markCompleted(cl.id, enrichedRecord.id);

                            // Re-fetch campaign to get fresh metrics before update (rudimentary concurrency handling)
                            // Ideally we atomic increment locally
                            await CampaignService.incrementMetric(campaignId, 'callingLeads', -1);
                            await CampaignService.incrementMetric(campaignId, 'completedCalls', 1);
                            await CampaignService.incrementMetric(campaignId, 'successfulCalls', 1);
                        } else if (actualStatus === 'failed') {
                            const maxRetries = campaign.rules.maxRetries || 3;
                            const permanent = cl.attemptCount >= maxRetries;
                            await CampaignLeadService.markFailed(cl.id, enrichedRecord.id, permanent);
                            await CampaignService.incrementMetric(campaignId, 'callingLeads', -1);
                            if (permanent) {
                                await CampaignService.incrementMetric(campaignId, 'failedCalls', 1);
                            } else {
                                await CampaignService.incrementMetric(campaignId, 'retryCount', 1);
                            }
                        }
                    }

                    syncCount++;
                }

            } catch (err) {
                console.error(`[CampaignSyncService] Error syncing execution ${cl.lastExecutionId}:`, err);
            }
        }



        // 4. FINAL METRIC RECALCULATION (Source of Truth)
        // Instead of relying on incremental updates, we recalculate from the actual call records
        // to ensure the dashboard is always 100% accurate.
        const allRecords = await CallRecordService.getByCampaign(campaignId);

        const metrics = {
            queuedLeads: campaignLeads.filter(l => l.state === 'queued').length,
            callingLeads: campaignLeads.filter(l => l.state === 'calling').length,
            completedCalls: allRecords.filter(r => r.status === 'completed').length,
            successfulCalls: allRecords.filter(r => r.outcome === 'completed').length,
            failedCalls: allRecords.filter(r => r.status === 'failed' || r.outcome === 'failed').length,

            // Advanced Metrics for Deep Dive
            attempted: allRecords.length,
            connected: allRecords.filter(r => r.duration && r.duration > 0).length,
            qualified: allRecords.filter(r => r.intent === 'interested' || r.intent === 'site_visit').length,
            cost: allRecords.reduce((sum, r) => sum + (r.cost || 0), 0)
        };

        // Update Campaign with fresh metrics
        // We cast to any because 'metrics' field in Campaign interface might vary slightly 
        // from the updateMetrics signature, but we want to save these specific counts.
        await CampaignService.update(campaignId, {
            ...metrics,
            // also update the nested metrics object if your frontend uses that
            metrics: {
                attempted: metrics.attempted,
                connected: metrics.connected,
                qualified: metrics.qualified,
                cost: metrics.cost,
                visitsBooked: allRecords.filter(r => r.intent === 'site_visit').length
            }
        } as any);

        return {
            success: true,
            syncCount,
            message: `Synced ${syncCount} jobs for campaign ${campaignId}`
        };
    }

    static async syncAllCampaigns() {
        const { CampaignService } = await import('./campaign.service');
        const campaigns = await CampaignService.getAll();
        const activeCampaigns = campaigns.filter(c => c.status !== 'draft');

        console.log(`[CampaignSyncService] Global Sync: Processing ${activeCampaigns.length} active campaigns`);

        const results = [];
        let totalSynced = 0;
        let errors = 0;

        for (const campaign of activeCampaigns) {
            try {
                console.log(`[CampaignSyncService] Global Sync: Processing ${campaign.id} (${campaign.name})`);
                const result = await this.syncCampaign(campaign.id);
                results.push({ campaignId: campaign.id, ...result });
                totalSynced += (result as any).syncCount || 0;
            } catch (err) {
                console.error(`[CampaignSyncService] Failed to sync campaign ${campaign.id}:`, err);
                errors++;
                results.push({ campaignId: campaign.id, success: false, error: String(err) });
            }
        }

        return {
            success: true,
            synced: totalSynced,
            errors,
            results
        };
    }
}
