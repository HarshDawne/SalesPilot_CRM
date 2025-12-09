/**
 * Real-Time Updates Test Script
 * 
 * This script tests the real-time synchronization functionality
 * by simulating multiple clients and verifying events are broadcast correctly.
 */

const EventSource = require('eventsource');

const BASE_URL = 'http://localhost:3000';
let testsPassed = 0;
let testsFailed = 0;

// Helper function to create a lead
async function createLead(leadData) {
    const response = await fetch(`${BASE_URL}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
    });
    return response.json();
}

// Helper function to update lead status
async function updateLeadStatus(leadId, status) {
    const response = await fetch(`${BASE_URL}/api/leads/${leadId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
    });
    return response.json();
}

// Test 1: SSE Connection
async function testSSEConnection() {
    console.log('\n📡 Test 1: SSE Connection Establishment');

    return new Promise((resolve) => {
        const eventSource = new EventSource(`${BASE_URL}/api/realtime/leads`);
        let connected = false;

        eventSource.onopen = () => {
            console.log('✅ SSE connection established');
            connected = true;
            eventSource.close();
            testsPassed++;
            resolve(true);
        };

        eventSource.onerror = (error) => {
            console.log('❌ SSE connection failed:', error.message);
            eventSource.close();
            testsFailed++;
            resolve(false);
        };

        // Timeout after 5 seconds
        setTimeout(() => {
            if (!connected) {
                console.log('❌ SSE connection timeout');
                eventSource.close();
                testsFailed++;
                resolve(false);
            }
        }, 5000);
    });
}

// Test 2: Real-Time Lead Creation
async function testRealtimeLeadCreation() {
    console.log('\n⚡ Test 2: Real-Time Lead Creation');

    return new Promise(async (resolve) => {
        const eventSource = new EventSource(`${BASE_URL}/api/realtime/leads`);
        let receivedEvent = false;

        eventSource.addEventListener('lead:created', (event) => {
            const data = JSON.parse(event.data);
            console.log('✅ Received lead:created event:', data.firstName, data.lastName);
            receivedEvent = true;
            eventSource.close();
            testsPassed++;
            resolve(true);
        });

        // Wait for connection
        eventSource.onopen = async () => {
            console.log('   Connected to SSE, creating lead...');

            // Create a test lead
            const result = await createLead({
                name: 'Real-Time Test User',
                phone: '+919876543210',
                email: 'realtime@test.com',
                source: 'WEBSITE'
            });

            console.log('   Lead created:', result.lead_id);
        };

        eventSource.onerror = () => {
            if (!receivedEvent) {
                console.log('❌ Failed to receive lead:created event');
                eventSource.close();
                testsFailed++;
                resolve(false);
            }
        };

        // Timeout after 10 seconds
        setTimeout(() => {
            if (!receivedEvent) {
                console.log('❌ Timeout waiting for lead:created event');
                eventSource.close();
                testsFailed++;
                resolve(false);
            }
        }, 10000);
    });
}

// Test 3: Real-Time Status Update
async function testRealtimeStatusUpdate() {
    console.log('\n🔄 Test 3: Real-Time Status Update');

    return new Promise(async (resolve) => {
        // First create a lead
        const createResult = await createLead({
            name: 'Status Test User',
            phone: '+919876543211',
            email: 'status@test.com',
            source: 'WEBSITE'
        });

        const leadId = createResult.lead_id;
        console.log('   Created lead:', leadId);

        const eventSource = new EventSource(`${BASE_URL}/api/realtime/leads`);
        let receivedEvent = false;

        eventSource.addEventListener('lead:status_changed', (event) => {
            const data = JSON.parse(event.data);
            if (data.leadId === leadId) {
                console.log('✅ Received lead:status_changed event:', data.oldStatus, '→', data.newStatus);
                receivedEvent = true;
                eventSource.close();
                testsPassed++;
                resolve(true);
            }
        });

        eventSource.onopen = async () => {
            console.log('   Connected to SSE, updating status...');

            // Update status
            await updateLeadStatus(leadId, 'Contacted');
            console.log('   Status updated to Contacted');
        };

        eventSource.onerror = () => {
            if (!receivedEvent) {
                console.log('❌ Failed to receive lead:status_changed event');
                eventSource.close();
                testsFailed++;
                resolve(false);
            }
        };

        setTimeout(() => {
            if (!receivedEvent) {
                console.log('❌ Timeout waiting for lead:status_changed event');
                eventSource.close();
                testsFailed++;
                resolve(false);
            }
        }, 10000);
    });
}

// Test 4: Metrics Update Event
async function testMetricsUpdate() {
    console.log('\n📊 Test 4: Metrics Update Event');

    return new Promise(async (resolve) => {
        const eventSource = new EventSource(`${BASE_URL}/api/realtime/leads`);
        let receivedEvent = false;

        eventSource.addEventListener('metrics:updated', (event) => {
            console.log('✅ Received metrics:updated event');
            receivedEvent = true;
            eventSource.close();
            testsPassed++;
            resolve(true);
        });

        eventSource.onopen = async () => {
            console.log('   Connected to SSE, creating lead to trigger metrics update...');

            await createLead({
                name: 'Metrics Test User',
                phone: '+919876543212',
                email: 'metrics@test.com',
                source: 'WEBSITE'
            });
        };

        eventSource.onerror = () => {
            if (!receivedEvent) {
                console.log('❌ Failed to receive metrics:updated event');
                eventSource.close();
                testsFailed++;
                resolve(false);
            }
        };

        setTimeout(() => {
            if (!receivedEvent) {
                console.log('❌ Timeout waiting for metrics:updated event');
                eventSource.close();
                testsFailed++;
                resolve(false);
            }
        }, 10000);
    });
}

// Test 5: Heartbeat
async function testHeartbeat() {
    console.log('\n💓 Test 5: Heartbeat Messages');

    return new Promise((resolve) => {
        const eventSource = new EventSource(`${BASE_URL}/api/realtime/leads`);
        let heartbeatReceived = false;

        eventSource.onmessage = (event) => {
            if (event.data === 'heartbeat') {
                console.log('✅ Received heartbeat message');
                heartbeatReceived = true;
                eventSource.close();
                testsPassed++;
                resolve(true);
            }
        };

        eventSource.onerror = () => {
            if (!heartbeatReceived) {
                console.log('❌ Failed to receive heartbeat');
                eventSource.close();
                testsFailed++;
                resolve(false);
            }
        };

        // Heartbeat should arrive within 35 seconds (30s interval + 5s buffer)
        setTimeout(() => {
            if (!heartbeatReceived) {
                console.log('❌ Timeout waiting for heartbeat');
                eventSource.close();
                testsFailed++;
                resolve(false);
            }
        }, 35000);
    });
}

// Run all tests
async function runTests() {
    console.log('🚀 Starting Real-Time Updates Test Suite\n');
    console.log('='.repeat(50));

    try {
        await testSSEConnection();
        await testRealtimeLeadCreation();
        await testRealtimeStatusUpdate();
        await testMetricsUpdate();
        await testHeartbeat();

        console.log('\n' + '='.repeat(50));
        console.log('\n📊 Test Results:');
        console.log(`✅ Passed: ${testsPassed}`);
        console.log(`❌ Failed: ${testsFailed}`);
        console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

        if (testsFailed === 0) {
            console.log('\n🎉 All tests passed! Real-time updates are working perfectly!');
        } else {
            console.log('\n⚠️  Some tests failed. Please check the errors above.');
        }

    } catch (error) {
        console.error('\n❌ Test suite error:', error);
    }
}

// Run tests
runTests();
