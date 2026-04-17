/**
 * Mock Data Generator for Phase 2: Enterprise Calendar
 * 
 * Creates sample projects and properties for testing the calendar system
 */

const { db } = require('./src/lib/db');
const { v4: uuidv4 } = require('uuid');

console.log('🏗️  Generating mock projects and properties...\n');

// Create 3 sample projects
const projects = [
    {
        id: uuidv4(),
        name: 'Luxury Towers Phase 2',
        developer: 'ABC Builders',
        location: 'Bandra West, Mumbai',
        address: 'Plot No. 123, Linking Road, Bandra West, Mumbai - 400050',
        totalUnits: 120,
        availableUnits: 45,
        priceRange: { min: 25000000, max: 85000000 }, // 2.5 Cr to 8.5 Cr
        status: 'under_construction',
        possessionDate: '2025-12-31',
        amenities: [
            'Swimming Pool',
            'Gym',
            'Club House',
            'Children Play Area',
            '24x7 Security',
            'Power Backup',
            'Covered Parking'
        ],
        coordinates: { lat: 19.0596, lng: 72.8295 },
        images: ['/images/luxury-towers-1.jpg', '/images/luxury-towers-2.jpg'],
        brochure: '/brochures/luxury-towers.pdf',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: uuidv4(),
        name: 'Green Valley Residences',
        developer: 'XYZ Developers',
        location: 'Powai, Mumbai',
        address: 'Survey No. 456, Powai Lake Road, Powai, Mumbai - 400076',
        totalUnits: 200,
        availableUnits: 78,
        priceRange: { min: 15000000, max: 45000000 }, // 1.5 Cr to 4.5 Cr
        status: 'ready_to_move',
        possessionDate: '2024-06-30',
        amenities: [
            'Landscaped Gardens',
            'Jogging Track',
            'Indoor Games Room',
            'Multipurpose Hall',
            'Intercom Facility',
            'Rainwater Harvesting'
        ],
        coordinates: { lat: 19.1197, lng: 72.9078 },
        images: ['/images/green-valley-1.jpg'],
        brochure: '/brochures/green-valley.pdf',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: uuidv4(),
        name: 'Sky Heights Premium',
        developer: 'Premium Homes Ltd',
        location: 'Andheri East, Mumbai',
        address: 'MIDC Road, Andheri East, Mumbai - 400093',
        totalUnits: 80,
        availableUnits: 12,
        priceRange: { min: 35000000, max: 120000000 }, // 3.5 Cr to 12 Cr
        status: 'under_construction',
        possessionDate: '2026-03-31',
        amenities: [
            'Infinity Pool',
            'Spa & Sauna',
            'Private Theater',
            'Concierge Service',
            'Helipad',
            'Smart Home Automation',
            'Wine Cellar'
        ],
        coordinates: { lat: 19.1136, lng: 72.8697 },
        images: ['/images/sky-heights-1.jpg', '/images/sky-heights-2.jpg', '/images/sky-heights-3.jpg'],
        brochure: '/brochures/sky-heights.pdf',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

// Create properties for each project
const properties = [];

// Luxury Towers - 10 sample units
const luxuryTowersId = projects[0].id;
const luxuryUnits = [
    { type: '2BHK', floor: 5, area: 1200, price: 28000000, facing: 'North' },
    { type: '2BHK', floor: 7, area: 1250, price: 30000000, facing: 'East' },
    { type: '3BHK', floor: 10, area: 1800, price: 45000000, facing: 'South' },
    { type: '3BHK', floor: 12, area: 1850, price: 48000000, facing: 'North-East' },
    { type: '3BHK', floor: 15, area: 1900, price: 52000000, facing: 'North' },
    { type: '4BHK', floor: 18, area: 2500, price: 68000000, facing: 'West' },
    { type: '4BHK', floor: 20, area: 2600, price: 72000000, facing: 'North-West' },
    { type: 'Penthouse', floor: 25, area: 4000, price: 85000000, facing: 'North' },
];

luxuryUnits.forEach((unit, index) => {
    properties.push({
        id: uuidv4(),
        projectId: luxuryTowersId,
        name: `${unit.type} - Tower A`,
        unitNumber: `A-${(unit.floor * 100) + (index + 1)}`,
        type: unit.type,
        area: unit.area,
        price: unit.price,
        status: index % 3 === 0 ? 'booked' : 'available',
        floor: unit.floor,
        facing: unit.facing,
        amenities: ['Modular Kitchen', 'Vitrified Flooring', 'Video Door Phone'],
        availableFrom: '2025-12-31',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
});

// Green Valley - 8 sample units
const greenValleyId = projects[1].id;
const greenUnits = [
    { type: '1BHK', floor: 3, area: 650, price: 15000000, facing: 'East' },
    { type: '2BHK', floor: 5, area: 1100, price: 22000000, facing: 'North' },
    { type: '2BHK', floor: 8, area: 1150, price: 24000000, facing: 'South' },
    { type: '3BHK', floor: 10, area: 1600, price: 35000000, facing: 'North-East' },
    { type: '3BHK', floor: 12, area: 1650, price: 38000000, facing: 'West' },
    { type: '4BHK', floor: 15, area: 2200, price: 45000000, facing: 'North' },
];

greenUnits.forEach((unit, index) => {
    properties.push({
        id: uuidv4(),
        projectId: greenValleyId,
        name: `${unit.type} - Tower B`,
        unitNumber: `B-${(unit.floor * 100) + (index + 1)}`,
        type: unit.type,
        area: unit.area,
        price: unit.price,
        status: index % 4 === 0 ? 'sold' : 'available',
        floor: unit.floor,
        facing: unit.facing,
        amenities: ['Wooden Flooring', 'French Windows', 'Utility Area'],
        availableFrom: '2024-06-30',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
});

// Sky Heights - 6 premium units
const skyHeightsId = projects[2].id;
const skyUnits = [
    { type: '3BHK', floor: 20, area: 2000, price: 42000000, facing: 'North' },
    { type: '4BHK', floor: 25, area: 3000, price: 65000000, facing: 'East' },
    { type: '4BHK', floor: 28, area: 3200, price: 72000000, facing: 'North-East' },
    { type: 'Penthouse', floor: 35, area: 5000, price: 95000000, facing: 'North' },
    { type: 'Penthouse', floor: 36, area: 5500, price: 110000000, facing: 'South' },
    { type: 'Duplex', floor: 30, area: 4500, price: 85000000, facing: 'West' },
];

skyUnits.forEach((unit, index) => {
    properties.push({
        id: uuidv4(),
        projectId: skyHeightsId,
        name: `${unit.type} - Tower C`,
        unitNumber: `C-${(unit.floor * 100) + (index + 1)}`,
        type: unit.type,
        area: unit.area,
        price: unit.price,
        status: 'available',
        floor: unit.floor,
        facing: unit.facing,
        amenities: ['Italian Marble', 'Home Automation', 'Private Terrace', 'Jacuzzi'],
        availableFrom: '2026-03-31',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
});

// Save to database
console.log(`Creating ${projects.length} projects...`);
projects.forEach(project => {
    db.projects.create(project);
    console.log(`✅ Created: ${project.name}`);
});

console.log(`\nCreating ${properties.length} properties...`);
properties.forEach(property => {
    db.properties.create(property);
});
console.log(`✅ Created ${properties.length} properties across all projects`);

console.log('\n📊 Summary:');
console.log(`- Projects: ${projects.length}`);
console.log(`- Properties: ${properties.length}`);
console.log(`- Available: ${properties.filter(p => p.status === 'available').length}`);
console.log(`- Booked: ${properties.filter(p => p.status === 'booked').length}`);
console.log(`- Sold: ${properties.filter(p => p.status === 'sold').length}`);

console.log('\n✅ Mock data generated successfully!');
console.log('\nYou can now use these projects and properties in the calendar system.');
