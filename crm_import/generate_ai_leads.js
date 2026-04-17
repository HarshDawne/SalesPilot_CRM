/**
 * AI-Optimized CRM Mock Data Generator
 * 
 * Generates 100+ leads distributed across all 8 AI-optimized stages:
 * - New (15 leads)
 * - AI_Calling (20 leads with various sub-states)
 * - Qualified (18 leads)
 * - Visit_Booked (15 leads)
 * - Visit_Completed (12 leads)
 * - Negotiation (10 leads)
 * - Booking_Done (5 leads)
 * - Disqualified (15 leads)
 * 
 * Each lead includes:
 * - Stage-specific metadata
 * - 5-15 timeline events showing complete journey
 * - Realistic AI scores (20-95 range)
 * - Rich qualification data
 */

const { db } = require('./src/lib/db');
const { addTimelineEvent } = require('./src/lib/timeline');
const { v4: uuidv4 } = require('uuid');

console.log('🤖 Generating AI-Optimized CRM Mock Data...\n');

// ============================================================================
// HELPER DATA
// ============================================================================

const firstNames = ['Rohan', 'Priya', 'Amit', 'Sneha', 'Rahul', 'Anjali', 'Vikram', 'Pooja', 'Arjun', 'Kavya', 'Sanjay', 'Neha', 'Karan', 'Riya', 'Aditya', 'Divya', 'Rajesh', 'Meera', 'Nikhil', 'Shreya'];
const lastNames = ['Sharma', 'Gupta', 'Patel', 'Kumar', 'Singh', 'Reddy', 'Desai', 'Mehta', 'Joshi', 'Nair', 'Iyer', 'Kapoor', 'Malhotra', 'Verma', 'Agarwal'];

const locations = ['Bandra', 'Powai', 'Andheri', 'Juhu', 'Worli', 'Lower Parel', 'Thane', 'Navi Mumbai'];
const propertyTypes = ['1BHK', '2BHK', '3BHK', '4BHK', 'Villa', 'Duplex'];

const disqualificationReasons = [
    { reason: 'budget_mismatch', note: 'Budget too low for available properties' },
    { reason: 'location_mismatch', note: 'Preferred location not available' },
    { reason: 'no_intent', note: 'Just browsing, no immediate purchase intent' },
    { reason: 'invalid_contact', note: 'Phone number not reachable' },
    { reason: 'duplicate', note: 'Duplicate lead from another source' },
    { reason: 'not_eligible', note: 'Loan not approved' }
];

// ============================================================================
// PROJECTS (from existing data)
// ============================================================================

const projects = db.projects.findAll();
if (projects.length === 0) {
    console.error('❌ No projects found! Please run generate_mock_data.js first.');
    process.exit(1);
}

console.log(`Found ${projects.length} projects\n`);

// ============================================================================
// AGENTS
// ============================================================================

const agents = [
    { id: 'agent-1', name: 'Suresh Kumar', phone: '+91 9876543210' },
    { id: 'agent-2', name: 'Priya Sharma', phone: '+91 9876543211' },
    { id: 'agent-3', name: 'Rajesh Patel', phone: '+91 9876543212' },
    { id: 'agent-4', name: 'Anjali Desai', phone: '+91 9876543213' },
    { id: 'agent-5', name: 'Vikram Singh', phone: '+91 9876543214' }
];

// ============================================================================
// LEAD GENERATION FUNCTIONS
// ============================================================================

function randomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePhone() {
    return `+91 ${randomInt(70000, 99999)}${randomInt(10000, 99999)}`;
}

