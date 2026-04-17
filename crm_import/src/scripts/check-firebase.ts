/**
 * Check Firebase Data
 * Verifies what's currently in Firebase and checks for duplicates
 */

import { firebasePropertyDb } from '../lib/firebase-property-db';

async function checkFirebaseData() {
    console.log('🔍 Checking Firebase data...\n');

    try {
        // Check properties
        console.log('📦 Properties:');
        const properties = await firebasePropertyDb.getAllProperties();
        console.log(`  Total: ${properties.length}`);

        // Group by ID to find duplicates
        const propertyIds = new Map();
        properties.forEach(prop => {
            const count = propertyIds.get(prop.id) || 0;
            propertyIds.set(prop.id, count + 1);
        });

        console.log('  Property IDs:');
        propertyIds.forEach((count, id) => {
            console.log(`    - ${id}: ${count} ${count > 1 ? '⚠️ DUPLICATE!' : '✅'}`);
        });

        // Check towers
        console.log('\n🏢 Towers:');
        const towers = await firebasePropertyDb.getAllTowers();
        console.log(`  Total: ${towers.length}`);

        // Check units
        console.log('\n🏠 Units:');
        const units = await firebasePropertyDb.getAllUnits();
        console.log(`  Total: ${units.length}`);

        console.log('\n✅ Check complete!');

    } catch (error) {
        console.error('\n❌ Check failed:', error);
        throw error;
    }
}

// Run check
checkFirebaseData()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
    });
