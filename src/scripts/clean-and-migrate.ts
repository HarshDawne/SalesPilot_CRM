/**
 * Clean and Re-Migrate Firebase
 * Delete all data and re-migrate cleanly in one script
 */

async function cleanAndMigrate() {
    const FIREBASE_URL = 'https://propertymanagement-d459a-default-rtdb.asia-southeast1.firebasedatabase.app';

    console.log('🧹 Step 1: Cleaning Firebase...\n');

    try {
        // Delete all data
        await fetch(`${FIREBASE_URL}/propertyManagement.json`, { method: 'DELETE' });
        await fetch(`${FIREBASE_URL}/towers.json`, { method: 'DELETE' });
        await fetch(`${FIREBASE_URL}/units.json`, { method: 'DELETE' });

        console.log('✅ Firebase cleaned!\n');

        // Now migrate
        console.log('🔄 Step 2: Migrating fresh data...\n');

        const { firebasePropertyDb } = await import('../lib/firebase-property-db.js');
        const { seedProperties, seedTowers, seedUnits } = await import('../lib/seed-properties.js');

        // Migrate Properties
        console.log(`📦 Migrating ${seedProperties.length} properties...`);
        for (const property of seedProperties) {
            await firebasePropertyDb.createProperty(property);
            console.log(`  ✅ ${property.name}`);
        }

        // Migrate Towers
        console.log(`\n🏢 Migrating ${seedTowers.length} towers...`);
        for (const tower of seedTowers) {
            await firebasePropertyDb.createTower(tower);
            console.log(`  ✅ ${tower.name}`);
        }

        // Migrate Units
        console.log(`\n🏠 Migrating ${seedUnits.length} units...`);
        for (const unit of seedUnits) {
            await firebasePropertyDb.createUnit(unit);
            console.log(`  ✅ ${unit.unitNumber}`);
        }

        console.log('\n✨ Migration completed successfully!');
        console.log(`\n📊 Summary:`);
        console.log(`   - Properties: ${seedProperties.length}`);
        console.log(`   - Towers: ${seedTowers.length}`);
        console.log(`   - Units: ${seedUnits.length}`);

    } catch (error) {
        console.error('\n❌ Failed:', error);
        throw error;
    }
}

cleanAndMigrate()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
    });
