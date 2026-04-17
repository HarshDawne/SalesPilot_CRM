import { NextRequest, NextResponse } from 'next/server';
import { CallRecordService } from '@/modules/communication/services/call-record.service';
import { CampaignLeadService } from '@/modules/communication/services/campaign-lead.service';
import { CampaignService } from '@/modules/communication/services/campaign.service';
import { VoiceService } from '@/modules/communication/voice-service';
import { SecurityUtils } from '@/modules/communication/utils/security.utils';

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        const startTime = Date.now();

        // Log API usage
        SecurityUtils.logApiUsage({
            endpoint: '/api/calls/webhook',
            method: 'POST',
            ip,
            userAgent: request.headers.get('user-agent') || undefined,
            statusCode: 200,
        });

        // Parse webhook payload
        const payload = await request.json();

        console.log('[Webhook] Received event:', payload);

        // Extract key fields
        const {
            execution_id,
            status,
            call_duration,
            recording_url,
            transcript,
            to: phoneNumber,
        } = payload;

        if (!execution_id) {
            return NextResponse.json(
                { error: 'Missing execution_id' },
                { status: 400 }
            );
        }

        // Find existing call records by execution_id
        const existingRecords = await CallRecordService.getByExecutionId(execution_id);

        if (existingRecords.length === 0) {
            console.warn(`[Webhook] No call record found for execution: ${execution_id}`);
            return NextResponse.json({
                success: false,
                message: 'Call record not found'
            });
        }

        const latestRecord = existingRecords[existingRecords.length - 1];

        // Fetch complete call details from Voice API
        let providerDetails = null;
        try {
            providerDetails = await VoiceService.getCallDetails(execution_id);
            console.log('[Webhook] Provider details fetched:', providerDetails);
        } catch (error) {
            console.warn('[Webhook] Could not fetch provider details:', error);
        }

        // Determine actual call status from provider response
        // Provider statuses: completed, failed, no_answer, declined, busy, cancelled
        let actualStatus = status || providerDetails?.status || 'unknown';
        let callOutcome = 'unknown';

        // Map Bolna statuses to our system
        if (actualStatus === 'completed' || actualStatus === 'answered') {
            actualStatus = 'completed';
            callOutcome = 'completed';
        } else if (actualStatus === 'no_answer' || actualStatus === 'no-answer' || actualStatus === 'not_answered') {
            actualStatus = 'failed';
            callOutcome = 'no_answer';
        } else if (actualStatus === 'declined' || actualStatus === 'rejected' || actualStatus === 'busy') {
            actualStatus = 'failed';
            callOutcome = actualStatus === 'busy' ? 'busy' : 'declined';
        } else if (actualStatus === 'failed' || actualStatus === 'error') {
            actualStatus = 'failed';
            callOutcome = 'failed';
        } else if (actualStatus === 'cancelled') {
            actualStatus = 'failed';
            callOutcome = 'cancelled';
        }

        console.log(`[Webhook] Status mapping: ${status} → ${actualStatus} (outcome: ${callOutcome})`);

        // NEW: Agent Type detection from record
        const currentAgentType = latestRecord.agentType;
        const currentAgentId = latestRecord.agentId;

        // Append enriched data to call record
        const enrichedRecord = await CallRecordService.appendWebhookData(execution_id, {
            status: actualStatus,
            duration: call_duration || providerDetails?.call_duration || providerDetails?.duration || 0,
            recordingUrl: recording_url || providerDetails?.recording_url,
            transcript: transcript || providerDetails?.transcript || providerDetails?.conversation_text,
            summary: providerDetails?.summary || providerDetails?.call_summary,
            intent: providerDetails?.intent || providerDetails?.detected_intent,
            outcome: callOutcome,
            metadata: {
                webhookPayload: payload,
                providerDetails: providerDetails,
                receivedAt: new Date().toISOString(),
                agentType: currentAgentType,
            },
        });

        if (!enrichedRecord) {
            return NextResponse.json({
                success: false,
                message: 'Failed to append webhook data'
            });
        }

        // Update CampaignLead state based on webhook status
        const campaignLead = await CampaignLeadService.getById(latestRecord.campaignLeadId);
        const campaign = await CampaignService.getById(latestRecord.campaignId);

        if (campaignLead && campaign) {
            if (actualStatus === 'completed') {
                
                // DUAL-AGENT HANDOFF LOGIC
                const aiConfig = campaign.context?.aiConfig;
                const transcriptText = enrichedRecord.transcript || "";
                const intent = enrichedRecord.intent || "unknown";
                
                let isQualified = false;
                let qualificationResult = null;

                if (aiConfig?.agentMode === 'DUAL_AGENT' && currentAgentType === 'qualifier') {
                    // Try to get detailed qualification analysis
                    try {
                        const { CallAnalysisService } = await import('@/modules/communication/call-analysis-service');
                        qualificationResult = await CallAnalysisService.evaluateQualification(transcriptText, aiConfig.qualificationThresholds);
                        isQualified = qualificationResult.isQualified;
                        console.log(`[Webhook] AI Qualification for ${campaignLead.id}:`, qualificationResult);
                    } catch (aiErr) {
                        console.warn('[Webhook] AI Qualification failed, falling back to basic intent:', aiErr);
                        const intent = enrichedRecord.intent;
                        isQualified = intent === 'interested' || intent === 'site_visit' || intent === 'callback';
                    }

                    if (isQualified) {
                        console.log(`[Webhook] Lead ${campaignLead.id} qualified by Agent 1. Triggering Agent 2 (Closer).`);
                        
                        try {
                            const { AGENT_CONFIGS } = await import('@/lib/voice-agents');
                            const { Lead } = await import('@/modules/leads/db');
                            const lead = await Lead.getById(latestRecord.leadId);

                            if (lead) {
                                // Trigger Agent 2 Call
                                const closerResult = await VoiceService.triggerCall(lead, latestRecord.metadata || {}, {
                                    agentId: AGENT_CONFIGS.AGENT_2_CLOSING.id
                                });

                                if (closerResult.success && closerResult.data?.execution_id) {
                                    const nextExecId = closerResult.data.execution_id;

                                    // Create new call record for Agent 2
                                    await CallRecordService.create({
                                        campaignId: campaign.id,
                                        leadId: lead.id,
                                        campaignLeadId: campaignLead.id,
                                        executionId: nextExecId,
                                        phoneNumber: latestRecord.phoneNumber,
                                        status: 'initiated',
                                        agentId: AGENT_CONFIGS.AGENT_2_CLOSING.id,
                                        agentType: 'closer'
                                    });

                                    // Transition back to calling with new execution ID
                                    await CampaignLeadService.markCalling(campaignLead.id, nextExecId);

                                    // Update metrics
                                    await CampaignService.incrementMetric(campaign.id, 'qualifiedLeads', 1);

                                    return NextResponse.json({
                                        success: true,
                                        message: 'Transitioned to Closer agent successfully',
                                        nextExecutionId: nextExecId
                                    });
                                }
                            }
                        } catch (handoffError) {
                            console.error('[Webhook] Dual-agent handoff failed:', handoffError);
                            // Fallback to normal completion if handoff fails
                        }
                    } else {
                        console.log(`[Webhook] Lead ${campaignLead.id} disqualified by Agent 1 (Intent: ${intent}). Skipping Agent 2.`);
                    }
                }

                // If not handoff, mark completed
                await CampaignLeadService.markCompleted(campaignLead.id, enrichedRecord.id);

                // Update campaign metrics
                await CampaignService.incrementMetric(latestRecord.campaignId, 'callingLeads', -1);
                await CampaignService.incrementMetric(latestRecord.campaignId, 'completedCalls', 1);
                await CampaignService.incrementMetric(latestRecord.campaignId, 'successfulCalls', 1);

                // COST TRACKING & BUDGET CONTROL
                const durationSeconds = enrichedRecord.duration || 0;
                const minutes = durationSeconds / 60;
                
                // Rate estimation: Qualifer ₹7/min, Closer ₹15/min
                const rate = currentAgentType === 'qualifier' ? 7 : 15;
                const estimatedCost = parseFloat((minutes * rate).toFixed(2));
                
                // Update Call Record with estimated cost if not provided by vendor
                if (!enrichedRecord.cost) {
                    await CallRecordService.appendWebhookData(execution_id, {
                        cost: estimatedCost
                    });
                }

                // Update Campaign Total Cost
                await CampaignService.incrementMetric(latestRecord.campaignId, 'totalCost', estimatedCost);

                // Budget Check
                const updatedCampaign = await CampaignService.getById(latestRecord.campaignId);
                const budgetLimit = updatedCampaign?.context?.costLimits?.maxTotalCost;
                
                if (budgetLimit && updatedCampaign.totalCost >= budgetLimit) {
                    console.warn(`[Webhook] BUDGET EXCEEDED for campaign ${latestRecord.campaignId}. Current: ₹${updatedCampaign.totalCost}, Limit: ₹${budgetLimit}. Auto-pausing.`);
                    
                    try {
                        const { CampaignOrchestrator } = await import('@/modules/communication/services/orchestrator.service');
                        await CampaignOrchestrator.pauseCampaign(latestRecord.campaignId);
                        
                        // Notify could be added here
                    } catch (pauseErr) {
                        console.error('[Webhook] Failed to auto-pause campaign:', pauseErr);
                    }
                }

                // Process follow-ups
                try {
                    const { FollowUpService } = await import('@/modules/communication/services/follow-up.service');
                    const { Lead } = await import('@/modules/leads/db');

                    // Get lead data
                    const lead = await Lead.getById(latestRecord.leadId);
                    if (lead) {
                        await FollowUpService.processCallForFollowUp(enrichedRecord, {
                            name: lead.name,
                            phone: lead.phone,
                            email: lead.email,
                        });
                    }
                } catch (followUpError) {
                    console.error('[Webhook] Error processing follow-up:', followUpError);
                    // Don't fail webhook if follow-up fails
                }

            } else if (actualStatus === 'failed' || callOutcome === 'no_answer' || callOutcome === 'declined' || callOutcome === 'busy') {
                // Check if should retry
                const campaign = await CampaignService.getById(latestRecord.campaignId);
                const maxRetries = campaign?.rules.maxRetries || 3;
                const permanent = campaignLead.attemptCount >= maxRetries;

                await CampaignLeadService.markFailed(campaignLead.id, enrichedRecord.id, permanent);

                // Update campaign metrics
                await CampaignService.incrementMetric(latestRecord.campaignId, 'callingLeads', -1);

                if (permanent) {
                    await CampaignService.incrementMetric(latestRecord.campaignId, 'failedCalls', 1);
                } else {
                    await CampaignService.incrementMetric(latestRecord.campaignId, 'retryCount', 1);
                }
            }
        }

        const duration = Date.now() - startTime;

        SecurityUtils.logApiUsage({
            endpoint: '/api/calls/webhook',
            method: 'POST',
            ip,
            statusCode: 200,
            duration,
        });

        return NextResponse.json({
            success: true,
            message: 'Webhook processed successfully',
            callId: enrichedRecord.id,
        });

    } catch (error) {
        console.error('[Webhook] Error processing webhook:', error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
