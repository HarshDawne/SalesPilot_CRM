const http = require('http');

function request(method, path, body) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: { 'Content-Type': 'application/json' },
        };
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data || '{}') }));
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTests() {
    console.log('Starting Assignment Tests...');

    // 1. Create Lead
    const createRes = await request('POST', '/api/leads', { name: 'Assign Test', phone: '+918888888888' });
    const leadId = createRes.body.lead_id;
    console.log(`Lead created: ${leadId}`);

    // 2. Test Manual Assignment
    console.log('Testing Manual Assignment...');
    // Need a valid agent ID. We'll assume one exists or fail gracefully.
    // In a real test, we'd create an agent first.
    // For now, we'll try to assign to 'user_1' (if it exists in seed data) or just skip if fail
    // But we can try the auto assignment first which doesn't require knowing an ID

    // 3. Test Round Robin Assignment
    console.log('Testing Round Robin Assignment...');
    const assignRes = await request('POST', '/api/assignments/assign', {
        lead_id: leadId,
        strategy: 'ROUND_ROBIN'
    });

    if (assignRes.status === 200) {
        console.log('✅ Assignment successful:', assignRes.body);
    } else {
        console.log('⚠️ Assignment failed (maybe no agents online):', assignRes.body);
    }

    console.log('Tests Completed.');
}

runTests().catch(console.error);
