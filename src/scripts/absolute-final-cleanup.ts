/**
 * ABSOLUTE FINAL CLEANUP
 * Direct Firebase deletion with verification before migration
 */

const FIREBASE_URL = 'https://propertymanagement-d459a-default-rtdb.asia-southeast1.firebasedatabase.app';

async function verifyEmpty() {
    const res = await fetch(`${FIREBASE_URL}/propertyManagement.json`);
    const data = await res.json();
    return data === null || Object.keys(data || {}).length === 0;
}

async function absoluteFinalCleanup() {
    console.log('🚨 ABSOLUTE FINAL CLEANUP\n');

    // Delete
    console.log('Step 1: Deleting all data...');
    await fetch(`${FIREBASE_URL}/.json`, { method: 'DELETE' }); // Delete entire database root
    console.log('  ✅ Deleted\n');

    // Wait
    console.log('Step 2: Waiting 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Verify empty
    console.log('Step 3: Verifying database is empty...');
    const isEmpty = await verifyEmpty();
    console.log(`  ${isEmpty ? '✅ EMPTY!' : '❌ STILL HAS DATA!'}\n`);

    if (!isEmpty) {
        console.log('⚠️  Database still has data! Trying again...\n');
        await fetch(`${FIREBASE_URL}/.json`, { method: 'DELETE' });
        await new Promise(resolve => setTimeout(resolve, 5000));
        const isEmptyNow = await verifyEmpty();
        if (!isEmptyNow) {
            throw new Error('Failed to empty database after 2 attempts!');
        }
    }

    // Now migrate
    console.log('Step 4: Migrating CLEAN data...\n');
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

    console.log('\n🎉 SUCCESS!');
    console.log(`\n📊 Final count:`);
    console.log(`   - Properties: ${seedProperties.length}`);
    console.log(`   - Towers: ${seedTowers.length}`);
    console.log(`   - Units: ${seedUnits.length}`);
}

absoluteFinalCleanup()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ ERROR:', error);
        process.exit(1);
    });
