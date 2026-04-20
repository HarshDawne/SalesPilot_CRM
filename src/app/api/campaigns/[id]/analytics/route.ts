// Campaign Analytics API - Summary and AI insights

import { NextRequest, NextResponse } from 'next/server';
import { CampaignService } from '@/modules/communication/services/campaign.service';
import { CampaignLeadService } from '@/modules/communication/services/campaign-lead.service';
import { CallRecordService } from '@/modules/communication/services/call-record.service';

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

        // Get call records for the campaign
        const callRecords = await CallRecordService.getByCampaign(id);

        // Calculate metrics
        const totalCalls = allLeads.length;
        const completedCalls = allLeads.filter(l => l.state === 'completed').length;
        const failedCalls = allLeads.filter(l => l.state === 'failed').length;
        const successRate = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0;

        // Call outcome breakdown
        const outcomes = {
            completed: 0,
            no_answer: 0,
            declined: 0,
            busy: 0,
            failed: 0,
        };

        callRecords.forEach(record => {
            // Try to get outcome from record, fallback to deriving from status
            let outcome = 'unknown';

            // Check if record has rawData with outcome information
            const recordAny = record as any;
            if (recordAny.rawData && typeof recordAny.rawData === 'object') {
                const rawData = recordAny.rawData;
                if (rawData.outcome) {
                    outcome = rawData.outcome;
                } else if (rawData.status) {
                    // Map status to outcome
                    const status = rawData.status.toLowerCase();
                    if (status.includes('completed') || status.includes('success')) {
                        outcome = 'completed';
                    } else if (status.includes('no_answer') || status.includes('unanswered')) {
                        outcome = 'no_answer';
                    } else if (status.includes('declined') || status.includes('rejected')) {
                        outcome = 'declined';
                    } else if (status.includes('busy')) {
                        outcome = 'busy';
                    } else if (status.includes('failed') || status.includes('error')) {
                        outcome = 'failed';
                    }
                }
            }

            // Also check record status field
            if (outcome === 'unknown' && record.status) {
                const status = record.status.toLowerCase();
                if (status.includes('completed') || status.includes('success')) {
                    outcome = 'completed';
                } else if (status.includes('failed') || status.includes('error')) {
                    outcome = 'failed';
                }
            }

            if (outcome in outcomes) {
                outcomes[outcome as keyof typeof outcomes]++;
            }
        });

        // Calculate average duration
        const durationsWithValue = callRecords
            .filter(r => r.duration && r.duration > 0)
            .map(r => r.duration!);

        const avgDuration = durationsWithValue.length > 0
            ? Math.round(durationsWithValue.reduce((sum, d) => sum + d, 0) / durationsWithValue.length)
            : 0;

        // Get call intents
        const intents: Record<string, number> = {};
        callRecords.forEach(record => {
            if (record.intent) {
                intents[record.intent] = (intents[record.intent] || 0) + 1;
            }
        });

        // Generate AI insights
        const insights = await generateAIInsights({
            totalCalls,
            completedCalls,
            failedCalls,
            successRate,
            outcomes,
            avgDuration,
            intents,
            campaignName: campaign.name,
        });

        // Calculate total cost
        const totalCost = callRecords.reduce((sum, r) => sum + (r.cost || 0), 0);
        const totalDuration = callRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
        const withTranscript = callRecords.filter(r => r.transcript && r.transcript.length > 10).length;
        const withRecording = callRecords.filter(r => r.recordingUrl).length;

        return NextResponse.json({
            success: true,
            analytics: {
                totalCalls,
                completedCalls,
                failedCalls,
                successRate,
                outcomes,
                avgDuration,
                intents,
                totalCost: Math.round(totalCost * 100) / 100,
                totalDuration,
                withTranscript,
                withRecording,
            },
            insights,
        });

    } catch (error) {
        console.error('[Campaign Analytics API] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

async function generateAIInsights(data: {
    totalCalls: number;
    completedCalls: number;
    failedCalls: number;
    successRate: number;
    outcomes: Record<string, number>;
    avgDuration: number;
    intents: Record<string, number>;
    campaignName: string;
}) {
    const insights: string[] = [];

    // Success rate insight
    if (data.successRate >= 70) {
        insights.push(`🎯 Excellent performance! ${data.successRate}% success rate indicates high lead quality and effective calling strategy.`);
    } else if (data.successRate >= 40) {
        insights.push(`📊 Moderate success rate of ${data.successRate}%. Consider refining targeting or call timing for better results.`);
    } else {
        insights.push(`⚠️ Low success rate (${data.successRate}%). Review lead quality, call timing, and script effectiveness.`);
    }

    // Outcome insights
    const noAnswerRate = data.totalCalls > 0 ? Math.round((data.outcomes.no_answer / data.totalCalls) * 100) : 0;
    if (noAnswerRate > 40) {
        insights.push(`📞 High no-answer rate (${noAnswerRate}%). Try calling at different times or implement callback scheduling.`);
    }

    const declinedRate = data.totalCalls > 0 ? Math.round((data.outcomes.declined / data.totalCalls) * 100) : 0;
    if (declinedRate > 20) {
        insights.push(`🚫 ${declinedRate}% of leads declined calls. Review opening script and value proposition.`);
    }

    // Duration insight
    if (data.avgDuration > 0) {
        if (data.avgDuration >= 120) {
            insights.push(`⏱️ Average call duration of ${Math.floor(data.avgDuration / 60)}m ${data.avgDuration % 60}s shows good engagement.`);
        } else if (data.avgDuration < 30) {
            insights.push(`⚡ Short average call duration (${data.avgDuration}s) suggests quick disconnects. Improve opening hook.`);
        }
    }

    // Intent insights
    const topIntent = Object.entries(data.intents).sort((a, b) => b[1] - a[1])[0];
    if (topIntent) {
        const intentLabels: Record<string, string> = {
            interested: 'showing interest',
            callback: 'requesting callbacks',
            site_visit: 'scheduling site visits',
            not_interested: 'not interested',
        };
        const label = intentLabels[topIntent[0]] || topIntent[0];
        insights.push(`💡 Most common intent: ${topIntent[1]} leads ${label}.`);
    }

    // Overall recommendation
    if (data.completedCalls >= data.totalCalls * 0.7) {
        insights.push(`✅ Strong completion rate! Focus on nurturing the ${data.completedCalls} contacted leads through follow-ups.`);
    } else {
        insights.push(`🔄 Consider retrying failed calls during different time slots for better reach.`);
    }

    return insights;
}
