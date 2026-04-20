import { seedPerformanceMatrixData } from '../src/lib/seed-performance';

async function main() {
    try {
        const count = await seedPerformanceMatrixData();
        console.log(`Successfully seeded ${count} performance events.`);
    } catch (error) {
        console.error('Error seeding performance data:', error);
        process.exit(1);
    }
}

main();
