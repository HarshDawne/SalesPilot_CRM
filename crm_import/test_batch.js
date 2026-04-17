const BASE_URL = 'http://localhost:3000/api';

async function runTest() {
    console.log("Starting Batch Call Test...");

    // 1. Create 3 Test Leads
    console.log("\n1. Creating Test Leads...");
    const leadIds = [];
    for (let i = 1; i <= 3; i++) {
        try {
            const res = await fetch(`${BASE_URL}/leads`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `Batch Lead ${i}`,
                    phone: `+91999888770${i}`,
                    email: `batch${i}@test.com`,
                    source: "BatchTest"
                })
            });
            const data = await res.json();
            if (data.lead_id) leadIds.push(data.lead_id);
        } catch (e) {
            console.error(`Create Lead ${i} Error:`, e);
        }
    }
    console.log(`Created ${leadIds.length} leads:`, leadIds);

    if (leadIds.length === 0) return;

    // 2. Batch Call
    console.log("\n2. Triggering Batch Call...");
    try {
        const res = await fetch(`${BASE_URL}/leads/batch-call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leadIds })
        });
        const data = await res.json();
        console.log("Batch Call Response:", res.status, data.status === "success" ? "Success" : "Failed");
        console.log("Queued Count:", data.queued);
    } catch (e) {
        console.error("Batch Call Error:", e);
    }

    // 3. Verify Activities
    console.log("\n3. Verifying Activities...");
    for (const id of leadIds) {
        try {
            const res = await fetch(`${BASE_URL}/leads/${id}`);
            const lead = await res.json();
            const callActivity = lead.activities.find(a => a.type === 'call_initiated' && a.metadata?.batch);
            console.log(`Lead ${id} Activity:`, callActivity ? "Found" : "Missing");
        } catch (e) {
            console.error(`Verify Lead ${id} Error:`, e);
        }
    }
}

runTest();
