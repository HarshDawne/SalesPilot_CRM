
import fetch from 'node-fetch';

async function verifyTowerCreation() {
    const propertyData = {
        name: "Tower Test Property " + Date.now(),
        developerName: "Test Dev",
        projectType: "RESIDENTIAL",
        status: "PLANNING",
        location: {
            city: "Mumbai",
            locality: "Test Locality",
            pincode: "400001",
            fullAddress: "Test Address"
        },
        totalTowers: 3,
        totalUnits: 30,
        reraId: "TEST-RERA-" + Date.now(),
        expectedCompletion: "2026-01-01",
        highlights: [],
        amenities: []
    };

    console.log("Creating property with 3 towers...");
    try {
        const response = await fetch('http://localhost:3000/api/properties', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(propertyData)
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`API Error: ${response.status} ${text}`);
        }

        const result = await response.json();
        const propertyId = result.data.id;
        console.log(`Property created: ${propertyId}`);

        // Now fetch towers for this property
        const towerResponse = await fetch(`http://localhost:3000/api/towers?propertyId=${propertyId}`); // Note: Assuming we have a way to filter or we check all
        // Actually the bug report says /api/towers returns ALL towers.
        // We can also check /api/properties/${id} if it returns towers (likely not populated in GET /api/properties/id yet based on code).
        
        // Let's rely on finding them in the all towers list for now or checking the DB directly via script if API fails.
        // But wait, my previous analysis showed `getTowersByProperty` filters all towers.
        // So let's fetch all towers and filter client side here.
        
        const towersRes = await fetch('http://localhost:3000/api/towers');
        const allTowers = await towersRes.json();
        
        const myTowers = allTowers.filter((t: any) => t.propertyId === propertyId);
        
        console.log(`Found ${myTowers.length} towers for property ${propertyId}`);
        if (myTowers.length === 3) {
            console.log("SUCCESS: 3 towers created automatically.");
            myTowers.forEach((t: any) => console.log(`- ${t.name} (${t.status})`));
        } else {
            console.error(`FAILURE: Expected 3 towers, found ${myTowers.length}`);
        }

    } catch (error) {
        console.error("Verification failed:", error);
        console.log("Make sure the dev server is running: npm run dev");
    }
}

verifyTowerCreation();
