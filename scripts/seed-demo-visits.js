const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

function seedDemoVisits() {
    console.log('🌱 Seeding demo visits for the calendar...');

    // Read existing database
    let db;
    try {
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        db = JSON.parse(data);
    } catch (error) {
        console.error('❌ Error reading database:', error.message);
        return;
    }

    if (!db.bookings) db.bookings = [];
    if (!db.timeline) db.timeline = [];

    // Use a mix of leads
    const leads = db.leads.filter(l => l.currentStage !== 'Disqualified').slice(0, 15);
    if (leads.length === 0) {
        console.error('❌ No active leads found to assign visits to.');
        return;
    }

    const properties = db.propertyManagement || db.properties || [];
    const propId = properties.length > 0 ? properties[0].id : 'prop-001';

    const now = new Date();
    // System date is 2026-04-17
    const year = 2026;
    const month = 3; // April (0-indexed)

    const visitModes = ['site_visit', 'virtual_meeting', 'phone_call'];
    const visitTypes = ['first_visit', 'follow_up', 'final_negotiation'];

    console.log(`📅 Adding visits for April ${year}...`);

    let addedCount = 0;
    // Add visits for the current week and next week
    for (let i = 0; i < 20; i++) {
        const lead = leads[i % leads.length];
        
        // Spread visits across days 15 to 25 of April
        const day = 15 + Math.floor(i / 2); 
        const hour = 10 + (i % 7); // Spread visits between 10 AM and 5 PM
        
        const slotStart = new Date(year, month, day, hour, 0, 0);
        const slotEnd = new Date(year, month, day, hour, 45, 0); // 45 min visits

        const bookingId = uuidv4();
        const newBooking = {
            id: bookingId,
            leadId: lead.id,
            propertyId: propId,
            slotStart: slotStart.toISOString(),
            slotEnd: slotEnd.toISOString(),
            duration: 45,
            mode: visitModes[i % visitModes.length],
            status: slotStart < now ? 'completed' : 'confirmed',
            visitType: visitTypes[i % visitTypes.length],
            meetingPoint: 'Experience Center, Tower A',
            notes: 'High intent lead interested in 3BHK options. Demo data for professor.',
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            reminderSent: true
        };

        db.bookings.push(newBooking);

        // Add timeline event
        db.timeline.push({
            id: uuidv4(),
            leadId: lead.id,
            type: 'visit_booked',
            timestamp: now.toISOString(),
            actor: 'ai',
            summary: `${newBooking.mode.replace('_', ' ')} scheduled for ${slotStart.toLocaleString('en-IN')}`,
            payload: { bookingId: bookingId },
            immutable: true
        });

        // Update lead stage
        const leadIndex = db.leads.findIndex(l => l.id === lead.id);
        if (leadIndex !== -1) {
            db.leads[leadIndex].currentStage = slotStart < now ? 'Visit_Completed' : 'Visit_Booked';
            db.leads[leadIndex].updatedAt = now.toISOString();
        }

        addedCount++;
        console.log(`  ✓ Added ${newBooking.mode} for ${lead.firstName || lead.name} on April ${day} @ ${hour}:00`);
    }

    // Write back to database
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
        console.log('\n✅ Demo visits seeded successfully!');
        console.log(`📊 Added ${addedCount} new bookings to the calendar.`);
    } catch (error) {
        console.error('❌ Error writing database:', error.message);
    }
}

seedDemoVisits();
