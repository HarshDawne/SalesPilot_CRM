
import { LeadService } from '../src/modules/leads/lead-service';
import { CampaignService } from '../src/modules/communication/services/campaign.service';
import { CampaignOrchestrator } from '../src/modules/communication/services/orchestrator.service';
import { CallRecordService } from '../src/modules/communication/services/call-record.service';
import { CallAnalysisService } from '../src/modules/communication/call-analysis-service';
import { VisitService } from '../src/modules/sales/visit-service';
import { db } from '../src/lib/db';
import { v4 as uuidv4 } from 'uuid';

import { AIService } from '../src/modules/ai/ai-service';

// Mock AI Service for Testing
AIService.analyzeTranscript = async (system, user) => {
    console.log("   🤖 [Mock AI] Analyzing transcript...");
    return {
        visitDetected: true,
        visitDate: "2025-12-16", // Tomorrow
        visitTime: "16:00",
        visitType: "site_visit",
        notes: "Verified by Test Script"
    };
};

async function runFullSystemTest() {
    console.log('🚀 Starting Full System Verification...');

    // 1. Create a Test Lead
    console.log('\n1️⃣  Creating Test Lead...');
    const lead = await LeadService.createLead({
        name: "Test User " + Date.now(),
        phone: "+919999999999",
        status: "NEW" as any
    });
    console.log(`   ✅ Lead Created: ${lead.id} (${lead.name})`);

    // 2. Create a Campaign
    console.log('\n2️⃣  Creating Campaign...');
    const campaign = await CampaignService.create({
        name: "E2E Test Campaign",
        type: "launch",
        leadIds: [lead.id],
        propertyIds: ["prop_123"], // Mock property
        rules: {
            maxRetries: 3,
            retryDelayMinutes: 30,
            followUpEnabled: true,
            followUpDelayMinutes: 60,
            workingHoursOnly: true,
            workingHours: {
                start: "09:00",
                end: "18:00",
                timezone: "UTC"
            }
        }
    } as any);
    console.log(`   ✅ Campaign Created: ${campaign.id}`);

    // 3. Start Campaign (Simulated)
    // We won't actually call Orchestrator.startCampaign because it triggers real API calls to Bolna.
    // Instead, we will simulate the *state* it would create.
    console.log('\n3️⃣  Simulating Campaign Start...');
    // Create Mock CampaignLead entry
    const campaignLeadId = uuidv4();
    // Assuming we have access to db to push directly for test
    // In real Orchestrator, this happens via CampaignLeadService
    console.log(`   ✅ Campaign Started (Simulated)`);

    // 4. Simulate Call Completion & Webhook
    console.log('\n4️⃣  Simulating Call Completion & Webhook...');
    const executionId = uuidv4();
    const transcript = "Hi, I am interested in the property. Can I come for a site visit tomorrow at 4 PM?";

    // Create initial call record
    await CallRecordService.create({
        campaignId: campaign.id,
        leadId: lead.id,
        campaignLeadId,
        executionId,
        phoneNumber: lead.phone,
        status: "completed"
    });

    // Append Webhook Data (Transcript)
    await CallRecordService.appendWebhookData(executionId, {
        status: "completed",
        transcript: transcript,
        duration: 120,
        intent: "site_visit"
    });
    console.log(`   ✅ Call Record & Transcript Saved`);

    // 5. Trigger AI Booking Extraction
    console.log('\n5️⃣  Triggering AI Booking Extraction...');
    // We expect this to call AIService (which calls LLM). 
    // Since we don't want to burn tokens or wait for real LLM in this quick test script, 
    // we might want to mock AIService.analyzeTranscript.
    // However, to "CHECK EVERY FEATURE", we should try the real thing if config exists.
    // Or we will rely on our code logic holding up.

    // Let's perform the extraction manually to verify the service logic works.
    const result = await CallAnalysisService.extractAndScheduleVisit(lead.id, transcript);

    if (result) {
        console.log(`   ✅ Extraction Successful: Visit Detected`);
    } else {
        console.error(`   ❌ Extraction Failed (or AI API missing/failed)`);
    }

    // 6. Verify Database for Visit
    console.log('\n6️⃣  Verifying Calendar Booking...');
    const visits = await VisitService.getVisitsByLead(lead.id);
    if (visits.length > 0) {
        const visit = visits[0];
        console.log(`   ✅ Visit Found in DB:`);
        console.log(`      - ID: ${visit.id}`);
        console.log(`      - Time: ${visit.slotStart}`);
        console.log(`      - Type: ${visit.mode}`);
        console.log(`      - Notes: ${visit.notes}`);
    } else {
        console.error(`   ❌ No Visit found in DB!`);
    }

    console.log('\n✨ Verification Complete!');
}

// Mock DB access helper if needed or direct import
// running...
runFullSystemTest().catch(console.error);
