const http = require('http');

async function testCommFlow() {
    console.log('--- Starting Communication Engine E2E Test ---');

    // 1. Create Campaign
    console.log('\n1. Creating Campaign...');
    const campRes = await request('POST', '/api/comm/campaigns', {
        name: 'E2E Test Campaign',
        lead_query: 'all',
        script_id: 'test_script',
        mode: 'ai_call',
        concurrency: 2
    });
    const campaign = JSON.parse(campRes);
    console.log('Campaign Created:', campaign.id);

    // 2. Start Campaign
    console.log('\n2. Starting Campaign...');
    const startRes = await request('POST', `/api/comm/campaigns/${campaign.id}/start`, {});
    console.log('Start Response:', startRes);

    // 3. Trigger Single Call (Idempotency Test)
    console.log('\n3. Triggering Single Call...');
    // Need a valid lead ID - assuming one exists or we'd create one first
    // For test, we'll try with a mock ID and expect 404 or success if we had a lead
    // Let's just hit the endpoint to verify it responds
    const callRes = await request('POST', '/api/comm/calls', {
        lead_id: 'lead-1', // Valid lead ID
        script_id: 'script_1',
        mode: 'ai'
    });
    console.log('Call Response:', callRes);

    // 4. Simulate Webhook
    console.log('\n4. Simulating Webhook...');
    const webhookRes = await request('POST', '/api/integrations/call-log', {
        provider_call_id: 'mock_call_123',
        status: 'completed',
        lead_id: 'lead-1',
        transcript: 'Hello, I am interested.'
    });
    console.log('Webhook Response:', webhookRes);

    console.log('\n--- Test Complete ---');
}

function request(method, path, body) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': 'user-1' // Valid Admin User
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        });

        req.on('error', (e) => reject(e));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

testCommFlow();
