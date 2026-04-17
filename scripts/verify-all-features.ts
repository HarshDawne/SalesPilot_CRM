
import { LeadService } from '../src/modules/leads/lead-service';
import { CampaignService } from '../src/modules/communication/services/campaign.service';
import { CallRecordService } from '../src/modules/communication/services/call-record.service';
import { CallAnalysisService } from '../src/modules/communication/call-analysis-service';
import { VisitService } from '../src/modules/sales/visit-service';
import { AIService } from '../src/modules/ai/ai-service'; // Import to mock
import { v4 as uuidv4 } from 'uuid';

// Mock AI Service for Testing
AIService.analyzeTranscript = async (system, user) => {
    console.log("   🤖 [Mock AI] Analyzing transcript...");
    return {
        visitDetected: true,
        visitDate: "2025-12-20",
        visitTime: "10:00",
        visitType: "site_visit",
        notes: "Verified by Feature Audit Script"
    };
};

async function verifyAllFeatures() {
    console.log('🚀 Starting Comprehensive Feature Verification...');
    const errors: string[] = [];

    try {
        // 1. LEAD MANAGEMENT
        console.log('\n1️⃣  Testing Lead Management...');
        const uniqueSuffix = Date.now().toString();
        const lead = await LeadService.createLead({
            name: `Audit User ${uniqueSuffix}`,
            phone: "+918888888888",
            status: "NEW" as any
        });
        if (!lead || !lead.id) throw new Error("Lead creation failed");
        console.log(`   ✅ Lead Created: ${lead.name}`);

        // 2. CAMPAIGN MANAGEMENT
        console.log('\n2️⃣  Testing Campaign Management...');
        const campaign = await CampaignService.create({
            name: `Audit Campaign ${uniqueSuffix}`,
            type: 'launch',
            leadIds: [lead.id],
            propertyIds: ["prop_audit"],
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
        });
        if (!campaign || !campaign.id) throw new Error("Campaign creation failed");
        console.log(`   ✅ Campaign Created: ${campaign.id}`);

        // 3. CALL SIMULATION (Mock Webhook)
        console.log('\n3️⃣  Testing Call Simulation...');
        const executionId = uuidv4();
        await CallRecordService.create({
            campaignId: campaign.id,
            leadId: lead.id,
            campaignLeadId: uuidv4(),
            executionId,
            phoneNumber: lead.phone,
            status: "completed"
        });
        await CallRecordService.appendWebhookData(executionId, {
            status: "completed",
            transcript: "Hello, I am very interested in this property. I would like to schedule a site visit to see the amenities. Can I come on Dec 20th at 10am? That works best for me.",
            duration: 120,
            intent: "site_visit"
        });
        console.log(`   ✅ Call Record Saved`);

        // 4. AI EXTRACTION & BOOKING
        console.log('\n4️⃣  Testing AI Extraction & Booking...');
        const visitScheduled = await CallAnalysisService.extractAndScheduleVisit(lead.id, "Hello, I am very interested in this property. I would like to schedule a site visit to see the amenities. Can I come on Dec 20th at 10am? That works best for me.");
        if (!visitScheduled) throw new Error("Visit extraction failed");
        console.log(`   ✅ Visit Scheduled: YES`);

        // 5. CALENDAR RETRIEVAL
        console.log('\n5️⃣  Testing Calendar Data...');
        const visits = await VisitService.getVisitsByLead(lead.id);
        const bookedVisit = visits.find(v => v.notes?.includes("Feature Audit"));
        if (!bookedVisit) throw new Error("Visit not found in DB retrieval");
        console.log(`   ✅ Visit Retrieved from DB`);

        console.log('\n✨ ALL SOFTWARE FEATURES VERIFIED SUCCESSFULLY!');

    } catch (error: any) {
        console.error('\n❌ VERIFICATION FAILED:', error.message);
        errors.push(error.message);
    }

    if (errors.length > 0) process.exit(1);
}

verifyAllFeatures();
