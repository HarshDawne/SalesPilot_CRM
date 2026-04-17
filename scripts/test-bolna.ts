
import { VOICE_CONFIG as BOLNA_CONFIG } from "../src/lib/voice-config";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";

// Load env
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Re-read config after loading env (since voice-config might have been evaluated already)
// Actually, if voice-config is a constant export, it might have captured the values already.
// Let's re-bind if necessary.
const config = {
    API_KEY: process.env.BOLNA_API_KEY || BOLNA_CONFIG.API_KEY,
    AGENT_ID: process.env.BOLNA_AGENT_ID || BOLNA_CONFIG.AGENT_ID,
    API_URL: process.env.BOLNA_API_URL || BOLNA_CONFIG.API_URL
};


async function testBolna() {
    const TEST_PHONE = "+918657654711"; // User provided number with country code
    const TEST_NAME = "Harsh Dawne";

    console.log("Testing Bolna API with:");
    console.log("URL:", config.API_URL);
    console.log("Agent ID:", config.AGENT_ID);
    console.log("Phone:", TEST_PHONE);

    const payload = {
        agent_id: config.AGENT_ID,
        recipient_phone_number: TEST_PHONE,
        user_data: {
            lead_name: TEST_NAME,
            lead_source: "Manual Test",
            interest: "Debugging"
        }
    };

    try {
        const response = await fetch(config.API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${config.API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const status = response.status;
        const text = await response.text();

        console.log("------------------------------------------------");
        console.log(`Response Status: ${status}`);
        console.log(`Response Body: ${text}`);
        console.log("------------------------------------------------");

    } catch (error) {
        console.error("Network/Script Error:", error);
    }
}

testBolna();
