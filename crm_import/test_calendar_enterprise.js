// Test Calendar Enterprise Features
const BASE_URL = 'http://localhost:3000';
const HEADERS = {
    'Content-Type': 'application/json',
    'x-user-id': 'user-1'
};

async function testCalendarFeatures() {
    console.log('🧪 Testing Calendar Enterprise Features...\n');

    // Test 1: Smart Slot Suggestions
    console.log('1️⃣ Testing Smart Slot Suggestions API');
    try {
        const response = await fetch(`${BASE_URL}/api/bookings/suggest?lead_id=lead-1&duration=60`, {
            headers: HEADERS
        });
        const data = await response.json();
        console.log('✅ Slot Suggestions:', data.suggestions?.length || 0, 'agents with slots');
    } catch (error) {
        console.log('❌ Error:', error.message);
    }

    // Test 2: SLA Metrics
    console.log('\n2️⃣ Testing SLA Metrics API');
    try {
        const response = await fetch(`${BASE_URL}/api/calendar/sla?days=30`, {
            headers: HEADERS
        });
        const data = await response.json();
        console.log('✅ SLA Metrics:');
        console.log('   - 48h Scheduling:', data.sla_metrics?.scheduled_within_48h?.rate + '%');
        console.log('   - No-Show Rate:', data.operational_metrics?.no_show_rate + '%');
        console.log('   - Reminder Delivery:', data.operational_metrics?.reminder_delivery_rate + '%');
    } catch (error) {
        console.log('❌ Error:', error.message);
    }

    // Test 3: Conflicts
    console.log('\n3️⃣ Testing Conflicts API');
    try {
        const response = await fetch(`${BASE_URL}/api/calendar/conflicts`, {
            headers: HEADERS
        });
        const data = await response.json();
        console.log('✅ Conflicts:', data.total || 0, 'pending conflicts');
    } catch (error) {
        console.log('❌ Error:', error.message);
    }

    // Test 4: Create Booking with Validation
    console.log('\n4️⃣ Testing Enhanced Booking Creation');
    try {
        const response = await fetch(`${BASE_URL}/api/bookings`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify({
                leadId: 'lead-1',
                projectId: 'proj-1',
                slotStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                slotEnd: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
                assignedTo: 'user-1',
                mode: 'site_visit'
            })
        });
        const data = await response.json();
        if (response.ok) {
            console.log('✅ Booking Created:', data.id);
            console.log('   - Reminders Scheduled:', data.reminders_scheduled);
            console.log('   - Version:', data.version);
        } else {
            console.log('⚠️  Validation Failed:', data.error);
            if (data.suggestions) {
                console.log('   - Alternative Slots:', data.suggestions.length);
            }
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }

    // Test 5: Cron Job Status
    console.log('\n5️⃣ Testing Cron Job Status');
    try {
        const response = await fetch(`${BASE_URL}/api/cron/calendar-jobs`, {
            headers: HEADERS
        });
        const data = await response.json();
        console.log('✅ Cron Status:');
        console.log('   - Pending Reminders:', data.reminder_stats?.pending);
        console.log('   - Sent Today:', data.reminder_stats?.sent_today);
        console.log('   - Due Next Hour:', data.reminder_stats?.due_next_hour);
    } catch (error) {
        console.log('❌ Error:', error.message);
    }

    console.log('\n✨ All tests complete!\n');
}

testCalendarFeatures().catch(console.error);
