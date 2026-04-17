const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, '..', 'data', 'db.json');

console.log('🏗️  Adding 3 real-world sample properties and their towers...');

const LODHA_ID = uuidv4();
const PRESTIGE_ID = uuidv4();
const GODREJ_ID = uuidv4();

// Real-world sample data
const sampleProperties = [
    {
        id: LODHA_ID,
        name: "Lodha Woods",
        code: "LWD",
        status: "ACTIVE",
        constructionStatus: "READY_FOR_POSSESSION",
        projectType: "RESIDENTIAL",
        propertyType: "Residential",
        developerName: "Lodha Group",
        tagline: "Nature's Embrace in the Heart of the City",
        description: "Lodha Woods offers luxurious 2, 3 & 4 BHK residences nestled next to a 25,000 sq.ft. private forest with 80% open spaces. A perfect blend of modern amenities and natural surroundings.",
        location: {
            city: "Mumbai",
            locality: "Kandivali East",
            pincode: "400101",
            fullAddress: "Off Western Express Highway, Akurli Road, Kandivali East, Mumbai",
            landmark: "Near Growel's 101 Mall",
            latitude: 19.2081,
            longitude: 72.8598,
        },
        totalTowers: 5,
        totalUnits: 450,
        availableUnits: 30,
        bookedUnits: 420,
        defaultFloorsPerTower: 30,
        minBedrooms: 2,
        maxBedrooms: 4,
        minAreaSqft: 750,
        maxAreaSqft: 1450,
        reraId: "P51800031448",
        reraUrl: "https://maharera.mahaonline.gov.in/",
        startingPrice: 22500000,
        pricePerSqftFrom: 28000,
        pricePerSqftTo: 32000,
        bookingAmount: 1000000,
        expectedCompletion: "2024-03-31",
        primaryImageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop",
        highlights: [
            "25,000 sq.ft. private forest",
            "80% open spaces",
            "Premium Jain Temple within premises",
            "Grand Club House with Infinity Pool",
            "Next to Western Express Highway"
        ],
        amenities: [
            { id: uuidv4(), name: "Infinity Pool", icon: "Waves" },
            { id: uuidv4(), name: "Gymnasium", icon: "Dumbbell" },
            { id: uuidv4(), name: "Jain Temple", icon: "Heart" },
            { id: uuidv4(), name: "Forest Trail", icon: "Trees" },
            { id: uuidv4(), name: "Club House", icon: "Building" }
        ],
        isActive: true,
        priorityRank: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: PRESTIGE_ID,
        name: "Prestige Falcon City",
        code: "PFC",
        status: "COMPLETED",
        constructionStatus: "READY_FOR_POSSESSION",
        projectType: "MIXED_USE",
        propertyType: "Mixed-Use",
        developerName: "Prestige Group",
        tagline: "The World at Your Doorstep",
        description: "A mixed-use development comprising residential apartments, the massive Forum Mall, and an expansive club house, offering a truly global lifestyle in South Bangalore.",
        location: {
            city: "Bangalore",
            locality: "Kanakapura Road",
            pincode: "560062",
            fullAddress: "Kanakapura Road, Anjanadri Layout, Konanakunte, Bangalore",
            landmark: "Metro Cash & Carry",
            latitude: 12.8913,
            longitude: 77.5684,
        },
        totalTowers: 7,
        totalUnits: 2520,
        availableUnits: 15,
        bookedUnits: 2505,
        defaultFloorsPerTower: 31,
        minBedrooms: 2,
        maxBedrooms: 4,
        minAreaSqft: 1204,
        maxAreaSqft: 2726,
        reraId: "PRM/KA/RERA/1251/310/PR/170913/000114",
        reraUrl: "https://rera.karnataka.gov.in/",
        startingPrice: 15000000,
        pricePerSqftFrom: 11000,
        pricePerSqftTo: 13500,
        bookingAmount: 500000,
        expectedCompletion: "2021-12-31",
        primaryImageUrl: "https://images.unsplash.com/photo-1575037614876-c385cb8048b2?w=800&auto=format&fit=crop",
        highlights: [
            "Includes the massive Forum Falcon City Mall",
            "Close proximity to Yelachenahalli Metro Station",
            "60,000 sq.ft. Clubhouse",
            "Lush landscaped gardens",
            "Integrated mixed-use township"
        ],
        amenities: [
            { id: uuidv4(), name: "Shopping Mall", icon: "ShoppingBag" },
            { id: uuidv4(), name: "Metro Access", icon: "Train" },
            { id: uuidv4(), name: "Grand Club", icon: "Building" },
            { id: uuidv4(), name: "Sports Arena", icon: "Activity" }
        ],
        isActive: true,
        priorityRank: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: GODREJ_ID,
        name: "Godrej Woods",
        code: "GDW",
        status: "ACTIVE",
        constructionStatus: "UNDER_DEVELOPMENT",
        projectType: "RESIDENTIAL",
        propertyType: "Residential",
        developerName: "Godrej Properties",
        tagline: "Live the Forest Life",
        description: "Experience living amidst 600+ trees in the heart of Noida. Godrej Woods offers spacious luxury apartments with state-of-the-art facilities and a profound connection to nature.",
        location: {
            city: "Noida",
            locality: "Sector 43",
            pincode: "201303",
            fullAddress: "Sector 43, Noida, Uttar Pradesh",
            landmark: "Near Noida Golf Course",
            latitude: 28.5630,
            longitude: 77.3420,
        },
        totalTowers: 10,
        totalUnits: 1200,
        availableUnits: 85,
        bookedUnits: 1115,
        defaultFloorsPerTower: 27,
        minBedrooms: 3,
        maxBedrooms: 5,
        minAreaSqft: 1530,
        maxAreaSqft: 3750,
        reraId: "UPRERAPRJ704730",
        reraUrl: "https://www.up-rera.in/",
        startingPrice: 38000000,
        pricePerSqftFrom: 22000,
        pricePerSqftTo: 26000,
        bookingAmount: 2000000,
        expectedCompletion: "2025-06-30",
        primaryImageUrl: "https://images.unsplash.com/photo-1600607686527-6fb886090705?w=800&auto=format&fit=crop",
        highlights: [
            "Urban forest theme with 600+ big trees",
            "Elevated forest walkway",
            "Right next to Noida Golf Course",
            "Adjacent to Botanical Garden Metro",
            "Premium European fittings and fixtures"
        ],
        amenities: [
            { id: uuidv4(), name: "Forest Trail", icon: "Trees" },
            { id: uuidv4(), name: "Golf View", icon: "Target" },
            { id: uuidv4(), name: "Elevated Walkway", icon: "Route" },
            { id: uuidv4(), name: "Luxury Spa", icon: "Sparkles" }
        ],
        isActive: true,
        priorityRank: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

// Generate Towers dynamically for each property
const sampleTowers = [];
sampleProperties.forEach(prop => {
    for (let i = 0; i < prop.totalTowers; i++) {
        const towerName = `Tower ${String.fromCharCode(65 + i)}`; // Tower A, Tower B, etc.
        let status = 'PLANNING';
        if (prop.status === 'ACTIVE' || prop.status === 'COMPLETED') status = 'READY';
        if (prop.status === 'UNDER_CONSTRUCTION') status = 'STRUCTURE';

        sampleTowers.push({
            id: uuidv4(),
            propertyId: prop.id,
            name: towerName,
            totalFloors: prop.defaultFloorsPerTower || 10,
            totalUnits: Math.floor(prop.totalUnits / prop.totalTowers),
            availableUnits: Math.floor(prop.availableUnits / prop.totalTowers),
            status: status,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }
});

try {
    let rawData = '{}';
    if (fs.existsSync(dbPath)) {
        rawData = fs.readFileSync(dbPath, 'utf8');
    }
    const db = JSON.parse(rawData);

    // Initialise collections if they don't exist
    if (!db.propertyManagement) db.propertyManagement = [];
    if (!db.towers) db.towers = [];

    // Initialise collections if they don't exist
    if (!db.propertyManagement) db.propertyManagement = [];
    if (!db.towers) db.towers = [];

    const sampleNames = sampleProperties.map(p => p.name);

    // Remove existing demo properties and their towers to ensure fresh data
    const existingProperties = db.propertyManagement.filter(p => sampleNames.includes(p.name));
    const existingPropertyIds = existingProperties.map(p => p.id);

    db.propertyManagement = db.propertyManagement.filter(p => !sampleNames.includes(p.name));
    db.towers = db.towers.filter(t => !existingPropertyIds.includes(t.propertyId));

    // Add new properties and towers
    for (const prop of sampleProperties) {
        db.propertyManagement.push(prop);

        // Add related towers
        const relatedTowers = sampleTowers.filter(t => t.propertyId === prop.id);
        db.towers.push(...relatedTowers);

        console.log(`✅ Added: ${prop.name} with ${relatedTowers.length} Towers`);
    }

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    console.log(`\n🎉 Successfully added ${sampleProperties.length} properties and ${sampleTowers.length} towers to db.json!`);

} catch (error) {
    console.error('❌ Error modifying db.json:', error.message);
}