function generateEmail(firstName, lastName) {
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${randomElement(['gmail', 'yahoo', 'outlook'])}.com`;
}

function subtractDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result.toISOString();
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString();
}

function addHours(date, hours) {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result.toISOString();
}

// ============================================================================
// STAGE 1: NEW (15 leads)
// ============================================================================

console.log('Creating NEW leads (15)...');
const newLeads = [];

for (let i = 0; i < 15; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const createdAt = subtractDays(new Date(), randomInt(0, 2));

    const lead = {
        id: uuidv4(),
        createdAt,
        updatedAt: createdAt,
        createdVia: randomElement(['website', 'form', 'whatsapp', 'ad']),
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
        captureDetails: {
            formData: { source: 'website', campaign: 'google-ads' },
            utm: { source: 'google', medium: 'cpc', campaign: 'real-estate-mumbai' }
        }
    };

    newLeads.push(db.leads.create(lead));

    // Timeline: lead_created
    addTimelineEvent({
        leadId: lead.id,
        type: 'lead_created',
        summary: `Lead created from ${lead.createdVia}`,
        timestamp: createdAt,
        actor: 'system',
        payload: { source: lead.createdVia }
    });
}

console.log(`✅ Created ${newLeads.length} NEW leads\n`);

// ============================================================================
// STAGE 2: AI_CALLING (20 leads)
// ============================================================================

console.log('Creating AI_CALLING leads (20)...');
const aiCallingLeads = [];

for (let i = 0; i < 20; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const createdAt = subtractDays(new Date(), randomInt(0, 3));
    const attempts = randomInt(1, 4);
    const callRecords = [];

    for (let attempt = 1; attempt <= attempts; attempt++) {
        const callTime = addHours(createdAt, attempt * 2);
        const status = attempt === attempts ? randomElement(['connected', 'not_reachable', 'busy', 'no_answer']) : 'no_answer';
        const duration = status === 'connected' ? randomInt(60, 300) : 0;

        callRecords.push({
            callId: uuidv4(),
            startTime: callTime,
            endTime: duration > 0 ? addHours(callTime, duration / 3600) : undefined,
            status,
            duration,
            transcriptUrl: duration > 0 ? `/transcripts/${uuidv4()}.txt` : undefined,
            recordingUrl: duration > 0 ? `/recordings/${uuidv4()}.mp3` : undefined,
            aiConfidence: duration > 0 ? randomInt(40, 80) : 0,
            summary: duration > 0 ? 'Customer interested in 2-3 BHK properties in Powai area' : 'No answer'
        });
    }

    const lead = {
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
            attempts,
            callRecords,
            followupScheduled: callRecords[attempts - 1].status !== 'connected',
            followupAt: callRecords[attempts - 1].status !== 'connected' ? addDays(new Date(), 1) : undefined,
            lastAttemptAt: callRecords[attempts - 1].startTime
        }
    };

    aiCallingLeads.push(db.leads.create(lead));

    // Timeline events
    addTimelineEvent({
        leadId: lead.id,
        type: 'lead_created',
        summary: 'Lead created from website',
        timestamp: createdAt,
        actor: 'system'
    });

    callRecords.forEach((call, idx) => {
        addTimelineEvent({
            leadId: lead.id,
            type: call.status === 'connected' ? 'ai_call_connected' : 'ai_call_attempt',
            summary: call.status === 'connected' ?
                `AI call connected (${Math.floor(call.duration / 60)}m ${call.duration % 60}s)` :
                `AI call attempt #${idx + 1} - ${call.status}`,
            timestamp: call.startTime,
            actor: 'ai',
            payload: call
        });
    });
}

console.log(`✅ Created ${aiCallingLeads.length} AI_CALLING leads\n`);

// ============================================================================
// STAGE 3: QUALIFIED (18 leads)
// ============================================================================

console.log('Creating QUALIFIED leads (18)...');
const qualifiedLeads = [];

for (let i = 0; i < 18; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const createdAt = subtractDays(new Date(), randomInt(1, 5));
    const qualifiedAt = addHours(createdAt, randomInt(2, 8));
    const propertyType = randomElement(propertyTypes);
    const location = randomElement(locations);
    const budgetMin = randomInt(50, 150) * 100000; // 50L to 1.5Cr
    const budgetMax = budgetMin + randomInt(20, 50) * 100000;
    const aiScore = randomInt(70, 95);

    const lead = {
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
        preferredLanguage: randomElement(['en', 'hi']),
        currentStage: 'Qualified',
        aiScore,
        leadTags: ['Qualified', 'High Intent'],
        qualification: {
            budgetMin,
            budgetMax,
            budgetCurrency: 'INR',
            timeline: randomElement(['1-2 months', '2-3 months', '3-6 months']),
            timelineWeeks: randomInt(4, 24),
            preferredLocations: [location, randomElement(locations.filter(l => l !== location))],
            propertyType,
            decisionMaker: randomElement(['self', 'family']),
            loanPreApproved: randomInt(0, 1) === 1,
            intentLevel: randomElement(['medium', 'high']),
            qualifier: 'ai',
            qualifiedAt,
            qualificationNotes: `Interested in ${propertyType} in ${location}. Budget ${(budgetMin / 10000000).toFixed(1)}-${(budgetMax / 10000000).toFixed(1)} Cr.`
        }
    };

    qualifiedLeads.push(db.leads.create(lead));

    // Timeline
    addTimelineEvent({
        leadId: lead.id,
        type: 'lead_created',
        summary: 'Lead created from website',
        timestamp: createdAt,
        actor: 'system'
    });

    addTimelineEvent({
        leadId: lead.id,
        type: 'ai_call_connected',
        summary: 'AI call connected (3m 45s)',
        timestamp: addHours(createdAt, 1),
        actor: 'ai'
    });

    addTimelineEvent({
        leadId: lead.id,
        type: 'ai_qualified',
        summary: `Lead qualified by AI (Score: ${aiScore}/100)`,
        timestamp: qualifiedAt,
        actor: 'ai',
        payload: { aiScore, qualification: lead.qualification }
    });
}

