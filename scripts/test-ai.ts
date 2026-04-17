import { LeadService } from '../src/modules/leads/lead-service';
import { AIService } from '../src/modules/ai/ai-service';

// Mock the environment for the script
// Mock the environment for the script
process.env.AI_API_KEY = process.env.AI_API_KEY || "";

async function testAIFlow() {
    console.log("🚀 Starting AI Integration Test...");

    // 1. Simulate a Lead
    const mockLead = {
        name: "Vikram Malhotra",
        phone: "+91 9988776655",
        source: "WEBSITE",
        budget: { min: 20000000, max: 25000000 }, // 2-2.5 Cr (High Budget)
        preferences: {
            configuration: ["3BHK"],
            location: ["Downtown"]
        },
        metadata: {
            note: "Looking for a luxury apartment, ready to move in next month. Investor profile."
        }
    };

    console.log("📝 Creating Lead:", mockLead.name);

    // 2. Call Service
    const createdLead = await LeadService.createLead(mockLead as any);

    // 3. Output Result
    console.log("\n✅ Lead Created ID:", createdLead.id);
    console.log("---------------------------------------------------");
    console.log("🤖 AI Score:", createdLead.aiScore);
    console.log("🧠 AI Reasoning:", createdLead.aiReasoning);
    console.log("🏷️  AI Tags:", createdLead.aiTags);
    console.log("---------------------------------------------------");

    if (createdLead.aiScore !== undefined) {
        console.log("🎉 SUCCESS: AI Integration working!");
    } else {
        console.error("❌ FAILURE: AI fields missing.");
    }
}

testAIFlow().catch(console.error);
