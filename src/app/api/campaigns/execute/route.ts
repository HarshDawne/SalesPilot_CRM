import { NextRequest, NextResponse } from 'next/server';
import { db, Lead } from '@/lib/db';
import { addDays, format, setHours, setMinutes } from 'date-fns';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { leadIds, campaignName, channel } = body;

        // Mock Simulation Logic
        const results = {
            total: leadIds.length,
            contacted: 0,
            converted: 0,
            visitsBooked: 0,
            failed: 0
        };

        const leadsToUpdate: Lead[] = [];

        // Simulate processing each lead
        for (const leadId of leadIds) {
            const lead = db.leads.findById(leadId);
            if (!lead) continue;

            results.contacted++;

            // Simple random simulation logic
            const outcome = Math.random();

            if (outcome > 0.7) {
                // 30% Success Rate (High for demo)
                results.converted++;

                // If extremely positive, book a visit
                if (outcome > 0.85) {
                    results.visitsBooked++;

                    // BOOK VISIT
                    const visitDate = setMinutes(setHours(addDays(new Date(), Math.floor(Math.random() * 5) + 1), 10 + Math.floor(Math.random() * 6)), 0);

                    lead.currentStage = 'Visit_Booked';
                    lead.visit = {
                        visitId: Math.random().toString(36).substr(2, 9),
                        visitStatus: 'confirmed',
                        visitDateTime: visitDate.toISOString(),
                        assignedAgentId: 'agent-1', // Mock Agent
                        confirmationSent: true,
                        remindersSent: []
                    };

                    // Add AI Call Record
                    if (!lead.aiCalling) {
                        lead.aiCalling = { attempts: 0, callRecords: [], followupScheduled: false };
                    }
                    lead.aiCalling.callRecords.push({
                        callId: Math.random().toString(36).substr(2, 9),
                        startTime: new Date().toISOString(),
                        status: 'connected',
                        duration: 125,
                        aiConfidence: 92,
                        summary: `Customer interested in ${campaignName}. Booked site visit for ${format(visitDate, 'PPP p')}.`,
                        notes: "Auto-booked by Revenue OS Campaign."
                    });

                } else {
                    // Just warm leads
                    lead.currentStage = 'Qualified';
                    lead.leadTags = [...(lead.leadTags || []), "Campaign-Engaged"];
                }

                leadsToUpdate.push(lead);
            } else {
                // No answer or not interested
                results.failed++;
                // Optionally add a failed call record
            }
        }

        // Batch update leads (In a real DB this would be a bulk write)
        leadsToUpdate.forEach(l => db.leads.update(l.id, l));

        return NextResponse.json({
            success: true,
            results,
            message: `Campaign "${campaignName}" executed successfully. ${results.visitsBooked} visits automagically booked!`
        });

    } catch (error) {
        console.error("Campaign Execution Error:", error);
        return NextResponse.json({ error: "Failed to execute campaign" }, { status: 500 });
    }
}
