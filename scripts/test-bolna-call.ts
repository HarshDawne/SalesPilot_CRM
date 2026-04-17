
import { BolnaService } from "../src/modules/communication/bolna-service";
import { LeadSource, LeadStatus } from "../src/modules/leads/types";
import dotenv from "dotenv";
import path from "path";

// Load env
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function testCall() {
    console.log("Testing Bolna Call Initiation...");

    const mockLead: any = {
        id: "test-lead-id",
        name: "Test User",
        primaryPhone: "+919876543210", // Use a valid-looking phone
        source: LeadSource.WEBSITE,
        status: LeadStatus.NEW,
        preferences: {
            configuration: ["2BHK"]
        }
    };

    const result = await BolnaService.initiateCall(mockLead.id, "test-campaign-id");
    console.log("Result:", JSON.stringify(result, null, 2));
}

testCall().catch(console.error);