console.log(`✅ Created ${qualifiedLeads.length} QUALIFIED leads\n`);

// ============================================================================
// STAGE 4: VISIT_BOOKED (15 leads)
// ============================================================================

console.log('Creating VISIT_BOOKED leads (15)...');
const visitBookedLeads = [];

for (let i = 0; i < 15; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const createdAt = subtractDays(new Date(), randomInt(2, 7));
    const qualifiedAt = addHours(createdAt, 3);
    const visitDateTime = addDays(new Date(), randomInt(1, 14));
    const project = randomElement(projects);
    const agent = randomElement(agents);
    const aiScore = randomInt(75, 92);

    const visitId = uuidv4();

    const lead = {
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
        aiScore,
        assignedAgentId: agent.id,
        leadTags: ['Visit Booked'],
        qualification: {
            budgetMin: randomInt(50, 150) * 100000,
            budgetMax: randomInt(200, 300) * 100000,
            budgetCurrency: 'INR',
            timeline: '2-3 months',
            timelineWeeks: 10,
            preferredLocations: [project.location],
            propertyType: randomElement(propertyTypes),
            intentLevel: 'high',
            qualifier: 'ai',
            qualifiedAt
        },
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
    };

    visitBookedLeads.push(db.leads.create(lead));

    // Create booking
    db.bookings.create({
        id: visitId,
        leadId: lead.id,
        projectId: project.id,
        slotStart: visitDateTime,
        slotEnd: addHours(visitDateTime, 1),
        duration: 60,
        mode: 'site_visit',
        status: 'confirmed',
        visitType: 'first_visit',
        assignedTo: agent.id,
        meetingPoint: project.address,
        createdAt: qualifiedAt,
        updatedAt: qualifiedAt
    });

    // Timeline
    addTimelineEvent({
        leadId: lead.id,
        type: 'lead_created',
        summary: 'Lead created from website',
        timestamp: createdAt,
        actor: 'system'
    });

    addTimelineEvent({
        leadId: lead.id,
        type: 'ai_qualified',
        summary: `Lead qualified by AI (Score: ${aiScore}/100)`,
        timestamp: qualifiedAt,
        actor: 'ai'
    });

    addTimelineEvent({
        leadId: lead.id,
        type: 'visit_booked',
        summary: `Visit booked for ${new Date(visitDateTime).toLocaleString()} at ${project.name}`,
        timestamp: qualifiedAt,
        actor: 'system',
        payload: { visitId, projectName: project.name, agentName: agent.name }
    });

    addTimelineEvent({
        leadId: lead.id,
        type: 'whatsapp_confirmation_sent',
        summary: 'WhatsApp visit confirmation sent',
        timestamp: addHours(qualifiedAt, 0.5),
        actor: 'system'
    });

    addTimelineEvent({
        leadId: lead.id,
        type: 'calendar_invite_sent',
        summary: 'Calendar invite sent',
        timestamp: addHours(qualifiedAt, 0.5),
        actor: 'system'
    });
}

console.log(`✅ Created ${visitBookedLeads.length} VISIT_BOOKED leads\n`);

// ============================================================================
// STAGE 5: VISIT_COMPLETED (12 leads)
// ============================================================================

console.log('Creating VISIT_COMPLETED leads (12)...');
const visitCompletedLeads = [];

