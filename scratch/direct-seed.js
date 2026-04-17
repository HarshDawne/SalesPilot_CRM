const { seedPerformanceMatrixData } = require('./src/lib/seed-performance');

async function run() {
    try {
        await seedPerformanceMatrixData();
        console.log('Seeding complete');
    } catch (err) {
        console.error('Seeding failed:', err);
    }
}

run();
