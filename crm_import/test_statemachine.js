const { spawn } = require('child_process');
const http = require('http');

// Helper to make HTTP requests
function request(method, path, body) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({ status: res.statusCode, body: JSON.parse(data || '{}') });
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runTests() {
    console.log('Starting State Machine Tests...');

    // 1. Create a Lead
    console.log('Creating a new lead...');
    const createRes = await request('POST', '/api/leads', {
        name: 'Test Lead',
        phone: '+919999999999',
        source: 'WEBSITE'
    });

    if (createRes.status !== 201) {
        console.error('Failed to create lead:', createRes.body);
        return;
    }

    const leadId = createRes.body.lead_id;
    console.log(`Lead created with ID: ${leadId}`);

    // 2. Try Invalid Transition (New -> Visit_Booked)
    console.log('Testing Invalid Transition (New -> Visit_Booked)...');
    const invalidTransitionRes = await request('POST', `/api/leads/${leadId}/transition`, {
        to_stage: 'Visit_Booked',
        actor_id: 'system',
        version: 1,
        payload: { visit_date: new Date().toISOString(), agent_id: 'agent1' }
    });

    if (invalidTransitionRes.status === 400) {
        console.log('✅ Invalid transition correctly rejected.');
    } else {
        console.error('❌ Invalid transition failed to reject:', invalidTransitionRes.body);
    }

    // 3. Valid Transition (New -> AI_Calling)
    console.log('Testing Valid Transition (New -> AI_Calling)...');
    const validTransitionRes = await request('POST', `/api/leads/${leadId}/transition`, {
        to_stage: 'AI_Calling',
        actor_id: 'system',
        version: 1,
        payload: {}
    });

    if (validTransitionRes.status === 200) {
        console.log('✅ Valid transition successful.');
    } else {
        console.error('❌ Valid transition failed:', validTransitionRes.body);
    }

    // 4. Optimistic Locking Test
    console.log('Testing Optimistic Locking...');
    // Try to update with old version (1), current should be 2
    const lockingRes = await request('POST', `/api/leads/${leadId}/transition`, {
        to_stage: 'Qualified',
        actor_id: 'system',
        version: 1, // Old version
        payload: {}
    });

    if (lockingRes.status === 409) {
        console.log('✅ Optimistic locking correctly rejected old version.');
    } else {
        console.error('❌ Optimistic locking failed to reject:', lockingRes.body);
    }

    console.log('Tests Completed.');
}

// Ensure server is running before running tests
// For now, we assume the user has the server running or we can't easily start it here without blocking
// So we just run the tests assuming localhost:3000 is up.
runTests().catch(console.error);
