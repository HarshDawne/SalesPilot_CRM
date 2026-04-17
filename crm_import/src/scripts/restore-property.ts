/**
 * Restore Deleted Property
 * This script restores the Skyline Residency property that was deleted
 */

import { db } from '../lib/db';
import { seedProperties, seedTowers, seedUnits } from '../lib/seed-properties';

async function restoreSkylineResidency() {
    console.log('🔄 Restoring Skyline Residency property...');

    // Find Skyline Residency from seed data
    const skylineProperty = seedProperties.find(p => p.id === 'prop-001');
    const skylineTowers = seedTowers.filter(t => t.propertyId === 'prop-001');
    const skylineUnits = seedUnits.filter(u => u.propertyId === 'prop-001');

    if (!skylineProperty) {
        console.error('❌ Skyline Residency not found in seed data');
        return;
    }

    // Check if already exists
    const existing = db.propertyManagement.findById('prop-001');
    if (existing) {
        console.log('✅ Skyline Residency already exists');
        return;
    }

    // Restore property
    console.log(`📝 Restoring property: ${skylineProperty.name}`);
    db.propertyManagement.create(skylineProperty);

    // Restore towers
    console.log(`🏢 Restoring ${skylineTowers.length} towers...`);
    for (const tower of skylineTowers) {
        const existingTower = db.towers.findById(tower.id);
        if (!existingTower) {
            db.towers.create(tower);
            console.log(`  ✓ ${tower.name} restored`);
        }
    }

    // Restore units
    console.log(`🏠 Restoring ${skylineUnits.length} units...`);
    for (const unit of skylineUnits) {
        const existingUnit = db.units.findById(unit.id);
        if (!existingUnit) {
            db.units.create(unit);
        }
    }

    console.log('✅ Skyline Residency restored successfully!');
    console.log(`   - Property ID: ${skylineProperty.id}`);
    console.log(`   - Total Towers: ${skylineTowers.length}`);
    console.log(`   - Total Units: ${skylineUnits.length}`);
}

// Run the script
restoreSkylineResidency()
    .then(() => {
        console.log('\n✨ Restoration complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Restoration failed:', error);
        process.exit(1);
    });
