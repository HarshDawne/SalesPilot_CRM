/**
 * Migrate Local Properties to Firebase
 * This script copies all properties, towers, and units from db.json to Firebase
 */

import { firebasePropertyDb } from '../lib/firebase-property-db';
import { seedProperties, seedTowers, seedUnits } from '../lib/seed-properties';

async function migrateToFirebase() {
    console.log('🔄 Starting migration to Firebase...\n');

    try {
        // Migrate Properties
        console.log(`📦 Migrating ${seedProperties.length} properties...`);
        for (const property of seedProperties) {
            await firebasePropertyDb.createProperty(property);
            console.log(`  ✅ ${property.name} (${property.id})`);
        }

        // Migrate Towers
        console.log(`\n🏢 Migrating ${seedTowers.length} towers...`);
        for (const tower of seedTowers) {
            await firebasePropertyDb.createTower(tower);
            console.log(`  ✅ ${tower.name} - ${tower.propertyId}`);
        }

        // Migrate Units
        console.log(`\n🏠 Migrating ${seedUnits.length} units...`);
        for (const unit of seedUnits) {
            await firebasePropertyDb.createUnit(unit);
            console.log(`  ✅ ${unit.unitNumber} - ${unit.propertyId}`);
        }

        console.log('\n✨ Migration completed successfully!');
        console.log(`\n📊 Summary:`);
        console.log(`   - Properties: ${seedProperties.length}`);
        console.log(`   - Towers: ${seedTowers.length}`);
        console.log(`   - Units: ${seedUnits.length}`);

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        throw error;
    }
}

// Run migration
migrateToFirebase()
    .then(() => {
        console.log('\n🎉 All data migrated to Firebase!');
        console.log('Check Firebase Console: https://console.firebase.google.com/project/propertymanagement-d459a/database');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration error:', error);
        process.exit(1);
    });
