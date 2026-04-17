const fs = require('fs');
const path = require('path');
const dbPath = path.join(process.cwd(), 'data', 'db.json');

if (fs.existsSync(dbPath)) {
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    console.log('Leads:', db.leads ? db.leads.length : 0);
    console.log('Timeline Events:', db.timeline ? db.timeline.length : 0);
    console.log('Projects:', db.projects ? db.projects.length : 0);
    console.log('Units:', db.units ? db.units.length : 0);
    
    if (db.timeline && db.timeline.length > 0) {
        console.log('First timeline event:', db.timeline[0].timestamp);
        console.log('Last timeline event:', db.timeline[db.timeline.length - 1].timestamp);
    }
} else {
    console.log('db.json not found');
}
