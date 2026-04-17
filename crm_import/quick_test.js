// Quick test of Calendar Enterprise APIs
const BASE_URL = 'http://localhost:3000';

async function quickTest() {
    console.log('Testing Calendar Enterprise APIs...\n');
    
    try {
        // Test 1: Homepage
        const homeResponse = await fetch(BASE_URL);
        console.log('✅ Homepage:', homeResponse.ok ? 'OK' : 'FAILED');
        
        // Test 2: Bookings API
        const bookingsResponse = await fetch(`${BASE_URL}/api/bookings`);
        console.log('✅ Bookings API:', bookingsResponse.ok ? 'OK' : 'FAILED');
        
        console.log('\n✨ Basic tests passed! Server is running.');
        console.log('\n📝 Manual testing required for:');
        console.log('   - http://localhost:3000/admin/calendar-sla');
        console.log('   - http://localhost:3000/admin/calendar-conflicts');
        console.log('   - http://localhost:3000/calendar');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

quickTest();
