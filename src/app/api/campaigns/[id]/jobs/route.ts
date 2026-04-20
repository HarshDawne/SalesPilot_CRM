import { NextRequest, NextResponse } from 'next/server';
import { CallRecordService } from '@/modules/communication/services/call-record.service';
import { VoiceService } from '@/modules/communication/voice-service';
import { Lead } from '@/modules/leads/db';

// GET /api/campaigns/:id/jobs
// Returns EVERY call record as a separate row (not grouped by lead)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: campaignId } = await params;
    try {
        // Fetch ALL call records for this campaign directly
        const records = await CallRecordService.getByCampaign(campaignId);

        // If no records via CallRecordService, try CampaignLeadService as fallback
        if (records.length === 0) {
            const { CampaignLeadService } = await import('@/modules/communication/services/campaign-lead.service');
            const campaignLeads = await CampaignLeadService.getByCampaign(campaignId);

            if (campaignLeads.length === 0) {
                return NextResponse.json({ jobs: [] });
            }

            const jobs = await Promise.all(campaignLeads.map(async (cl) => {
                const leadData = await Lead.getById(cl.leadId);
                return {
                    id: cl.id,
                    campaignId: cl.campaignId,
                    leadId: cl.leadId,
                    leadName: leadData?.name || `Lead ${cl.leadId.slice(0, 8)}`,
                    phoneNumber: leadData?.phone || leadData?.primaryPhone || "N/A",
                    status: cl.state.toUpperCase(),
                    executionId: cl.lastExecutionId,
                    durationSeconds: 0,
                    cost: 0,
                    createdAt: cl.createdAt,
                    updatedAt: cl.updatedAt,
                    metadata: {},
                };
            }));

            return NextResponse.json({ jobs });
        }

        // Build one job row per call record
        const jobs = await Promise.all(records.map(async (r) => {
            const leadData = await Lead.getById(r.leadId);

            // Auto-sync from Bolna if missing transcript/recording
            if (r.executionId && (!r.transcript || !r.recordingUrl)) {
                try {
                    const bolnaData = await VoiceService.getCallDetails(r.executionId);
                    if (bolnaData) {
                        await CallRecordService.appendWebhookData(r.executionId, {
                            duration: bolnaData.duration || r.duration || 0,
                            cost: bolnaData.total_cost || r.cost || 0,
                            transcript: bolnaData.transcript || r.transcript || '',
                            summary: bolnaData.summary || r.summary || '',
                            recordingUrl: bolnaData.recording_url || r.recordingUrl || '',
                            intent: bolnaData.intent || r.intent || undefined,
                            metadata: {
                                bolnaDetails: bolnaData,
                                syncSource: 'jobs_endpoint_backfill',
                                syncedAt: new Date().toISOString(),
                            },
                        });
                        // Re-read the updated record
                        const updated = await CallRecordService.getByExecutionId(r.executionId);
                        if (updated.length > 0) {
                            Object.assign(r, updated[0]);
                        }
                    }
                } catch (syncErr) {
                    console.warn(`[Jobs API] Bolna sync failed for ${r.executionId}:`, syncErr);
                }
            }

            // Format duration properly (handle floating point from Bolna)
            const durationSecs = Math.round(r.duration || 0);

            return {
                id: r.id,
                campaignId: r.campaignId,
                leadId: r.leadId,
                leadName: leadData?.name || (r as any).leadName || `Lead ${r.leadId.slice(0, 8)}`,
                phoneNumber: leadData?.phone || leadData?.primaryPhone || r.phoneNumber || "N/A",
                status: (r.status || 'completed').toUpperCase(),
                executionId: r.executionId,

                // Call details — round duration to integer seconds
                durationSeconds: durationSecs,
                cost: Math.round((r.cost || 0) * 100) / 100,
                createdAt: r.createdAt,
                updatedAt: r.createdAt,

                // AI Data
                transcript: r.transcript,
                summary: r.summary,
                intent: r.intent,
                sentiment: r.sentiment,
                recordingUrl: r.recordingUrl,
                outcome: r.outcome || 'completed',

                // Metadata for Modal
                metadata: {
                    ...r.metadata,
                    transcript: r.transcript,
                    summary: r.summary,
                    recordingUrl: r.recordingUrl,
                    cost: Math.round((r.cost || 0) * 100) / 100,
                    duration: durationSecs,
                    leadName: leadData?.name || (r as any).leadName,
                },
            };
        }));

        // Sort: Longest calls first so the 7-minute one is at the top
        jobs.sort((a, b) => (b.durationSeconds || 0) - (a.durationSeconds || 0));

        return NextResponse.json({ jobs });
    } catch (error: any) {
        console.error('Error reading jobs:', error);
        return NextResponse.json({
            error: 'Failed to read jobs',
            details: error.message
        }, { status: 500 });
    }
}
