import { seedPerformanceMatrixData } from '../src/lib/seed-performance';

async function run() {
    try {
        console.log('Starting direct seed...');
        const count = await seedPerformanceMatrixData();
        console.log(`Seeding complete. Added ${count} events.`);
    } catch (err) {
        console.error('Seeding failed:', err);
    }
}

run();
