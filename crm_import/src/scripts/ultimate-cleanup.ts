/**
 * Ultimate Firebase Cleanup
 * Uses fetch with proper async/await to ensure clean deletion
 */

const FIREBASE_URL = 'https://propertymanagement-d459a-default-rtdb.asia-southeast1.firebasedatabase.app';

async function cleanupFirebase() {
    console.log('🧹 FINAL CLEANUP - Deleting ALL Firebase data...\n');

    try {
        // Delete in sequence with delays to ensure completion
        console.log('Deleting propertyManagement...');
        const res1 = await fetch(`${FIREBASE_URL}/propertyManagement.json`, { method: 'DELETE' });
        console.log(`  Response: ${res1.status} ${res1.statusText}`);

        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('Deleting towers...');
        const res2 = await fetch(`${FIREBASE_URL}/towers.json`, { method: 'DELETE' });
        console.log(`  Response: ${res2.status} ${res2.statusText}`);

        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('Deleting units...');
        const res3 = await fetch(`${FIREBASE_URL}/units.json`, { method: 'DELETE' });
        console.log(`  Response: ${res3.status} ${res3.statusText}`);

        console.log('\n✅ All data deleted from Firebase!');
        console.log('Waiting 2 seconds before migrating...\n');

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Now migrate clean data
        console.log('📦 Migrating clean data...\n');
        const { firebasePropertyDb } = await import('../lib/firebase-property-db.js');
        const { seedProperties, seedTowers, seedUnits } = await import('../lib/seed-properties.js');

        for (const property of seedProperties) {
            await firebasePropertyDb.createProperty(property);
            console.log(`  ✅ ${property.name}`);
        }

        for (const tower of seedTowers) {
            await firebasePropertyDb.createTower(tower);
        }

        for (const unit of seedUnits) {
            await firebasePropertyDb.createUnit(unit);
        }

        console.log('\n🎉 Clean migration complete!');
        console.log(`\n📊 Migrated:`);
        console.log(`   - Properties: ${seedProperties.length}`);
        console.log(`   - Towers: ${seedTowers.length}`);
        console.log(`   - Units: ${seedUnits.length}`);

    } catch (error) {
        console.error('\n❌ Failed:', error);
        throw error;
    }
}

cleanupFirebase()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
    });

export {};
