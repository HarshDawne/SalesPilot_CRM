import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        const leads = db.leads.findAll();
        const now = new Date().getTime();

        const slaBreaches = [];

        for (const lead of leads) {
            const createdAt = new Date(lead.createdAt).getTime();
            const lastContactedAt = lead.lastContactedAt ? new Date(lead.lastContactedAt).getTime() : 0;

            // Rule 1: New leads must be contacted within 5 minutes
            if (lead.currentStage === 'New') {
                const diffMinutes = (now - createdAt) / (1000 * 60);
                if (diffMinutes > 5 && !lastContactedAt) {
                    slaBreaches.push({
                        leadId: lead.id,
                        rule: 'New Lead Contact SLA (5m)',
                        delay: `${Math.round(diffMinutes)} mins`,
                        severity: 'high'
                    });
                }
            }

            // Rule 2: Visit Booked but not completed after visit time + 4 hours
            if (lead.currentStage === 'Visit_Booked' && lead.visit?.visitDateTime) {
                const visitTime = new Date(lead.visit.visitDateTime).getTime();
                const diffHours = (now - visitTime) / (1000 * 60 * 60);
                if (diffHours > 4) {
                    slaBreaches.push({
                        leadId: lead.id,
                        rule: 'Visit Completion SLA (4h post visit)',
                        delay: `${Math.round(diffHours)} hours`,
                        severity: 'medium'
                    });
                }
            }
        }

        return NextResponse.json({
            count: slaBreaches.length,
            breaches: slaBreaches
        });

    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
