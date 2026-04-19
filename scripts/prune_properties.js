const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

// IDs of properties to keep
const KEEP_PROPERTY_IDS = [
    "901c075d-4731-4bfb-992d-fc64d6c900e6", // Lodha Woods
    "ea4d54d0-0667-4b5d-bb1c-ca81e85966a6", // Prestige Falcon City
    "e2b96330-3305-4b2f-9dd5-070bed43962f", // Godrej Woods
    "prop-001"                             // Skyline Residency
];

const IMAGES = {
    "901c075d-4731-4bfb-992d-fc64d6c900e6": "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1000", // Modern Apartment
    "ea4d54d0-0667-4b5d-bb1c-ca81e85966a6": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1000", // Luxury House
    "e2b96330-3305-4b2f-9dd5-070bed43962f": "https://images.unsplash.com/photo-1448630360428-65ff2ede00c2?auto=format&fit=crop&q=80&w=1000", // Forest View
    "prop-001": "https://images.unsplash.com/photo-1460317442991-0ec239397118?auto=format&fit=crop&q=80&w=1000" // Skyline
};

function pruneDb() {
    if (!fs.existsSync(DB_PATH)) {
        console.error(`Error: ${DB_PATH} not found.`);
        return;
    }

    const rawData = fs.readFileSync(DB_PATH, 'utf8');
    const data = JSON.parse(rawData);

    console.log(`Original sizes:`);
    console.log(`  propertyManagement: ${data.propertyManagement?.length || 0}`);
    console.log(`  towers: ${data.towers?.length || 0}`);
    console.log(`  units: ${data.units?.length || 0}`);
    console.log(`  leads: ${data.leads?.length || 0}`);

    // 1. Filter Property Management
    data.propertyManagement = (data.propertyManagement || []).filter(p => KEEP_PROPERTY_IDS.includes(p.id));
    
    // Update Simple Properties array to match
    data.properties = data.propertyManagement.map(p => ({
        id: p.id,
        name: p.name,
        location: p.location?.city || ''
    }));

    // 2. Identify and Filter Towers
    data.towers = (data.towers || []).filter(t => KEEP_PROPERTY_IDS.includes(t.propertyId));
    const keepTowerIds = new Set(data.towers.map(t => t.id));

    // 3. Identify and Filter Units
    data.units = (data.units || []).filter(u => KEEP_PROPERTY_IDS.includes(u.propertyId));
    const keepUnitIds = new Set(data.units.map(u => u.id));

    // 4. Filter Unit Reservations
    data.unitReservations = (data.unitReservations || []).filter(r => keepUnitIds.has(r.unitId));

    // 5. Filter Property Documents
    data.propertyDocuments = (data.propertyDocuments || []).filter(d => KEEP_PROPERTY_IDS.includes(d.propertyId));

    // 6. Filter Leads and associated data
    data.leads = (data.leads || []).filter(l => KEEP_PROPERTY_IDS.includes(l.propertyId));
    const keepLeadIds = new Set(data.leads.map(l => l.id));

    // Filter bookings
    data.bookings = (data.bookings || []).filter(b => KEEP_PROPERTY_IDS.includes(b.propertyId));

    // Filter activity logs related to leads
    data.activities = (data.activities || []).filter(a => keepLeadIds.has(a.leadId));
    data.timeline = (data.timeline || []).filter(t => keepLeadIds.has(t.leadId));
    data.callLogs = (data.callLogs || []).filter(c => keepLeadIds.has(c.leadId));

    console.log(`\nPruned sizes:`);
    console.log(`  propertyManagement: ${data.propertyManagement.length}`);
    console.log(`  towers: ${data.towers.length}`);
    console.log(`  units: ${data.units.length}`);
    console.log(`  leads: ${data.leads.length}`);

    // 7. Update Imagery
    for (const p of data.propertyManagement) {
        if (IMAGES[p.id]) {
            p.primaryImageUrl = IMAGES[p.id];
        }
    }

    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    console.log("\nDatabase pruned and updated successfully.");
}

pruneDb();
