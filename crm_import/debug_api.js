const http = require('http');
const fs = require('fs');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/campaigns/camp_1763880000001',
    method: 'GET',
};

console.log('Waiting 2 seconds...');
setTimeout(() => {
    const req = http.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        res.setEncoding('utf8');
        let body = '';
        res.on('data', (chunk) => {
            body += chunk;
        });
        res.on('end', () => {
            console.log('Response ended. Writing to file...');
            fs.writeFileSync('debug_output.json', body);
            console.log('Response written to debug_output.json');
        });
    });

    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });

    req.end();
}, 2000);
