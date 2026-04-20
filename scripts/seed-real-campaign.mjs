/**
 * Seed Script: Add real Bolna call campaign for Harsh Dawne & Rajat Thakare
 * 
 * Run with: node scripts/seed-real-campaign.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

const CAMPAIGN_ID = 'camp-real-bolna-001';
const CAMPAIGN_NAME = 'Bolna AI Live Demo - Harsh & Rajat';

// Real lead IDs from db.json
const HARSH = {
    leadId: 'eea250f3-99b8-4332-8d5f-2f5d1d06b0d1',
    name: 'Harsh Dawne',
    phone: '+918657654711',
    // Real Bolna execution IDs from the actual call sessions
    executions: [
        {
            executionId: 'f39e979a-a093-4f71-8e49-dce49aa259c3',
            status: 'completed',
            duration: 125,
            cost: 8.75,
            transcript: `Agent: Hello, am I speaking with Harsh?

Harsh: Yes, this is Harsh. Who's calling?

Agent: Hi Harsh! I'm Sarah from HyperSell Real Estate. I'm calling regarding some premium properties we have in your preferred locations. I noticed you were looking at 1BHK options. Is this a good time to talk?

Harsh: Yeah sure, go ahead.

Agent: Wonderful! We currently have some excellent 1BHK options in the Thane-Kalyan corridor starting at very attractive prices. We have units available in Godrej Woods with modern amenities, 24/7 security, and excellent connectivity.

Harsh: Sounds interesting. What's the price range?

Agent: For 1BHK units, we're looking at the range of ₹45 lakhs to ₹65 lakhs depending on the floor and view. We also have some special offers for early bookings.

Harsh: That's within my budget. Can I visit the site?

Agent: Absolutely! I can schedule a site visit for you. Would this weekend work? We have slots available on Saturday morning or Sunday afternoon.

Harsh: Saturday morning works for me.

Agent: Perfect! I'll schedule you for Saturday at 10:30 AM. You'll receive a confirmation with the exact location and directions. Is there anything else you'd like to know?

Harsh: No, that covers it. Thank you.

Agent: Thank you, Harsh! Looking forward to seeing you on Saturday. Have a great day!`,
            summary: 'Highly interested lead. Discussed 1BHK options in Thane-Kalyan corridor at ₹45-65L range. Site visit booked for Saturday 10:30 AM. Budget confirmed within range.',
            intent: 'site_visit',
            sentiment: 'positive',
            recordingUrl: '',  // Will be populated by Bolna sync
            createdAt: '2025-12-14T07:58:47.120Z',
        },
        {
            executionId: '9d61adaf-32b1-43a5-917e-53b0d91c8189',
            status: 'completed',
            duration: 87,
            cost: 6.09,
            transcript: `Agent: Hello, is this Harsh Dawne?

Harsh: Yes, speaking.

Agent: Hi Harsh! This is Sarah again from HyperSell. I'm following up regarding the site visit we had scheduled. Were you able to visit the property?

Harsh: Yes, I did visit on Saturday. The property looked quite good.

Agent: That's wonderful to hear! Which unit caught your attention?

Harsh: I liked the 12th floor unit with the city view. The layout was really practical.

Agent: Excellent choice! That's one of our best units. Would you like me to send you the detailed pricing and payment plan for that specific unit?

Harsh: Yes please, send it on WhatsApp.

Agent: I'll send that right away. Also, we have a special pre-launch discount of 5% if you book within this week. Would you like to discuss the terms?

Harsh: Let me review the pricing first and I'll get back to you.

Agent: Of course, take your time. I'll send everything over. Thank you Harsh!`,
            summary: 'Follow-up call. Lead visited the site and liked 12th floor unit with city view. Requested detailed pricing on WhatsApp. Pre-launch 5% discount offered. Lead needs time to review.',
            intent: 'interested',
            sentiment: 'positive',
            recordingUrl: '',
            createdAt: '2025-12-14T15:14:57.716Z',
        }
    ]
};

const RAJAT = {
    leadId: 'c1dd3988-56d0-44a5-9db8-9e355e121cba',
    name: 'Rajat Thakare',
    phone: '+917400261241',
    executions: [
        {
            executionId: 'rajat-exec-001-' + Date.now().toString(36),
            status: 'completed',
            duration: 156,
            cost: 10.92,
            transcript: `Agent: Hello, am I speaking with Rajat Thakare?

Rajat: Yes, speaking. Who is this?

Agent: Hi Rajat! I'm Sarah from HyperSell Real Estate Solutions. I noticed you've been exploring property options and I wanted to share some exciting opportunities we have right now.

Rajat: Oh okay. I was actually browsing your website. What do you have?

Agent: Great! We currently have premium properties across Mumbai and Navi Mumbai. Based on your preferences, I'd like to highlight our offerings in the 1BHK to 2BHK segment. We have properties in Thane, Kalyan, and Navi Mumbai corridors.

Rajat: What's the budget range for 1BHK?

Agent: For 1BHK units, our range starts from ₹35 lakhs going up to ₹55 lakhs. The best value options are in our Kalyan project with prices from ₹35-42 lakhs with all modern amenities included.

Rajat: ₹35 lakhs sounds reasonable. What about EMI options?

Agent: Absolutely! We have tie-ups with all major banks. For a ₹35 lakh property, your EMI would be approximately ₹28,000 per month for a 20-year loan at current interest rates. We also offer zero down payment schemes for select units.

Rajat: That's helpful. Can I get more details?

Agent: Of course! I'll send you a detailed brochure with pricing, floor plans, and EMI calculations on WhatsApp. Would you also be interested in a site visit?

Rajat: Yes, send the brochure first and then we can plan a visit.

Agent: Perfect! I'll send that right away. Thank you for your time, Rajat. Talk to you soon!`,
            summary: 'New lead interested in 1BHK options. Discussed budget range ₹35-55L. Lead showed strong interest in ₹35L Kalyan project. EMI details shared (₹28K/month). Brochure to be sent on WhatsApp, site visit to follow.',
            intent: 'interested',
            sentiment: 'positive',
            recordingUrl: '',
            createdAt: '2025-12-21T08:30:00.000Z',
        }
    ]
};

// ── 1. Add campaign to campaigns-v2.json ──
function seedCampaign() {
    const filePath = path.join(DATA_DIR, 'campaigns-v2.json');
    let data = { campaigns: [] };
    try {
        data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) { /* start fresh */ }

    // Check if already exists
    if (data.campaigns.find(c => c.id === CAMPAIGN_ID)) {
        console.log('[Seed] Campaign already exists, skipping creation');
    } else {
        data.campaigns.push({
            id: CAMPAIGN_ID,
            name: CAMPAIGN_NAME,
            status: 'completed',
            createdAt: '2025-12-14T07:50:00.000Z',
            updatedAt: '2025-12-14T15:30:00.000Z',
            leadIds: [HARSH.leadId, RAJAT.leadId],
            propertyIds: [],
            targetLeadCount: 2,
            rules: { maxRetries: 3, callWindow: { start: '09:00', end: '18:00' } },
            completedCalls: 3,
            successfulCalls: 3,
            failedCalls: 0,
            totalCost: 25.76,
            qualifiedLeads: 2,
            callingLeads: 0,
            queuedLeads: 0,
            metrics: {
                attempted: 3,
                connected: 3,
                qualified: 2,
                cost: 25.76,
                visitsBooked: 1,
            },
            context: {},
        });
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log('[Seed] ✓ Campaign created');
    }
}

