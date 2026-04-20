/**
 * List ALL executions from Bolna agent to find the 7-minute recording
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

const API_KEY = 'bn-490c8990e85248cab29fef3fa0b4a7e4';
const AGENT_ID = '7fae9ac6-de4f-4642-a7b4-3efe35bc7f51';
const BASE_URL = 'https://api.bolna.dev';

const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
};

async function tryFetch(url) {
    try {
        console.log(`  Trying: ${url}`);
        const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
        console.log(`  Status: ${res.status}`);
        if (res.ok) {
            const data = await res.json();
            console.log(`  ✓ Got data. Type: ${typeof data}, IsArray: ${Array.isArray(data)}`);
            return data;
        }
        const text = await res.text();
        console.log(`  Body:`, text.slice(0, 200));
    } catch (e) {
        console.log(`  Error:`, e.message);
    }
    return null;
}

async function main() {
    console.log('═══════════════════════════════════════════');
    console.log(' Listing ALL Bolna Executions for Agent');
    console.log(`  Agent: ${AGENT_ID}`);
    console.log('═══════════════════════════════════════════\n');

    // Try various endpoints to list all executions
    const urls = [
        `${BASE_URL}/agent/${AGENT_ID}/executions`,
        `${BASE_URL}/agent/${AGENT_ID}/executions?limit=50`,
        `${BASE_URL}/agents/${AGENT_ID}/executions`,
        `${BASE_URL}/call/history?agent_id=${AGENT_ID}`,
        `${BASE_URL}/executions?agent_id=${AGENT_ID}`,
        `${BASE_URL}/agent/${AGENT_ID}/runs`,
        `${BASE_URL}/v2/agent/${AGENT_ID}/executions`,
    ];

    for (const url of urls) {
        const data = await tryFetch(url);
        if (data) {
            const items = Array.isArray(data) ? data : (data.executions || data.data || data.results || [data]);
            console.log(`\n📋 Found ${items.length} execution(s)\n`);
            
            for (const item of items) {
                const id = item.id || item.execution_id || 'unknown';
                const duration = item.conversation_duration ?? item.duration ?? item.call_duration ?? 0;
                const status = item.status || 'unknown';
                const recording = item.recording_url || item.telephony_data?.recording_url || '';
                const transcript = item.transcript || '';
                const cost = item.total_cost ?? item.cost ?? 0;
                const created = item.created_at || item.initiated_at || '';
                
                console.log(`  ID: ${id}`);
                console.log(`    Duration: ${duration}s (${(duration/60).toFixed(1)}m)`);
                console.log(`    Status: ${status}`);
                console.log(`    Cost: ₹${cost}`);
                console.log(`    Has Recording: ${!!recording}`);
                console.log(`    Transcript: ${transcript.length} chars`);
                console.log(`    Created: ${created}`);
                if (recording) console.log(`    Recording: ${recording}`);
                console.log('');
            }

            // Save full data
            fs.writeFileSync(
                path.join(DATA_DIR, 'bolna-all-executions.json'),
                JSON.stringify(data, null, 2)
            );
            console.log('💾 Saved full data to bolna-all-executions.json');
            break; // Found a working endpoint
        }
    }
}

main().catch(console.error);
