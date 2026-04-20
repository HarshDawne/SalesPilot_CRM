/**
 * Fetch REAL call data from Bolna API for actual execution IDs
 * and update call-records.json with actual recording URLs, transcripts, costs.
 * 
 * Run: node scripts/fetch-bolna-recordings.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

const API_KEY = 'bn-490c8990e85248cab29fef3fa0b4a7e4';
const BASE_URL = 'https://api.bolna.dev';

// Real execution IDs from jobs.json
const REAL_EXECUTION_IDS = [
    'f39e979a-a093-4f71-8e49-dce49aa259c3',  // Harsh Dawne - completed call
    '9d61adaf-32b1-43a5-917e-53b0d91c8189',  // Harsh Dawne - second call
    '1aa37dd4-abfe-4499-a550-8937af99ff61',  // Harsh Dawne - first call
    'fd4c2720-d42c-4acf-b5a6-19618c7f6434',  // from call-records (newer)
    '4b111f4e-d37e-4709-a145-e931e2bb1a5c',  // from call-records (newest)
];

const ENDPOINTS = [
    (id) => `${BASE_URL}/call/details/${id}`,
    (id) => `${BASE_URL}/execution/${id}`,
    (id) => `${BASE_URL}/executions/${id}`,
];

async function fetchFromBolna(executionId) {
    const headers = {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
    };

    for (const makeUrl of ENDPOINTS) {
        const url = makeUrl(executionId);
        try {
            console.log(`  Trying: ${url}`);
            const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
            if (res.ok) {
                const data = await res.json();
                console.log(`  ✓ Got data from: ${url}`);
                return data;
            }
            console.log(`  ✗ ${res.status} at ${url}`);
        } catch (err) {
            console.log(`  ✗ Error at ${url}: ${err.message}`);
        }
    }
    return null;
}

async function main() {
    console.log('═══════════════════════════════════════════');
    console.log(' Fetching REAL Bolna Call Data');
    console.log('═══════════════════════════════════════════\n');

    const results = [];

    for (const execId of REAL_EXECUTION_IDS) {
        console.log(`\n📞 Fetching: ${execId}`);
        const data = await fetchFromBolna(execId);
        
        if (data) {
            console.log('  📊 Raw Data Keys:', Object.keys(data));
            
            // Extract normalized fields
            const normalized = {
                executionId: execId,
                status: data.status || data.call_status || 'unknown',
                duration: data.conversation_time ?? data.conversation_duration ?? data.call_duration ?? data.duration ?? data.telephony_data?.duration ?? 0,
                total_cost: data.total_cost ?? data.cost ?? data.usage_cost ?? 0,
                cost_breakdown: data.cost_breakdown || null,
                transcript: data.transcript ?? data.conversation_text ?? '',
                recording_url: data.recording_url ?? data.telephony_data?.recording_url ?? data.audio_url ?? '',
                summary: data.summary ?? data.call_summary ?? '',
                intent: data.intent ?? data.detected_intent ?? data.extracted_data?.intent ?? '',
                extracted_data: data.extracted_data || null,
                hangup_reason: data.hangup_reason ?? data.telephony_data?.hangup_reason ?? '',
            };

            console.log('  ✓ Status:', normalized.status);
            console.log('  ✓ Duration:', normalized.duration, 'seconds');
            console.log('  ✓ Cost:', normalized.total_cost);
            console.log('  ✓ Has Transcript:', !!normalized.transcript && normalized.transcript.length > 0);
            console.log('  ✓ Transcript Length:', normalized.transcript?.length || 0, 'chars');
            console.log('  ✓ Recording URL:', normalized.recording_url || '(none)');
            console.log('  ✓ Summary:', normalized.summary?.slice(0, 100) || '(none)');

            results.push({ normalized, raw: data });
            
            // Save raw response for debugging
            const debugPath = path.join(DATA_DIR, `bolna-debug-${execId.slice(0, 8)}.json`);
            fs.writeFileSync(debugPath, JSON.stringify(data, null, 2));
            console.log(`  💾 Saved raw debug data to: bolna-debug-${execId.slice(0, 8)}.json`);
        } else {
            console.log('  ❌ No data returned from any endpoint');
        }
    }

    // Now update call-records.json with real data
    if (results.length > 0) {
        console.log('\n\n═══════════════════════════════════════════');
        console.log(' Updating Call Records with Real Data');
        console.log('═══════════════════════════════════════════\n');

        const recordsPath = path.join(DATA_DIR, 'call-records.json');
        let recordsData = { records: [] };
        try {
            recordsData = JSON.parse(fs.readFileSync(recordsPath, 'utf-8'));
        } catch (e) { /* fresh */ }

        let updated = 0;
        for (const { normalized } of results) {
            // Find matching record
            const idx = recordsData.records.findIndex(r => r.executionId === normalized.executionId);
            if (idx !== -1) {
                const r = recordsData.records[idx];
                // Update with real data (only if Bolna returned meaningful values)
                if (normalized.duration > 0) r.duration = normalized.duration;
                if (normalized.duration > 0) r.durationSeconds = normalized.duration;
                if (normalized.total_cost > 0) r.cost = normalized.total_cost;
                if (normalized.transcript) r.transcript = normalized.transcript;
                if (normalized.recording_url) r.recordingUrl = normalized.recording_url;
                if (normalized.summary) r.summary = normalized.summary;
                if (normalized.intent) r.intent = normalized.intent;
                if (normalized.status === 'completed') r.status = 'completed';
                r.metadata = { ...r.metadata, bolnaRealData: normalized, fetchedAt: new Date().toISOString() };
                recordsData.records[idx] = r;
                updated++;
                console.log(`  ✓ Updated record for ${normalized.executionId.slice(0, 8)}...`);
            } else {
                console.log(`  ⚠ No matching record for ${normalized.executionId.slice(0, 8)}... (will create new)`);
                // Create a new record
                recordsData.records.push({
                    id: `call_bolna_real_${normalized.executionId.slice(0, 8)}`,
                    campaignId: 'camp-real-bolna-001',
                    leadId: 'eea250f3-99b8-4332-8d5f-2f5d1d06b0d1',
                    leadName: 'Harsh Dawne',
                    campaignLeadId: 'cl_camp-real-bolna-001_eea250f3',
                    executionId: normalized.executionId,
                    phoneNumber: '+918657654711',
                    status: normalized.status === 'completed' ? 'completed' : 'completed',
                    duration: normalized.duration,
                    durationSeconds: normalized.duration,
                    cost: normalized.total_cost,
                    transcript: normalized.transcript,
                    summary: normalized.summary,
                    recordingUrl: normalized.recording_url,
                    intent: normalized.intent,
                    sentiment: 'positive',
                    outcome: 'completed',
                    needsFollowUp: false,
                    createdAt: new Date().toISOString(),
                    metadata: { bolnaRealData: normalized, fetchedAt: new Date().toISOString() },
                });
                updated++;
            }
        }

        fs.writeFileSync(recordsPath, JSON.stringify(recordsData, null, 2));
        console.log(`\n  💾 Saved ${updated} updated records to call-records.json`);
    }

    console.log('\n═══════════════════════════════════════════');
    console.log(` ✅ Done! Fetched data for ${results.length}/${REAL_EXECUTION_IDS.length} executions`);
    console.log('═══════════════════════════════════════════');
}

main().catch(console.error);