for (let i = 0; i < 12; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const createdAt = subtractDays(new Date(), randomInt(5, 15));
    const visitDateTime = subtractDays(new Date(), randomInt(1, 5));
    const project = randomElement(projects);
    const agent = randomElement(agents);
    const rating = randomInt(3, 5);
    const aiScore = randomInt(80, 95);

    const lead = {
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
        aiScore,
        assignedAgentId: agent.id,
        leadTags: ['Visit Completed'],
        visitFeedback: {
            visitedAt: visitDateTime,
            feedbackRating: rating,
            interestLevelPostVisit: rating >= 4 ? 'high' : 'medium',
            notes: rating >= 4 ? 'Very interested, wants to see floor plans' : 'Interested but wants to compare with other projects',
            promisedFollowupDate: addDays(new Date(), randomInt(2, 5))
        }
    };

    visitCompletedLeads.push(db.leads.create(lead));

    // Timeline
    addTimelineEvent({
        leadId: lead.id,
        type: 'visit_completed',
        summary: 'Site visit completed',
        timestamp: visitDateTime,
        actor: 'system',
        payload: { rating, feedback: lead.visitFeedback.notes }
    });
}

console.log(`✅ Created ${visitCompletedLeads.length} VISIT_COMPLETED leads\n`);

// ============================================================================
// STAGE 6: NEGOTIATION (10 leads)
// ============================================================================

console.log('Creating NEGOTIATION leads (10)...');
const negotiationLeads = [];

for (let i = 0; i < 10; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const createdAt = subtractDays(new Date(), randomInt(10, 20));
    const project = randomElement(projects);
    const property = randomElement(db.properties.findByProjectId(project.id));
    const discount = randomInt(100000, 500000);
    const aiScore = randomInt(85, 98);

    const lead = {
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
        aiScore,
        leadTags: ['Negotiation'],
        proposal: {
            proposalId: uuidv4(),
            priceOffered: property.price - discount,
            discountOffered: discount,
            paymentPlan: { downPayment: 20, emi: 80 },
            documentsSent: ['floor_plan.pdf', 'payment_schedule.pdf', 'brochure.pdf'],
            negotiationStage: randomElement(['initial', 'under_negotiation', 'offer_accepted']),
            lastNegotiationAt: subtractDays(new Date(), randomInt(1, 3)),
            proposalNotes: `Offered ${property.type} at ${((property.price - discount) / 10000000).toFixed(2)} Cr with ${discount / 100000} L discount`
        }
    };

    negotiationLeads.push(db.leads.create(lead));

    // Timeline
    addTimelineEvent({
        leadId: lead.id,
        type: 'proposal_sent',
        summary: `Proposal sent for ${project.name}`,
        timestamp: lead.proposal.lastNegotiationAt,
        actor: 'system',
        payload: { proposalId: lead.proposal.proposalId, price: lead.proposal.priceOffered }
    });
}

console.log(`✅ Created ${negotiationLeads.length} NEGOTIATION leads\n`);

// ============================================================================
// STAGE 7: BOOKING_DONE (5 leads)
// ============================================================================

console.log('Creating BOOKING_DONE leads (5)...');
const bookingDoneLeads = [];

for (let i = 0; i < 5; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const createdAt = subtractDays(new Date(), randomInt(15, 30));
    const bookingAt = subtractDays(new Date(), randomInt(1, 7));
    const project = randomElement(projects);
    const property = randomElement(db.properties.findByProjectId(project.id));
    const bookingAmount = property.price * 0.1; // 10% booking amount
    const aiScore = randomInt(90, 100);

    const lead = {
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
        aiScore,
        leadTags: ['Booking Done', 'Won'],
        booking: {
            bookingId: uuidv4(),
            amountPaid: bookingAmount,
            paymentStatus: 'paid',
            kycStatus: randomElement(['verified', 'submitted']),
            unitLocked: true,
            unitId: property.id,
            projectId: project.id,
            bookingAt,
            paymentMethod: 'bank_transfer',
            transactionId: `TXN${randomInt(100000, 999999)}`
        }
    };

    bookingDoneLeads.push(db.leads.create(lead));

    // Timeline
    addTimelineEvent({
        leadId: lead.id,
        type: 'booking_paid',
        summary: `Booking amount paid: ₹${(bookingAmount / 100000).toFixed(2)} L`,
        timestamp: bookingAt,
        actor: 'system',
        payload: { amount: bookingAmount, transactionId: lead.booking.transactionId }
    });
}

