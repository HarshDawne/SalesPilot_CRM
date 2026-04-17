import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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

    const leads = db.leads.slice(0, 10); // Use first 10 leads
    const properties = db.propertyManagement || db.properties || [];
    const propId = properties.length > 0 ? properties[0].id : 'prop-demo-1';

    const now = new Date();
    // Use April 2026 as the target month (as per system time)
    const year = 2026;
    const month = 3; // April (0-indexed)

    const visitModes = ['site_visit', 'virtual_meeting', 'phone_call'];
    const visitTypes = ['first_visit', 'follow_up', 'final_negotiation'];

    console.log(`📅 Adding visits for April ${year}...`);

    for (let i = 0; i < 15; i++) {
        const lead = leads[i % leads.length];
        const day = (now.getDate() + Math.floor(i / 2)) % 28 + 1; // Spread visits across days
        const hour = 10 + (i % 8); // Spread visits between 10 AM and 6 PM
        
        const slotStart = new Date(year, month, day, hour, 0, 0);
        const slotEnd = new Date(year, month, day, hour + 1, 0, 0);

        const bookingId = uuidv4();
        const newBooking = {
            id: bookingId,
            leadId: lead.id,
            propertyId: propId,
            slotStart: slotStart.toISOString(),
            slotEnd: slotEnd.toISOString(),
            duration: 60,
            mode: visitModes[i % visitModes.length],
            status: i % 5 === 0 ? 'completed' : 'confirmed',
            visitType: visitTypes[i % visitTypes.length],
            meetingPoint: 'Main Entrance Lobby',
            notes: 'Demo visit for professor presentation',
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
            summary: `Visit scheduled for ${slotStart.toLocaleString()}`,
            payload: { bookingId: bookingId },
            immutable: true
        });

        // Update lead stage
        const leadIndex = db.leads.findIndex(l => l.id === lead.id);
        if (leadIndex !== -1) {
            db.leads[leadIndex].currentStage = 'Visit_Booked';
            db.leads[leadIndex].updatedAt = now.toISOString();
        }

        console.log(`  ✓ Added ${newBooking.mode} for ${lead.firstName || lead.name} on April ${day}`);
    }

    // Write back to database
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
        console.log('\n✅ Demo visits seeded successfully!');
        console.log(`📊 Added 15 new bookings to the calendar.`);
    } catch (error) {
        console.error('❌ Error writing database:', error.message);
    }
}

seedDemoVisits();
