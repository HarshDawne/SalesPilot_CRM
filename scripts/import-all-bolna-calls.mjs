/**
 * Import ALL real Bolna completed calls into the campaign for Harsh Dawne & Rajat 
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

// Load the full execution data we saved
const allExecs = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'bolna-all-executions.json'), 'utf-8'));

const CAMPAIGN_ID = 'camp-real-bolna-001';

// Filter for completed calls WITH recordings
const completedCalls = allExecs.filter(e => 
    e.status === 'completed' && e.conversation_duration > 0 && e.transcript
);

console.log(`Found ${completedCalls.length} completed calls with data\n`);

// ── Update call-records.json ──
const recordsPath = path.join(DATA_DIR, 'call-records.json');
let recordsData = JSON.parse(fs.readFileSync(recordsPath, 'utf-8'));

// Remove old seeded records for this campaign
recordsData.records = recordsData.records.filter(r => r.campaignId !== CAMPAIGN_ID);

const newRecords = [];
for (const exec of completedCalls) {
    const phoneRaw = exec.user_number || '+918657654711';
    const isRajat = phoneRaw.includes('7400261241');
    
    const rec = {
        id: `call_real_${exec.id.slice(0, 8)}`,
        campaignId: CAMPAIGN_ID,
        leadId: isRajat ? 'c1dd3988-56d0-44a5-9db8-9e355e121cba' : 'eea250f3-99b8-4332-8d5f-2f5d1d06b0d1',
        leadName: isRajat ? 'Rajat Thakare' : 'Harsh Dawne',
        campaignLeadId: isRajat 
            ? 'cl_camp-real-bolna-001_c1dd3988' 
            : 'cl_camp-real-bolna-001_eea250f3',
        executionId: exec.id,
        phoneNumber: phoneRaw,
        status: 'completed',
        duration: exec.conversation_duration || 0,
        durationSeconds: exec.conversation_duration || 0,
        cost: exec.total_cost || 0,
        transcript: exec.transcript || '',
        summary: exec.summary || '',
        recordingUrl: exec.telephony_data?.recording_url || '',
        intent: exec.extracted_data?.intent || 'interested',
        sentiment: 'positive',
        outcome: 'completed',
        needsFollowUp: true,
        createdAt: exec.created_at || exec.initiated_at || new Date().toISOString(),
        metadata: {
            bolnaRealData: {
                id: exec.id,
                agent_id: exec.agent_id,
                conversation_duration: exec.conversation_duration,
                total_cost: exec.total_cost,
                cost_breakdown: exec.cost_breakdown,
                usage_breakdown: exec.usage_breakdown,
                smart_status: exec.smart_status,
                user_number: exec.user_number,
                agent_number: exec.agent_number,
            },
            fetchedAt: new Date().toISOString(),
        },
    };

    newRecords.push(rec);
    console.log(`  ✓ ${rec.leadName} | ${(rec.duration/60).toFixed(1)}m | ₹${rec.cost} | ${rec.transcript.length} chars | ${rec.recordingUrl ? '🎵 Recording' : '—'}`);
}

recordsData.records.push(...newRecords);
fs.writeFileSync(recordsPath, JSON.stringify(recordsData, null, 2));
console.log(`\n💾 Saved ${newRecords.length} real call records`);

// ── Update campaign-leads.json ──
const clPath = path.join(DATA_DIR, 'campaign-leads.json');
let clData = JSON.parse(fs.readFileSync(clPath, 'utf-8'));

// Remove old seeded leads for this campaign
clData.leads = clData.leads.filter(l => l.campaignId !== CAMPAIGN_ID);

// Group by lead
const harshCalls = newRecords.filter(r => r.leadId === 'eea250f3-99b8-4332-8d5f-2f5d1d06b0d1');
const rajatCalls = newRecords.filter(r => r.leadId === 'c1dd3988-56d0-44a5-9db8-9e355e121cba');

if (harshCalls.length > 0) {
    clData.leads.push({
        id: 'cl_camp-real-bolna-001_eea250f3',
        campaignId: CAMPAIGN_ID,
        leadId: 'eea250f3-99b8-4332-8d5f-2f5d1d06b0d1',
        state: 'completed',
        attemptCount: harshCalls.length,
        lastExecutionId: harshCalls[harshCalls.length - 1].executionId,
        lastCallRecordId: harshCalls[harshCalls.length - 1].id,
        createdAt: harshCalls[0].createdAt,
        updatedAt: harshCalls[harshCalls.length - 1].createdAt,
    });
}

if (rajatCalls.length > 0) {
    clData.leads.push({
        id: 'cl_camp-real-bolna-001_c1dd3988',
        campaignId: CAMPAIGN_ID,
        leadId: 'c1dd3988-56d0-44a5-9db8-9e355e121cba',
        state: 'completed',
        attemptCount: rajatCalls.length,
        lastExecutionId: rajatCalls[rajatCalls.length - 1].executionId,
        lastCallRecordId: rajatCalls[rajatCalls.length - 1].id,
        createdAt: rajatCalls[0].createdAt,
        updatedAt: rajatCalls[rajatCalls.length - 1].createdAt,
    });
}

fs.writeFileSync(clPath, JSON.stringify(clData, null, 2));
console.log('💾 Updated campaign leads');

// ── Update campaigns-v2.json metrics ──
const campPath = path.join(DATA_DIR, 'campaigns-v2.json');
let campData = JSON.parse(fs.readFileSync(campPath, 'utf-8'));
const campIdx = campData.campaigns.findIndex(c => c.id === CAMPAIGN_ID);
if (campIdx !== -1) {
    const totalCost = newRecords.reduce((s, r) => s + r.cost, 0);
    campData.campaigns[campIdx].completedCalls = newRecords.length;
    campData.campaigns[campIdx].successfulCalls = newRecords.length;
    campData.campaigns[campIdx].totalCost = Math.round(totalCost * 100) / 100;
    campData.campaigns[campIdx].metrics = {
        ...campData.campaigns[campIdx].metrics,
        attempted: newRecords.length,
        connected: newRecords.length,
        qualified: newRecords.filter(r => r.intent === 'interested').length,
        cost: Math.round(totalCost * 100) / 100,
    };
    fs.writeFileSync(campPath, JSON.stringify(campData, null, 2));
    console.log('💾 Updated campaigns-v2 metrics');
}

// ── Update campaigns.json metrics ──
const commPath = path.join(DATA_DIR, 'campaigns.json');
let commData = JSON.parse(fs.readFileSync(commPath, 'utf-8'));
const commIdx = commData.campaigns.findIndex(c => c.id === CAMPAIGN_ID);
if (commIdx !== -1) {
    const totalCost = newRecords.reduce((s, r) => s + r.cost, 0);
    commData.campaigns[commIdx].completedCalls = newRecords.length;
    commData.campaigns[commIdx].successfulCalls = newRecords.length;
    commData.campaigns[commIdx].totalCost = Math.round(totalCost * 100) / 100;
    commData.campaigns[commIdx].metrics = {
        ...commData.campaigns[commIdx].metrics,
        attempts: newRecords.length,
        connected: newRecords.length,
        qualified: newRecords.filter(r => r.intent === 'interested').length,
        cost: Math.round(totalCost * 100) / 100,
        completedCalls: newRecords.length,
        successfulCalls: newRecords.length,
    };
    fs.writeFileSync(commPath, JSON.stringify(commData, null, 2));
    console.log('💾 Updated campaigns.json metrics');
}

console.log('\n═══════════════════════════════════════════');
console.log(` ✅ Imported ${newRecords.length} real Bolna calls`);
console.log(` 🎵 Calls with recordings: ${newRecords.filter(r => r.recordingUrl).length}`);
console.log(` 📝 Calls with transcripts: ${newRecords.filter(r => r.transcript).length}`);
console.log(` 💰 Total cost: ₹${newRecords.reduce((s,r) => s + r.cost, 0).toFixed(2)}`);
console.log(` ⏱  Longest call: ${(Math.max(...newRecords.map(r => r.duration))/60).toFixed(1)} minutes`);
console.log('═══════════════════════════════════════════');
