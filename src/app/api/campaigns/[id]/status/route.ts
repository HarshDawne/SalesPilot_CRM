// Campaign Status API - Real-time status polling with live Bolna data sync

import { NextRequest, NextResponse } from 'next/server';
import { CampaignService } from '@/modules/communication/services/campaign.service';
import { CampaignLeadService } from '@/modules/communication/services/campaign-lead.service';
import { CallRecordService } from '@/modules/communication/services/call-record.service';
import { VoiceService } from '@/modules/communication/voice-service';
import { Lead } from '@/modules/leads/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get campaign
        const campaign = await CampaignService.getById(id);
        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        // Get all campaign leads
        const allLeads = await CampaignLeadService.getByCampaign(id);

        // Get current calling lead
        const callingLead = allLeads.find(l => l.state === 'calling');

        // Get completed leads
        const completedLeads = allLeads.filter(l => l.state === 'completed');
        const failedLeads = allLeads.filter(l => l.state === 'failed');

        // Calculate progress
        const totalLeads = allLeads.length;
        const processedLeads = completedLeads.length + failedLeads.length;
        const currentCallIndex = processedLeads + (callingLead ? 1 : 0);

        // ── LIVE SYNC: Fetch Bolna data for active/recent calls ─────────
        // This ensures the frontend gets real data even if webhooks haven't fired

        // 1. Sync current calling lead
        let currentCallDetails = null;
        if (callingLead && callingLead.lastExecutionId) {
            const lead = await Lead.getById(callingLead.leadId);

            // Actively fetch from Bolna API
            let bolnaData = null;
            try {
                bolnaData = await VoiceService.getCallDetails(callingLead.lastExecutionId);

                // If Bolna says call is done, push that data into our records
                if (bolnaData && (bolnaData.status === 'completed' || bolnaData.status === 'answered' || bolnaData.transcript)) {
                    await CallRecordService.appendWebhookData(callingLead.lastExecutionId, {
                        status: 'completed',
                        duration: bolnaData.duration || 0,
                        cost: bolnaData.total_cost || 0,
                        transcript: bolnaData.transcript || '',
                        summary: bolnaData.summary || '',
                        recordingUrl: bolnaData.recording_url || '',
                        intent: bolnaData.intent || undefined,
                        outcome: 'completed',
                        metadata: {
                            bolnaDetails: bolnaData,
                            syncSource: 'status_poll_active',
                            syncedAt: new Date().toISOString(),
                        },
                    });

                    // Mark lead completed
                    const records = await CallRecordService.getByExecutionId(callingLead.lastExecutionId);
                    if (records.length > 0) {
                        await CampaignLeadService.markCompleted(callingLead.id, records[0].id);
                        await CampaignService.incrementMetric(id, 'callingLeads', -1);
                        await CampaignService.incrementMetric(id, 'completedCalls', 1);
                        await CampaignService.incrementMetric(id, 'successfulCalls', 1);
                    }
                } else if (bolnaData && ['failed', 'no_answer', 'busy', 'declined', 'cancelled'].includes(bolnaData.status)) {
                    await CallRecordService.appendWebhookData(callingLead.lastExecutionId, {
                        status: bolnaData.status,
                        duration: bolnaData.duration || 0,
                        outcome: bolnaData.status,
                        metadata: {
                            bolnaDetails: bolnaData,
                            syncSource: 'status_poll_failed',
                            syncedAt: new Date().toISOString(),
                        },
                    });

                    const campaign = await CampaignService.getById(id);
                    const maxRetries = campaign?.rules.maxRetries || 3;
                    const permanent = callingLead.attemptCount >= maxRetries;
                    const records = await CallRecordService.getByExecutionId(callingLead.lastExecutionId);
                    if (records.length > 0) {
                        await CampaignLeadService.markFailed(callingLead.id, records[0].id, permanent);
                        await CampaignService.incrementMetric(id, 'callingLeads', -1);
                        if (permanent) {
                            await CampaignService.incrementMetric(id, 'failedCalls', 1);
                        }
                    }
                }
            } catch (syncErr) {
                console.warn('[Campaign Status] Live sync error for calling lead:', syncErr);
            }

            // Build current call details for frontend
            const callRecords = await CallRecordService.getByExecutionId(callingLead.lastExecutionId);
            const latestRecord = callRecords.length > 0 ? callRecords[0] : null;

            currentCallDetails = {
                leadId: callingLead.leadId,
                leadName: lead?.name || 'Unknown',
                leadPhone: lead?.phone || 'Unknown',
                executionId: callingLead.lastExecutionId,
                status: 'calling',
                attemptCount: callingLead.attemptCount,
                callRecord: latestRecord,
                // Live Bolna data
                bolnaLive: bolnaData ? {
                    status: bolnaData.status,
                    duration: bolnaData.duration,
                    transcript: bolnaData.transcript,
                    recording_url: bolnaData.recording_url,
                    total_cost: bolnaData.total_cost,
                    cost_breakdown: bolnaData.cost_breakdown,
                } : null,
            };
        }

        // 2. Sync recently completed calls that may have missing data
        const recentCompleted = [...completedLeads, ...failedLeads]
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 5); // Check last 5 completed

        for (const cl of recentCompleted) {
            if (!cl.lastExecutionId) continue;

            const records = await CallRecordService.getByExecutionId(cl.lastExecutionId);
            const record = records[0];

            // If record is missing transcript/cost/duration, try fetching from Bolna
            if (record && (!record.transcript || !record.cost || !record.duration)) {
                try {
                    const bolnaData = await VoiceService.getCallDetails(cl.lastExecutionId);
                    if (bolnaData) {
                        await CallRecordService.appendWebhookData(cl.lastExecutionId, {
                            duration: bolnaData.duration || record.duration || 0,
                            cost: bolnaData.total_cost || record.cost || 0,
                            transcript: bolnaData.transcript || record.transcript || '',
                            summary: bolnaData.summary || record.summary || '',
                            recordingUrl: bolnaData.recording_url || record.recordingUrl || '',
                            intent: bolnaData.intent || record.intent || undefined,
                            metadata: {
                                bolnaDetails: bolnaData,
                                syncSource: 'status_poll_backfill',
                                syncedAt: new Date().toISOString(),
                            },
                        });
                    }
                } catch (syncErr) {
                    // Silently continue — non-critical
                }
            }
        }

        // 3. Build last completed call details
        let lastCompletedCall = null;
        if (completedLeads.length > 0 || failedLeads.length > 0) {
            const lastProcessed = [...completedLeads, ...failedLeads]
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

            if (lastProcessed) {
                const lead = await Lead.getById(lastProcessed.leadId);
                const callRecords = await CallRecordService.getByExecutionId(lastProcessed.lastExecutionId || '');
                const latestRecord = callRecords.length > 0 ? callRecords[0] : null;

                lastCompletedCall = {
                    leadId: lastProcessed.leadId,
                    leadName: lead?.name || 'Unknown',
                    leadPhone: lead?.phone || 'Unknown',
                    executionId: lastProcessed.lastExecutionId,
                    status: lastProcessed.state,
                    callRecord: latestRecord ? {
                        ...latestRecord,
                        // Include these explicitly for frontend
                        duration: latestRecord.duration || 0,
                        cost: latestRecord.cost || 0,
                        transcript: latestRecord.transcript || '',
                        summary: latestRecord.summary || '',
                        recordingUrl: latestRecord.recordingUrl || '',
                        intent: latestRecord.intent || '',
                    } : null,
                    outcome: latestRecord?.outcome || lastProcessed.state,
                };
            }
        }

        // 4. Aggregate cost + duration stats from all records
        const allRecords = await CallRecordService.getByCampaign(id);
        const totalCost = allRecords.reduce((sum, r) => sum + (r.cost || 0), 0);
        const totalDuration = allRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
        const avgDuration = allRecords.length > 0 ? Math.round(totalDuration / allRecords.length) : 0;
        const connectedCalls = allRecords.filter(r => r.duration && r.duration > 0).length;

        // Re-read leads after sync (they may have changed state)
        const updatedLeads = await CampaignLeadService.getByCampaign(id);
        const updatedCompleted = updatedLeads.filter(l => l.state === 'completed').length;
        const updatedFailed = updatedLeads.filter(l => l.state === 'failed').length;
        const updatedProcessed = updatedCompleted + updatedFailed;
        const updatedCalling = updatedLeads.find(l => l.state === 'calling');

        return NextResponse.json({
            success: true,
            campaign: {
                id: campaign.id,
                name: campaign.name,
                status: campaign.status,
            },
            progress: {
                total: totalLeads,
                processed: updatedProcessed,
                current: updatedProcessed + (updatedCalling ? 1 : 0),
                completed: updatedCompleted,
                failed: updatedFailed,
                queued: updatedLeads.filter(l => l.state === 'queued').length,
            },
            currentCall: currentCallDetails,
            lastCompletedCall,
            // ── New: Aggregated metrics for the frontend ──
            liveMetrics: {
                totalCost: Math.round(totalCost * 100) / 100,
                totalDuration,
                avgDuration,
                connectedCalls,
                totalRecords: allRecords.length,
                withTranscript: allRecords.filter(r => r.transcript && r.transcript.length > 10).length,
                withRecording: allRecords.filter(r => r.recordingUrl).length,
            },
        });

    } catch (error) {
        console.error('[Campaign Status API] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