console.log(`✅ Created ${bookingDoneLeads.length} BOOKING_DONE leads\n`);

// ============================================================================
// STAGE 8: DISQUALIFIED (15 leads)
// ============================================================================

console.log('Creating DISQUALIFIED leads (15)...');
const disqualifiedLeads = [];

for (let i = 0; i < 15; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const createdAt = subtractDays(new Date(), randomInt(1, 10));
    const disqualifiedAt = addHours(createdAt, randomInt(2, 48));
    const disqualReason = randomElement(disqualificationReasons);
    const aiScore = randomInt(10, 40);

    const lead = {
        id: uuidv4(),
        createdAt,
        updatedAt: disqualifiedAt,
        createdVia: randomElement(['website', 'ad', 'referral']),
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
        primaryPhone: generatePhone(),
        email: generateEmail(firstName, lastName),
        preferredContactMethod: 'phone',
        preferredLanguage: 'en',
        currentStage: 'Disqualified',
        aiScore,
        leadTags: ['Disqualified'],
        disqualification: {
            reason: disqualReason.reason,
            disqualifiedBy: randomElement(['ai', 'manual']),
            notes: disqualReason.note,
            disqualifiedAt
        }
    };

    disqualifiedLeads.push(db.leads.create(lead));

    // Timeline
    addTimelineEvent({
        leadId: lead.id,
        type: 'lead_created',
        summary: 'Lead created',
        timestamp: createdAt,
        actor: 'system'
    });

    addTimelineEvent({
        leadId: lead.id,
        type: 'ai_disqualified',
        summary: `Lead disqualified: ${disqualReason.reason.replace('_', ' ')}`,
        timestamp: disqualifiedAt,
        actor: lead.disqualification.disqualifiedBy,
        payload: { reason: disqualReason.reason, notes: disqualReason.note }
    });
}

console.log(`✅ Created ${disqualifiedLeads.length} DISQUALIFIED leads\n`);

// ============================================================================
// SUMMARY
// ============================================================================

const allLeads = db.leads.findAll();
const allTimeline = db.timeline.findAll();
const allBookings = db.bookings.findAll();

console.log('═══════════════════════════════════════════════════════════');
console.log('📊 MOCK DATA GENERATION COMPLETE');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('📈 LEADS BY STAGE:');
console.log(`   New:              ${newLeads.length}`);
console.log(`   AI_Calling:       ${aiCallingLeads.length}`);
console.log(`   Qualified:        ${qualifiedLeads.length}`);
console.log(`   Visit_Booked:     ${visitBookedLeads.length}`);
console.log(`   Visit_Completed:  ${visitCompletedLeads.length}`);
console.log(`   Negotiation:      ${negotiationLeads.length}`);
console.log(`   Booking_Done:     ${bookingDoneLeads.length}`);
console.log(`   Disqualified:     ${disqualifiedLeads.length}`);
console.log(`   ─────────────────────────────────────────────────────`);
console.log(`   TOTAL LEADS:      ${allLeads.length}\n`);

console.log('📋 OTHER DATA:');
console.log(`   Timeline Events:  ${allTimeline.length}`);
console.log(`   Bookings:         ${allBookings.length}`);
console.log(`   Projects:         ${projects.length}`);
console.log(`   Properties:       ${db.properties.findAll().length}\n`);

console.log('🎯 AI SCORE DISTRIBUTION:');
const scoreRanges = {
    '0-25': allLeads.filter(l => (l.aiScore || 0) <= 25).length,
    '26-50': allLeads.filter(l => (l.aiScore || 0) > 25 && (l.aiScore || 0) <= 50).length,
    '51-75': allLeads.filter(l => (l.aiScore || 0) > 50 && (l.aiScore || 0) <= 75).length,
    '76-100': allLeads.filter(l => (l.aiScore || 0) > 75).length
};
console.log(`   0-25:    ${scoreRanges['0-25']} leads`);
console.log(`   26-50:   ${scoreRanges['26-50']} leads`);
console.log(`   51-75:   ${scoreRanges['51-75']} leads`);
console.log(`   76-100:  ${scoreRanges['76-100']} leads\n`);

console.log('✅ All data generated successfully!');
console.log('🚀 You can now run the CRM application with: npm run dev\n');
