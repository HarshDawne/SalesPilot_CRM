const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/db.json');

// Allowed transitions map (simplified for migration check)
const ALLOWED_STAGES = [
    'New',
    'AI_Calling',
    'Qualified',
    'Visit_Booked',
    'Visit_Completed',
    'Negotiation',
    'Booking_Done',
    'Disqualified'
];

function migrate() {
    if (!fs.existsSync(DB_PATH)) {
        console.error('Database file not found at:', DB_PATH);
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    let updatedCount = 0;
    let invalidStateCount = 0;

    console.log(`Scanning ${data.leads.length} leads...`);

    data.leads = data.leads.map(lead => {
        let updated = false;

        // 1. Initialize Version if missing
        if (typeof lead.version !== 'number') {
            lead.version = 1;
            updated = true;
        }

        // 2. Check for Invalid Stage
        if (!ALLOWED_STAGES.includes(lead.currentStage)) {
            console.warn(`Lead ${lead.id} has invalid stage: ${lead.currentStage}`);
            // Map legacy stages if possible, or mark as 'New' or 'Disqualified'
            // For now, we just log it. In a real migration, we'd map it.
            // lead.currentStage = 'New'; // Example fix
            // updated = true;
            invalidStateCount++;
        }

        if (updated) {
            updatedCount++;
        }
        return lead;
    });

    if (updatedCount > 0) {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
        console.log(`Migration complete. Updated ${updatedCount} leads.`);
    } else {
        console.log('No updates needed.');
    }

    if (invalidStateCount > 0) {
        console.warn(`WARNING: Found ${invalidStateCount} leads with invalid stages. Please review manually.`);
    }
}

migrate();
