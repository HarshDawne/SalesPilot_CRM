/**
 * Quick test script to add sample bookings to the calendar
 * Run with: node add_sample_bookings.js
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, 'data', 'db.json');

// Read current database
const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

console.log('📅 Adding sample bookings to calendar...\n');

// Get first 3 leads and first 3 projects (if they exist)
const leads = data.leads.slice(0, 3);
const projects = (data.projects || []).slice(0, 3);

if (leads.length === 0) {
    console.log('❌ No leads found. Please create some leads first.');
    process.exit(1);
}

if (projects.length === 0) {
    console.log('⚠️  No projects found. Creating bookings without projects...');
}

// Create bookings for the next 7 days
const bookings = [];
const today = new Date();

for (let day = 0; day < 7; day++) {
    const date = new Date(today);
    date.setDate(date.getDate() + day);

    // Create 2-3 bookings per day
    const bookingsPerDay = Math.floor(Math.random() * 2) + 2;

    for (let i = 0; i < bookingsPerDay; i++) {
        const leadIndex = Math.floor(Math.random() * leads.length);
        const lead = leads[leadIndex];

        const hour = 9 + (i * 3); // 9 AM, 12 PM, 3 PM, etc.
        const startTime = new Date(date);
        startTime.setHours(hour, 0, 0, 0);

        const endTime = new Date(startTime);
        endTime.setHours(hour + 1, 0, 0, 0);

        const booking = {
            id: uuidv4(),
            leadId: lead.id,
            projectId: projects.length > 0 ? projects[i % projects.length].id : undefined,
            slotStart: startTime.toISOString(),
            slotEnd: endTime.toISOString(),
            duration: 60,
            mode: ['site_visit', 'virtual_meeting'][Math.floor(Math.random() * 2)],
            status: ['confirmed', 'pending'][Math.floor(Math.random() * 2)],
            visitType: ['first_visit', 'follow_up', 'final_negotiation'][Math.floor(Math.random() * 3)],
            meetingPoint: projects.length > 0 ? `${projects[i % projects.length].name} - Main Gate` : 'Office',
            notes: `Meeting with ${lead.firstName} ${lead.lastName}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            reminderSent: false
        };

        bookings.push(booking);
    }
}

// Add bookings to database
if (!data.bookings) data.bookings = [];
data.bookings.push(...bookings);

// Write back to database
fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

console.log(`✅ Added ${bookings.length} sample bookings`);
console.log(`\n📊 Breakdown:`);
console.log(`- Site visits: ${bookings.filter(b => b.mode === 'site_visit').length}`);
console.log(`- Virtual meetings: ${bookings.filter(b => b.mode === 'virtual_meeting').length}`);
console.log(`- Confirmed: ${bookings.filter(b => b.status === 'confirmed').length}`);
console.log(`- Pending: ${bookings.filter(b => b.status === 'pending').length}`);

console.log('\n✅ Sample bookings added successfully!');
console.log('\nView them at: http://localhost:3000/calendar');
