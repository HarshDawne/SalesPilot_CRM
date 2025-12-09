// const fetch = require('node-fetch'); // Native fetch used

const BASE_URL = 'http://localhost:3000/api';

async function runVerification() {
    console.log("Starting Verification...");

    // 1. Create Lead (PRD Compliant)
    console.log("\n1. Creating Lead...");
    const leadData = {
        name: "Blueprint User",
        phone: "+919998887776", // E.164
        email: "blueprint@test.com",
        source: "WEBSITE",
        consent: true,
        page_url: "https://example.com/pricing",
        form_id: "pricing_modal",
        device: { ip: "127.0.0.1", user_agent: "TestScript" }
    };

    let leadId;

    try {
        const res = await fetch(`${BASE_URL}/leads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leadData)
        });
        const data = await res.json();
        console.log("Create Lead Response:", res.status, data.status === "created" ? "Success" : "Failed");
        if (data.lead_id) leadId = data.lead_id;
    } catch (e) {
        console.error("Create Lead Error:", e);
    }

    if (!leadId) return;

    // 2. Test Deduplication (Strong Match)
    console.log("\n2. Testing Deduplication...");
    try {
        const res = await fetch(`${BASE_URL}/leads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leadData)
        });
        const data = await res.json();
        console.log("Dedupe Response:", res.status, data.duplicate ? "Detected Duplicate (Pass)" : "Failed");
    } catch (e) {
        console.error("Dedupe Error:", e);
    }

    // 3. Test Call Log Webhook (PRD Compliant)
    console.log("\n3. Testing Call Log Webhook...");
    const callLogData = {
        event_id: "evt_" + Date.now(),
        job_id: "job_123",
        lead_id: leadId,
        call_sid: "CA_12345",
        status: "answered",
        summary: "Customer is interested in the project.",
        confidence: 0.95,
        transcript_url: "https://example.com/transcript.txt",
        recording_url: "https://example.com/recording.mp3",
        provider: "Vapi",
        timestamp: new Date().toISOString()
    };

    try {
        const res = await fetch(`${BASE_URL}/integrations/call-log`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(callLogData)
        });
        const data = await res.json();
        console.log("Call Log Response:", res.status, data.status === "success" ? "Success" : "Failed");
    } catch (e) {
        console.error("Call Log Error:", e);
    }

    // 4. Verify Lead Status & Activity
    console.log("\n4. Verifying Lead Status...");
    try {
        const res = await fetch(`${BASE_URL}/leads/${leadId}`);
        const lead = await res.json();
        console.log("Lead Status:", lead.status); // Should be AI-Qualified due to 'interested' in summary
        console.log("Activities Count:", lead.activities?.length);

        const callActivity = lead.activities.find(a => a.type === 'ai_call');
        if (callActivity) {
            console.log("Evidence Found:", callActivity.evidence?.length > 0 ? "Yes" : "No");
            console.log("Immutable:", callActivity.immutable ? "Yes" : "No");
        } else {
            console.log("Call Activity Not Found");
        }
    } catch (e) {
        console.error("Verify Lead Error:", e);
    }
}

runVerification();
