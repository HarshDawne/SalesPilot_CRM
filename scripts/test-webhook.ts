
import fetch from "node-fetch";

async function testWebhook() {
    const API_URL = "http://localhost:3000/api/calls/webhook";

    // Using the ID we just added to jobs.json
    const EXECUTION_ID = "f39e979a-a093-4f71-8e49-dce49aa259c3";

    console.log("Testing Webhook Endpoint...");
    console.log("URL:", API_URL);

    const payload = {
        execution_id: EXECUTION_ID,
        status: "completed",
        call_duration: 125, // 2m 5s
        recording_url: "https://api.bolna.dev/recordings/sample.mp3",
        transcript: "Agent: Hello? User: Yes, I am interested.",
        to: "+918657654711"
    };

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        console.log(`Response Status: ${response.status}`);
        const data = await response.json();
        console.log(`Response Body:`, JSON.stringify(data, null, 2));

    } catch (error) {
        console.error("Webhook Test Error:", error);
    }
}

testWebhook();
