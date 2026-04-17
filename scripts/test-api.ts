
import fetch from "node-fetch";
import fs from "fs";
import path from "path";

async function testApi() {
    console.log("1. Validating jobs.json...");
    try {
        const jobsPath = path.join(process.cwd(), "data", "jobs.json");
        if (fs.existsSync(jobsPath)) {
            const content = fs.readFileSync(jobsPath, "utf-8");
            JSON.parse(content);
            console.log("   jobs.json is valid JSON.");
        } else {
            console.log("   jobs.json NOT found.");
        }
    } catch (e) {
        console.error("   CRITICAL: jobs.json is INVALID JSON:", (e as any).message);
        return;
    }

    console.log("2. Testing Analytics API...");
    try {
        const res = await fetch("http://localhost:3000/api/comm/analytics");
        console.log(`   Status: ${res.status}`);
        if (res.ok) {
            const data = await res.json();
            console.log("   Data received:", JSON.stringify(data).slice(0, 100) + "...");
        } else {
            const txt = await res.text();
            console.log("   Error:", txt);
        }
    } catch (e: any) {
        console.error('   ❌ Error:', e.message);
    }
}

testApi();
