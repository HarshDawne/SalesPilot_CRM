/**
 * Seed Database Script
 * Run this to populate Firebase with demo data
 */

import { firebasePropertyDb } from './firebase-property-db';
import { seedProperties, seedTowers, seedUnits } from './seed-properties';
import { knowledgeProperties, knowledgeTowers, knowledgeUnits } from './seed-knowledge';
import { seedPerformanceMatrixData } from './seed-performance';

export async function seedAllData() {
    console.log('🌱 Starting database seeding...');

    try {
        // 1. Core Property Data
        const allUnits = [...seedUnits, ...knowledgeUnits];
        const allProperties = [...seedProperties, ...knowledgeProperties];
        const allTowers = [...seedTowers, ...knowledgeTowers];

        await firebasePropertyDb.seedDatabase({
            properties: allProperties,
            towers: allTowers,
            units: allUnits,
            documents: [],
            renderRequests: [],
        });

        // 2. Showcase Performance Data
        const performanceCount = await seedPerformanceMatrixData();

        console.log('✅ Database seeded successfully!');
        console.log(`   - ${seedProperties.length} properties`);
        console.log(`   - ${seedTowers.length} towers`);
        console.log(`   - ${allUnits.length} units`);
        console.log(`   - ${performanceCount || 0} performance events`);

        return {
            success: true,
            counts: {
                properties: seedProperties.length,
                towers: seedTowers.length,
                units: allUnits.length,
                performanceEvents: performanceCount || 0,
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
