import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { addTimelineEvent, logAICallAttempt, logAIQualified, logVisitBooked } from '@/lib/timeline';
import { sendVisitConfirmation } from '@/lib/notifications';

/**
 * Batch AI Calling Campaign
 * 
 * Simulates AI calling multiple leads and:
 * 1. Updates lead to AI_Calling stage
 * 2. Simulates call attempts
 * 3. If qualified, automatically books visit
 * 4. Sends notifications
 */

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { leadIds } = body;

        if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
            return NextResponse.json(
                { error: 'leadIds array is required' },
                { status: 400 }
            );
        }

        const projects = db.projects.findAll();
        const agents = [
            { id: 'agent-1', name: 'Suresh Kumar', phone: '+91 9876543210' },
            { id: 'agent-2', name: 'Priya Sharma', phone: '+91 9876543211' },
        ];

        let queued = 0;
        let qualified = 0;
        let visitsBooked = 0;
        let disqualified = 0;

        for (const leadId of leadIds) {
            const lead = db.leads.findById(leadId);
            if (!lead || lead.currentStage !== 'New') {
                continue;
            }

            // Simulate AI calling
            const callId = uuidv4();
            const callStartTime = new Date().toISOString();

            // Update to AI_Calling stage
            db.leads.update(leadId, {
                currentStage: 'AI_Calling',
                aiCalling: {
                    attempts: 1,
                    callRecords: [{
                        callId,
                        startTime: callStartTime,
                        status: 'connected',
                        duration: Math.floor(Math.random() * 180) + 60, // 1-4 minutes
                        transcriptUrl: `/transcripts/${callId}.txt`,
                        recordingUrl: `/recordings/${callId}.mp3`,
                        aiConfidence: Math.floor(Math.random() * 40) + 60, // 60-100
                        summary: 'Customer interested in properties'
                    }],
                    followupScheduled: false,
                    lastAttemptAt: callStartTime
                }
            });

            logAICallAttempt(leadId, 1, callId);

            queued++;

            // Simulate qualification (70% success rate)
            const isQualified = Math.random() > 0.3;

            if (isQualified) {
                // Generate qualification data
                const budgetMin = Math.floor(Math.random() * 100 + 50) * 100000; // 50L-150L
                const budgetMax = budgetMin + Math.floor(Math.random() * 50 + 20) * 100000;
                const aiScore = Math.floor(Math.random() * 25) + 75; // 75-100
                const propertyTypes = ['1BHK', '2BHK', '3BHK', '4BHK', 'Villa'];
                const locations = ['Bandra', 'Powai', 'Andheri', 'Juhu', 'Worli'];

                const qualifiedAt = new Date().toISOString();

                // Update to Qualified
                db.leads.update(leadId, {
                    currentStage: 'Qualified',
                    aiScore,
                    qualification: {
                        budgetMin,
                        budgetMax,
                        budgetCurrency: 'INR',
                        timeline: '2-3 months',
                        timelineWeeks: 10,
                        preferredLocations: [locations[Math.floor(Math.random() * locations.length)]],
                        propertyType: propertyTypes[Math.floor(Math.random() * propertyTypes.length)],
                        intentLevel: 'high',
                        qualifier: 'ai',
                        qualifiedAt,
                        qualificationNotes: 'AI qualified during call'
                    }
                });

                logAIQualified(leadId, aiScore, {
                    budgetMin,
                    budgetMax,
                    timeline: '2-3 months'
                });

                qualified++;

                // AUTOMATICALLY BOOK VISIT (this is the key part!)
                if (projects.length > 0) {
                    const project = projects[Math.floor(Math.random() * projects.length)];
                    const agent = agents[Math.floor(Math.random() * agents.length)];

                    // Schedule visit 2-7 days from now
                    const daysFromNow = Math.floor(Math.random() * 5) + 2;
                    const visitDate = new Date();
                    visitDate.setDate(visitDate.getDate() + daysFromNow);
                    visitDate.setHours(Math.floor(Math.random() * 6) + 10, 0, 0, 0); // 10 AM - 4 PM

                    const visitDateTime = visitDate.toISOString();
                    const visitId = uuidv4();

                    // Update lead to Visit_Booked
                    db.leads.update(leadId, {
                        currentStage: 'Visit_Booked',
                        assignedAgentId: agent.id,
                        visit: {
                            visitId,
                            visitStatus: 'confirmed',
                            visitDateTime,
                            projectId: project.id,
                            projectName: project.name,
                            assignedAgentId: agent.id,
                            assignedAgentName: agent.name,
                            meetingPoint: project.address,
                            confirmationSent: true,
                            remindersSent: []
                        }
                    });

                    // Create booking record
                    db.bookings.create({
                        id: visitId,
                        leadId,
                        projectId: project.id,
                        slotStart: visitDateTime,
                        slotEnd: new Date(new Date(visitDateTime).getTime() + 60 * 60 * 1000).toISOString(),
                        duration: 60,
                        mode: 'site_visit',
                        status: 'confirmed',
                        visitType: 'first_visit',
                        assignedTo: agent.id,
                        meetingPoint: project.address,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });

                    logVisitBooked(leadId, visitId, visitDateTime, project.name, agent.name);

                    // Send confirmation notifications
                    const updatedLead = db.leads.findById(leadId);
                    if (updatedLead) {
                        await sendVisitConfirmation(updatedLead, {
                            projectName: project.name,
                            date: visitDate.toLocaleDateString(),
                            time: visitDate.toLocaleTimeString(),
                            meetingPoint: project.address,
                            agentName: agent.name,
                            agentPhone: agent.phone
                        });
                    }

                    visitsBooked++;
                }
            } else {
                // Disqualify
                const reasons = ['budget_mismatch', 'location_mismatch', 'no_intent', 'not_eligible'];
                const reason = reasons[Math.floor(Math.random() * reasons.length)];

                db.leads.update(leadId, {
                    currentStage: 'Disqualified',
                    aiScore: Math.floor(Math.random() * 30) + 10, // 10-40
                    disqualification: {
                        reason: reason as any,
                        disqualifiedBy: 'ai',
                        notes: 'AI determined not a good fit during call',
                        disqualifiedAt: new Date().toISOString()
                    }
                });

                addTimelineEvent({
                    leadId,
                    type: 'ai_disqualified',
                    summary: `Lead disqualified: ${reason.replace('_', ' ')}`,
                    actor: 'ai',
                    payload: { reason }
                });

                disqualified++;
            }

            // Small delay to simulate processing
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return NextResponse.json({
            success: true,
            queued,
            qualified,
            visitsBooked,
            disqualified,
            message: `AI Campaign completed: ${qualified} qualified, ${visitsBooked} visits auto-booked, ${disqualified} disqualified`
        });

    } catch (error) {
        console.error('Batch call error:', error);
        return NextResponse.json(
            { error: 'Failed to process batch call', details: String(error) },
            { status: 500 }
        );
    }
}