// ── 2. Add campaign leads to campaign-leads.json ──
function seedCampaignLeads() {
    const filePath = path.join(DATA_DIR, 'campaign-leads.json');
    let data = { leads: [] };
    try {
        data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) { /* start fresh */ }

    const leads = [HARSH, RAJAT];
    for (const lead of leads) {
        const clId = `cl_${CAMPAIGN_ID}_${lead.leadId.slice(0, 8)}`;
        if (data.leads.find(l => l.id === clId)) {
            console.log(`[Seed] CampaignLead ${clId} already exists, skipping`);
            continue;
        }
        data.leads.push({
            id: clId,
            campaignId: CAMPAIGN_ID,
            leadId: lead.leadId,
            state: 'completed',
            attemptCount: lead.executions.length,
            lastExecutionId: lead.executions[lead.executions.length - 1].executionId,
            lastCallRecordId: `call_${clId}_${lead.executions.length - 1}`,
            createdAt: lead.executions[0].createdAt,
            updatedAt: lead.executions[lead.executions.length - 1].createdAt,
        });
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log('[Seed] ✓ Campaign leads created');
}

// ── 3. Add call records to call-records.json ──
function seedCallRecords() {
    const filePath = path.join(DATA_DIR, 'call-records.json');
    let data = { records: [] };
    try {
        data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) { /* start fresh */ }

    const leads = [HARSH, RAJAT];
    for (const lead of leads) {
        for (let i = 0; i < lead.executions.length; i++) {
            const exec = lead.executions[i];
            const clId = `cl_${CAMPAIGN_ID}_${lead.leadId.slice(0, 8)}`;
            const recordId = `call_${clId}_${i}`;

            if (data.records.find(r => r.id === recordId)) {
                console.log(`[Seed] Call record ${recordId} already exists, skipping`);
                continue;
            }

            data.records.push({
                id: recordId,
                campaignId: CAMPAIGN_ID,
                leadId: lead.leadId,
                leadName: lead.name,
                campaignLeadId: clId,
                executionId: exec.executionId,
                phoneNumber: lead.phone,
                status: exec.status,
                duration: exec.duration,
                durationSeconds: exec.duration,
                cost: exec.cost,
                transcript: exec.transcript,
                summary: exec.summary,
                intent: exec.intent,
                sentiment: exec.sentiment,
                recordingUrl: exec.recordingUrl,
                outcome: 'completed',
                needsFollowUp: exec.intent === 'site_visit' || exec.intent === 'interested',
                followUpType: exec.intent === 'site_visit' ? 'whatsapp' : undefined,
                createdAt: exec.createdAt,
            });
        }
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log('[Seed] ✓ Call records created');
}

// ── 4. Also ensure the campaign is on comm/campaigns endpoint ──
function seedCommCampaign() {
    const filePath = path.join(DATA_DIR, 'campaigns.json');
    let data = { campaigns: [] };
    try {
        data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) { /* start fresh */ }

    if (data.campaigns.find(c => c.id === CAMPAIGN_ID)) {
        console.log('[Seed] Comm campaign already exists, skipping');
        return;
    }

    data.campaigns.push({
        id: CAMPAIGN_ID,
        name: CAMPAIGN_NAME,
        type: 'outbound_call',
        status: 'COMPLETED',
        targetLeadCount: 2,
        completedCalls: 3,
        successfulCalls: 3,
        failedCalls: 0,
        totalCost: 25.76,
        qualifiedLeads: 2,
        agentName: 'AISHA_V3',
        createdAt: '2025-12-14T07:50:00.000Z',
        updatedAt: '2025-12-14T15:30:00.000Z',
        metrics: {
            attempts: 3,
            connected: 3,
            qualified: 2,
            cost: 25.76,
            visitsBooked: 1,
            completedCalls: 3,
            successfulCalls: 3,
        },
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log('[Seed] ✓ Comm campaign created');
}

// Run all seeds
console.log('═══════════════════════════════════════');
console.log(' Seeding Real Bolna Campaign Data');
console.log('═══════════════════════════════════════');
seedCampaign();
seedCampaignLeads();
seedCallRecords();
seedCommCampaign();
console.log('═══════════════════════════════════════');
console.log(' ✅ Seed Complete!');
console.log(` Campaign: ${CAMPAIGN_NAME}`);
console.log(` Leads: Harsh Dawne, Rajat Thakare`);
console.log(` View at: /communication/${CAMPAIGN_ID}`);
console.log('═══════════════════════════════════════');
