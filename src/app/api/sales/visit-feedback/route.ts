import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { LeadStatus } from '@/modules/leads/types';
import { logVisitFeedback, logStageChange } from '@/lib/timeline';
import { triggerPostVisitWorkflow } from '@/lib/notifications';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { leadId, visitId, outcome, projectName, agentName } = body;

        if (!leadId || !outcome) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Get Lead
        const lead = db.leads.findById(leadId);
        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        // 2. Determine New Status (LeadStage)
        let newStage: any = lead.currentStage;
        if (outcome === 'interested') {
            newStage = "Negotiation";
        } else if (outcome === 'nurture') {
            newStage = "Visit_Completed";
        } else if (outcome === 'no_show') {
            newStage = "Qualified"; // Back to qualified to reschedule
        }

        // 3. Update Lead
        const oldStage = lead.currentStage;
        db.leads.update(leadId, { 
            currentStage: newStage as any,
            updatedAt: new Date().toISOString()
        });

        // 4. Update Visit (Booking) status if applicable
        if (visitId) {
            db.bookings.update(visitId, { 
                status: outcome === 'no_show' ? 'cancelled' : 'completed',
                updatedAt: new Date().toISOString()
            });
        }

        // 5. Log Timeline Events
        logVisitFeedback(leadId, outcome, `Logged by ${agentName}`);
        if (oldStage !== newStage) {
            logStageChange(leadId, oldStage, newStage, agentName);
        }

        // 6. Trigger Automation Workflow
        const brochureUrl = (lead as any).meta?.propertyContext?.brochureUrl || "https://example.com/brochure";
        await triggerPostVisitWorkflow(lead, outcome as any, {
            projectName: projectName || "Godrej Woods",
            agentName: agentName || "Your Sales Agent",
            brochureUrl
        });

        return NextResponse.json({ 
            success: true, 
            message: `Feedback logged and ${outcome} workflow triggered.`,
            newStage 
        });

    } catch (error: any) {
        console.error('Visit feedback API failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
