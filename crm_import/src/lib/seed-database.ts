/**
 * Seed Database Script
 * Run this to populate Firebase with demo data
 */

import { firebasePropertyDb } from './firebase-property-db';
import { seedProperties, seedTowers, seedUnits } from './seed-properties';
import { seedDocuments, seedRenderRequests, additionalSeedUnits } from './seed-enhancements';

export async function seedAllData() {
    console.log('🌱 Starting database seeding...');

    try {
        // Combine all units
        const allUnits = [...seedUnits, ...additionalSeedUnits];

        await firebasePropertyDb.seedDatabase({
            properties: seedProperties,
            towers: seedTowers,
            units: allUnits,
            documents: seedDocuments,
            renderRequests: seedRenderRequests,
        });

        console.log('✅ Database seeded successfully!');
        console.log(`   - ${seedProperties.length} properties`);
        console.log(`   - ${seedTowers.length} towers`);
        console.log(`   - ${allUnits.length} units`);
        console.log(`   - ${seedDocuments.length} documents`);
        console.log(`   - ${seedRenderRequests.length} render requests`);

        return {
            success: true,
            counts: {
                properties: seedProperties.length,
                towers: seedTowers.length,
                units: allUnits.length,
                documents: seedDocuments.length,
                renderRequests: seedRenderRequests.length,
            },
        };
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

// Export for API route
export { firebasePropertyDb };
