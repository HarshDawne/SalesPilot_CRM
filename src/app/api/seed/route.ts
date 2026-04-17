import { NextResponse } from 'next/server';
import { db, Lead } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { seedPerformanceMatrixData } from '@/lib/seed-performance';

function randomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePhone(): string {
    return `+91 ${randomInt(70000, 99999)}${randomInt(10000, 99999)}`;
}

function generateEmail(firstName: string, lastName: string): string {
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${randomElement(['gmail', 'yahoo', 'outlook'])}.com`;
}

function subtractDays(date: Date, days: number): string {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result.toISOString();
}

function addDays(date: Date, days: number): string {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString();
}

function addHours(dateStr: string, hours: number): string {
    const result = new Date(dateStr);
    result.setHours(result.getHours() + hours);
    return result.toISOString();
}

export async function POST() {
    try {
        console.log('🔄 Starting full database seed...');
        
        const firstNames = ['Rohan', 'Priya', 'Amit', 'Sneha', 'Rahul', 'Anjali', 'Vikram', 'Pooja', 'Arjun', 'Kavya'];
        const lastNames = ['Sharma', 'Gupta', 'Patel', 'Kumar', 'Singh', 'Reddy', 'Desai', 'Mehta'];
        const locations = ['Bandra', 'Powai', 'Andheri', 'Juhu', 'Worli'];
        const propertyTypes = ['1BHK', '2BHK', '3BHK', '4BHK', 'Villa'];

        const projects = db.projects.findAll();
        const agents = [
            { id: 'agent-1', name: 'Suresh Kumar', phone: '+91 9876543210' },
            { id: 'agent-2', name: 'Priya Sharma', phone: '+91 9876543211' },
        ];

        let totalCreated = 0;

        // NEW (5)
        for (let i = 0; i < 5; i++) {
            const firstName = randomElement(firstNames);
            const lastName = randomElement(lastNames);
            const createdAt = subtractDays(new Date(), randomInt(0, 1));

            const lead: Lead = {
                id: uuidv4(),
                createdAt,
                updatedAt: createdAt,
                createdVia: 'website',
                name: `${firstName} ${lastName}`,
                firstName,
                lastName,
                primaryPhone: generatePhone(),
                email: generateEmail(firstName, lastName),
                preferredContactMethod: 'whatsapp',
                preferredLanguage: 'en',
                currentStage: 'New',
                aiScore: 0,
                leadTags: ['New'],
                version: 1
            };

            db.leads.create(lead);
            totalCreated++;
        }

        // AI_CALLING (5)
        for (let i = 0; i < 5; i++) {
            const firstName = randomElement(firstNames);
            const lastName = randomElement(lastNames);
            const createdAt = subtractDays(new Date(), randomInt(0, 2));

            const lead: Lead = {
                id: uuidv4(),
                createdAt,
                updatedAt: new Date().toISOString(),
                createdVia: 'website',
                name: `${firstName} ${lastName}`,
                firstName,
                lastName,
                primaryPhone: generatePhone(),
                email: generateEmail(firstName, lastName),
                preferredContactMethod: 'phone',
                preferredLanguage: 'en',
                currentStage: 'AI_Calling',
                aiScore: randomInt(30, 60),
                leadTags: ['AI Calling'],
                aiCalling: {
                    attempts: randomInt(1, 3),
                    callRecords: [{
                        callId: uuidv4(),
                        startTime: createdAt,
                        status: 'ringing',
                        duration: 0
                    }],
                    followupScheduled: true,
                    followupAt: addDays(new Date(), 1),
                    lastAttemptAt: createdAt
                },
                version: 1
            };

            db.leads.create(lead);
            totalCreated++;
        }

        // QUALIFIED (8)
        for (let i = 0; i < 8; i++) {
            const firstName = randomElement(firstNames);
            const lastName = randomElement(lastNames);
            const createdAt = subtractDays(new Date(), randomInt(1, 5));
            const qualifiedAt = addHours(createdAt, randomInt(2, 8));
            const propertyType = randomElement(propertyTypes);
            const location = randomElement(locations);
            const budgetMin = randomInt(50, 150) * 100000;
            const budgetMax = budgetMin + randomInt(20, 50) * 100000;
            const aiScore = randomInt(70, 95);

            const lead: Lead = {
                id: uuidv4(),
                createdAt,
                updatedAt: qualifiedAt,
                createdVia: 'website',
                name: `${firstName} ${lastName}`,
                firstName,
                lastName,
                primaryPhone: generatePhone(),
                email: generateEmail(firstName, lastName),
                preferredContactMethod: 'whatsapp',
                preferredLanguage: 'en',
                currentStage: 'Qualified',
                aiScore,
                leadTags: ['Qualified'],
                qualification: {
                    budgetMin,
                    budgetMax,
                    budgetCurrency: 'INR',
                    timeline: randomElement(['1-2 months', '2-3 months']),
                    timelineWeeks: randomInt(4, 12),
                    preferredLocations: [location],
                    propertyType: [propertyType],
                    intentLevel: 'high',
                    qualifier: 'ai',
                    qualifiedAt,
                },
                version: 1
            };

            db.leads.create(lead);
            totalCreated++;
        }

        // VISIT_BOOKED (7)
        if (projects.length > 0) {
            for (let i = 0; i < 7; i++) {
                const firstName = randomElement(firstNames);
                const lastName = randomElement(lastNames);
                const createdAt = subtractDays(new Date(), randomInt(2, 7));
                const visitDateTime = addDays(new Date(), randomInt(1, 10));
                const project = randomElement(projects);
                const agent = randomElement(agents);
                const visitId = uuidv4();

                const lead: Lead = {
                    id: uuidv4(),
                    createdAt,
                    updatedAt: new Date().toISOString(),
                    createdVia: 'website',
                    name: `${firstName} ${lastName}`,
                    firstName,
                    lastName,
                    primaryPhone: generatePhone(),
                    email: generateEmail(firstName, lastName),
                    preferredContactMethod: 'whatsapp',
                    preferredLanguage: 'en',
                    currentStage: 'Visit_Booked',
                    aiScore: randomInt(75, 92),
                    assignedAgentId: agent.id,
                    leadTags: ['Visit Booked'],
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
                    },
                    version: 1
                };

                db.leads.create(lead);
                totalCreated++;
            }
        }

        // VISIT_COMPLETED (4)
        for (let i = 0; i < 4; i++) {
            const firstName = randomElement(firstNames);
            const lastName = randomElement(lastNames);
            const createdAt = subtractDays(new Date(), randomInt(5, 15));
            const visitDateTime = subtractDays(new Date(), randomInt(1, 5));

            const lead: Lead = {
                id: uuidv4(),
                createdAt,
                updatedAt: new Date().toISOString(),
                createdVia: 'website',
                name: `${firstName} ${lastName}`,
                firstName,
                lastName,
                primaryPhone: generatePhone(),
                email: generateEmail(firstName, lastName),
                preferredContactMethod: 'whatsapp',
                preferredLanguage: 'en',
                currentStage: 'Visit_Completed',
                aiScore: randomInt(80, 95),
                leadTags: ['Visit Completed'],
                visitFeedback: {
                    visitedAt: visitDateTime,
                    feedbackRating: randomInt(3, 5),
                    interestLevelPostVisit: 'high',
                    notes: 'Very interested'
                },
                version: 1
            };

            db.leads.create(lead);
            totalCreated++;
        }

        // NEGOTIATION (3)
        for (let i = 0; i < 3; i++) {
            const firstName = randomElement(firstNames);
            const lastName = randomElement(lastNames);
            const createdAt = subtractDays(new Date(), randomInt(10, 20));

            const lead: Lead = {
                id: uuidv4(),
                createdAt,
                updatedAt: new Date().toISOString(),
                createdVia: 'website',
                name: `${firstName} ${lastName}`,
                firstName,
                lastName,
                primaryPhone: generatePhone(),
                email: generateEmail(firstName, lastName),
                preferredContactMethod: 'email',
                preferredLanguage: 'en',
                currentStage: 'Negotiation',
                aiScore: randomInt(85, 98),
                leadTags: ['Negotiation'],
                proposal: {
                    proposalId: uuidv4(),
                    priceOffered: randomInt(5000000, 10000000),
                    discountOffered: randomInt(100000, 500000),
                    paymentPlan: {},
                    documentsSent: ['floor_plan.pdf'],
                    negotiationStage: 'under_negotiation',
                    lastNegotiationAt: subtractDays(new Date(), randomInt(1, 3))
                },
                version: 1
            };

            db.leads.create(lead);
            totalCreated++;
        }

        // BOOKING_DONE (2)
        for (let i = 0; i < 2; i++) {
            const firstName = randomElement(firstNames);
            const lastName = randomElement(lastNames);
            const createdAt = subtractDays(new Date(), randomInt(15, 30));
            const bookingAt = subtractDays(new Date(), randomInt(1, 7));

            const lead: Lead = {
                id: uuidv4(),
                createdAt,
                updatedAt: bookingAt,
                createdVia: 'website',
                name: `${firstName} ${lastName}`,
                firstName,
                lastName,
                primaryPhone: generatePhone(),
                email: generateEmail(firstName, lastName),
                preferredContactMethod: 'email',
                preferredLanguage: 'en',
                currentStage: 'Booking_Done',
                aiScore: randomInt(90, 100),
                leadTags: ['Booking Done'],
                booking: {
                    bookingId: uuidv4(),
                    amountPaid: randomInt(500000, 1000000),
                    paymentStatus: 'paid',
                    kycStatus: 'verified',
                    unitLocked: true,
                    bookingAt,
                    paymentMethod: 'bank_transfer',
                    transactionId: `TXN${randomInt(100000, 999999)}`
                },
                version: 1
            };

            db.leads.create(lead);
            totalCreated++;
        }

        // DISQUALIFIED (6)
        const disqualReasons = ['budget_mismatch', 'location_mismatch', 'no_intent', 'invalid_contact'];
        for (let i = 0; i < 6; i++) {
            const firstName = randomElement(firstNames);
            const lastName = randomElement(lastNames);
            const createdAt = subtractDays(new Date(), randomInt(1, 10));

            const lead: Lead = {
                id: uuidv4(),
                createdAt,
                updatedAt: createdAt,
                createdVia: 'website',
                name: `${firstName} ${lastName}`,
                firstName,
                lastName,
                primaryPhone: generatePhone(),
                email: generateEmail(firstName, lastName),
                preferredContactMethod: 'phone',
                preferredLanguage: 'en',
                currentStage: 'Disqualified',
                aiScore: randomInt(10, 40),
                leadTags: ['Disqualified'],
                disqualification: {
                    reason: randomElement(disqualReasons) as any,
                    disqualifiedBy: 'ai',
                    notes: 'Not a good fit',
                    disqualifiedAt: createdAt
                },
                version: 1
            };

            db.leads.create(lead);
            totalCreated++;
        }

        const allLeads = db.leads.findAll();
        const stageCount = {
            New: allLeads.filter(l => l.currentStage === 'New').length,
            AI_Calling: allLeads.filter(l => l.currentStage === 'AI_Calling').length,
            Qualified: allLeads.filter(l => l.currentStage === 'Qualified').length,
            Visit_Booked: allLeads.filter(l => l.currentStage === 'Visit_Booked').length,
            Visit_Completed: allLeads.filter(l => l.currentStage === 'Visit_Completed').length,
            Negotiation: allLeads.filter(l => l.currentStage === 'Negotiation').length,
            Booking_Done: allLeads.filter(l => l.currentStage === 'Booking_Done').length,
            Disqualified: allLeads.filter(l => l.currentStage === 'Disqualified').length,
        };

        // 2. Showcase Performance Metrics
        await seedPerformanceMatrixData();

        return NextResponse.json({
            success: true,
            message: `Created ${totalCreated} new leads and showcase performance metrics`,
            totalLeads: allLeads.length,
            stageCount
        });

    } catch (error) {
        console.error('Seed error:', error);
        return NextResponse.json(
            { error: 'Failed to seed data', details: String(error) },
            { status: 500 }
        );
    }
}
