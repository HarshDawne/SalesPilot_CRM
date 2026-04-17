const fetch = require('node-fetch'); // Or native fetch in Node 18+

const API_URL = 'http://localhost:3000/api';

async function seed() {
    console.log('🌱 Starting seed...');

    const properties = [
        {
            name: 'Skyline Heights',
            status: 'UNDER_CONSTRUCTION',
            projectType: 'RESIDENTIAL',
            developerName: 'Prestige Group',
            tagline: 'Luxury Living Above the Clouds',
            description: 'Skyline Heights offers 3 & 4 BHK ultra-luxury apartments with panoramic sea views. Features a rooftop infinity pool, sky deck, and world-class amenities.',
            location: {
                city: 'Mumbai',
                locality: 'Worli',
                fullAddress: 'Skyline Heights, Dr. Annie Besant Road, Worli, Mumbai 400018',
                pincode: '400018',
            },
            totalTowers: 2,
            reraId: 'P51900012345',
            launchDate: '2023-01-15',
            expectedCompletion: '2026-12-31',
            highlights: ['Sea View', 'Rooftop Pool', 'Smart Home Automation'],
            amenities: ['Gym', 'Spa', 'Concierge'],
            towers: [
                {
                    name: 'Tower A - Sea View',
                    code: 'T-A',
                    floors: 45,
                    totalUnits: 90,
                    units: [
                        { label: '1001', floor: 10, category: 'residential', sizeSqft: 2500, bedrooms: 3, bathrooms: 3, price: 85000000, status: 'available' },
                        { label: '1002', floor: 10, category: 'residential', sizeSqft: 3200, bedrooms: 4, bathrooms: 4, price: 125000000, status: 'booked', bookedBy: { name: 'Rajesh Kumar', contact: '9876543210', bookingDate: '2024-02-15' } },
                    ]
                },
                {
                    name: 'Tower B - City View',
                    code: 'T-B',
                    floors: 40,
                    totalUnits: 80,
                    units: [
                        { label: '501', floor: 5, category: 'residential', sizeSqft: 1800, bedrooms: 2, bathrooms: 2, price: 55000000, status: 'available' },
                    ]
                }
            ]
        },
        {
            name: 'Tech Park One',
            status: 'PLANNING',
            projectType: 'COMMERCIAL',
            developerName: 'Mindspace',
            tagline: 'Future of Work',
            description: 'Grade A commercial office spaces designed for global tech giants. LEED Platinum certified sustainable building.',
            location: {
                city: 'Pune',
                locality: 'Hinjewadi',
                fullAddress: 'Tech Park One, Rajiv Gandhi Infotech Park, Hinjewadi Phase 1, Pune 411057',
                pincode: '411057',
            },
            totalTowers: 1,
            reraId: 'P52100098765',
            launchDate: '2024-06-01',
            expectedCompletion: '2027-03-31',
            highlights: ['LEED Platinum', 'Metro Connectivity', 'Food Court'],
            amenities: ['Conference Rooms', 'Auditorium', '24/7 Security'],
            towers: [
                {
                    name: 'Alpha Block',
                    code: 'BLK-A',
                    floors: 12,
                    totalUnits: 48,
                    units: [
                        { label: '101', floor: 1, category: 'commercial', sizeSqft: 5000, price: 75000000, status: 'available' },
                        { label: '102', floor: 1, category: 'commercial', sizeSqft: 2500, price: 37500000, status: 'reserved' },
                    ]
                }
            ]
        },
        {
            name: 'Green Valley Villas',
            status: 'COMPLETED',
            projectType: 'RESIDENTIAL',
            developerName: 'Sobha Developers',
            tagline: 'Nature at your Doorstep',
            description: 'Exclusive gated community of 50 luxury villas spread across 20 acres of lush greenery. Ready to move in.',
            location: {
                city: 'Bangalore',
                locality: 'Whitefield',
                fullAddress: 'Green Valley, Hope Farm Junction, Whitefield, Bangalore 560066',
                pincode: '560066',
            },
            totalTowers: 1,
            reraId: 'PRM/KA/RERA/1251/446',
            launchDate: '2020-03-10',
            expectedCompletion: '2023-11-30',
            highlights: ['Private Garden', 'Clubhouse', 'Swimming Pool'],
            amenities: ['Tennis Court', 'Squash Court', 'Party Hall'],
            towers: [
                {
                    name: 'Phase 1',
                    code: 'PH-1',
                    floors: 2,
                    totalUnits: 50,
                    units: [
                        { label: 'V-01', floor: 0, category: 'residential', sizeSqft: 4500, bedrooms: 5, bathrooms: 5, price: 45000000, status: 'sold', bookedBy: { name: 'Anita Sharma', contact: '9988776655', bookingDate: '2021-11-20' } },
                        { label: 'V-02', floor: 0, category: 'residential', sizeSqft: 4500, bedrooms: 5, bathrooms: 5, price: 45000000, status: 'available' },
                    ]
                }
            ]
        }
    ];

    for (const prop of properties) {
        try {
            console.log(`Creating ${prop.name}...`);

            const propConfig = {
                ...prop,
                totalUnits: prop.towers.reduce((sum, t) => sum + t.totalUnits, 0),
                availableUnits: prop.towers.reduce((sum, t) => sum + t.units.filter(u => u.status === 'available').length, 0)
            };
            delete propConfig.towers;
            // Ensure status logic is correct (e.g. bookedUnits could be calc'd too but API might handle or ignore)

            const propRes = await fetch(`${API_URL}/properties`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(propConfig)
            });

            if (!propRes.ok) {
                const errText = await propRes.text();
                throw new Error(`Status: ${propRes.status} Body: ${errText}`);
            }
            const propData = await propRes.json();
            const propId = propData.id || propData.data?.id;

            if (propId) {
                console.log(`  ✅ Created Property ID: ${propId}`);

                for (const tower of prop.towers) {
                    const towerConfig = { ...tower };
                    delete towerConfig.units;

                    const towerRes = await fetch(`${API_URL}/properties/${propId}/towers`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(towerConfig)
                    });

                    const towerData = await towerRes.json();
                    const towerId = towerData.id;

                    if (towerId) {
                        console.log(`    ✅ Created Tower: ${tower.name}`);

                        for (const unit of tower.units) {
                            await fetch(`${API_URL}/towers/${towerId}/units`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ ...unit, propertyId: propId })
                            });
                        }
                        console.log(`      ✅ Created ${tower.units.length} units`);
                    }
                }
            }
        } catch (err) {
            console.error(`❌ Failed to seed ${prop.name}:`, err.message);
        }
    }
}

seed();
