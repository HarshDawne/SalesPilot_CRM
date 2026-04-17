const BASE_URL = 'http://localhost:3000/api';

async function runTest() {
    console.log("Starting Booking Integration Test...");

    // 1. Create Lead
    console.log("\n1. Creating Lead...");
    let leadId;
    try {
        const res = await fetch(`${BASE_URL}/leads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: "Booking User",
                phone: "+919998887799",
                email: "booking@test.com",
                source: "BookingTest"
            })
        });
        const data = await res.json();
        if (data.lead_id) leadId = data.lead_id;
        console.log("Lead Created:", leadId ? "Success" : "Failed");
    } catch (e) {
        console.error("Create Lead Error:", e);
    }

    if (!leadId) return;

    // 2. Send Webhook with Booking Details
    console.log("\n2. Sending Call Log with Booking...");
    const bookingPayload = {
        event_id: "evt_book_" + Date.now(),
        job_id: "job_book_123",
        lead_id: leadId,
        call_sid: "CA_BOOK_123",
        status: "answered",
        summary: "Customer wants to visit tomorrow at 10 AM.",
        booking_details: {
            slot_start: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            slot_end: new Date(Date.now() + 90000000).toISOString(),
            mode: "site_visit"
        },
        timestamp: new Date().toISOString()
    };

    try {
        const res = await fetch(`${BASE_URL}/integrations/call-log`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingPayload)
        });
        const data = await res.json();
        console.log("Webhook Response:", res.status, data.status === "success" ? "Success" : "Failed");
    } catch (e) {
        console.error("Webhook Error:", e);
    }

    // 3. Verify Lead Status & Booking
    console.log("\n3. Verifying Lead Status & Booking...");
    try {
        const res = await fetch(`${BASE_URL}/leads/${leadId}`);
        const lead = await res.json();
        console.log("Lead Status:", lead.status); // Should be 'Visit Booked'

        const bookingActivity = lead.activities.find(a => a.type === 'calendar_event_created');
        console.log("Booking Activity:", bookingActivity ? "Found" : "Missing");
        if (bookingActivity) {
            console.log("Booking ID:", bookingActivity.metadata.booking_id);
        }
    } catch (e) {
        console.error("Verify Error:", e);
    }
}

runTest();
