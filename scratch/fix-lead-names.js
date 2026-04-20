const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

function fixLeads() {
    console.log('Reading database...');
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    let updatedCount = 0;

    data.leads = data.leads.map(lead => {
        if (!lead.name || lead.name === 'Unknown' || lead.name === 'Anonymous Node') {
            const firstName = lead.firstName || '';
            const lastName = lead.lastName || '';
            const generatedName = `${firstName} ${lastName}`.trim();
            
            if (generatedName) {
                lead.name = generatedName;
                updatedCount++;
            } else if (!lead.name) {
                lead.name = 'Unknown Lead';
                updatedCount++;
            }
        }
        return lead;
    });

    if (updatedCount > 0) {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
        console.log(`Successfully updated ${updatedCount} leads with names.`);
    } else {
        console.log('No leads needed updating.');
    }
}

fixLeads();
