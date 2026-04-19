const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

const PROPERTIES = [
    { id: "prop-001", name: "Skyline Residency", city: "Mumbai" },
    { id: "901c075d-4731-4bfb-992d-fc64d6c900e6", name: "Lodha Woods", city: "Mumbai" },
    { id: "ea4d54d0-0667-4b5d-bb1c-ca81e85966a6", name: "Prestige Falcon City", city: "Bangalore" },
    { id: "e2b96330-3305-4b2f-9dd5-070bed43962f", name: "Godrej Woods", city: "Noida" }
];

const NAMES = [
    "Rajesh Kumar", "Amit Singh", "Priya Sharma", "Suresh Raina", "Anita Desai",
    "Vikram Seth", "Meera Nair", "Arjun Reddy", "Sanjana Gupta", "Rohan Mehta",
    "Karan Johar", "Deepika Padukone", "Ranbir Kapoor", "Alia Bhatt", "Shah Rukh Khan"
];

function repopulate() {
    const rawData = fs.readFileSync(DB_PATH, 'utf8');
    const db = JSON.parse(rawData);

    console.log('🌱 Repopulating demo leads and bookings...');

    db.leads = [];
    db.activities = [];
    db.bookings = [];
    db.timeline = [];
    db.callLogs = [];

    const now = new Date();
    const year = 2026;
    const month = 3; // April

    for (let i = 0; i < NAMES.length; i++) {
        const leadId = `lead-${100 + i}`;
        const prop = PROPERTIES[i % PROPERTIES.length];
        const [firstName, lastName] = NAMES[i].split(' ');

        // Create Lead
        const newLead = {
            id: leadId,
            firstName,
            lastName,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
            phone: `+91 98765${43210 + i}`,
            status: i % 4 === 0 ? 'Qualified' : (i % 3 === 0 ? 'Interested' : 'New'),
            currentStage: i % 3 === 0 ? 'Visit_Booked' : 'Discovery',
            source: 'Website',
            propertyId: prop.id,
            budget: 15000000 + (Math.random() * 50000000),
            createdAt: new Date(year, month, 1 + i).toISOString(),
            updatedAt: now.toISOString()
        };
        db.leads.push(newLead);

        // Create some activities and timeline for every lead
        db.timeline.push({
            id: uuidv4(),
            leadId: leadId,
            type: 'lead_created',
            timestamp: newLead.createdAt,
            actor: 'system',
            summary: 'Lead registered through website',
            payload: {},
            immutable: true
        });

        // Add a booking for some leads
        if (i % 2 === 0) {
            const day = 15 + (i % 10);
            const hour = 10 + (i % 7);
            const slotStart = new Date(year, month, day, hour, 0);
            const slotEnd = new Date(year, month, day, hour + 1, 0);
            
            const bookingId = `book-${200 + i}`;
            db.bookings.push({
                id: bookingId,
                leadId: leadId,
                propertyId: prop.id,
                slotStart: slotStart.toISOString(),
                slotEnd: slotEnd.toISOString(),
                duration: 60,
                mode: i % 3 === 0 ? 'site_visit' : 'virtual_meeting',
                status: 'confirmed',
                visitType: 'first_visit',
                meetingPoint: 'Sales Gallery',
                notes: 'Demo visit',
                createdAt: now.toISOString(),
                updatedAt: now.toISOString()
            });

            db.timeline.push({
                id: uuidv4(),
                leadId: leadId,
                type: 'visit_booked',
                timestamp: now.toISOString(),
                actor: 'sales_rep',
                summary: `Visit scheduled for ${slotStart.toLocaleDateString()}`,
                payload: { bookingId },
                immutable: true
            });
            
            newLead.currentStage = 'Visit_Booked';
        }
    }

    for (const prop of db.propertyManagement) {
        const propTowers = db.towers.filter(t => t.propertyId === prop.id);
        let propUnitCount = 0;
        
        for (const tower of propTowers) {
            const towerUnits = db.units.filter(u => u.towerId === tower.id);
            
            if (towerUnits.length === 0) {
                console.log(`  🏗️ Adding demo units to ${prop.name} - ${tower.name}`);
                for (let floor = 1; floor <= 2; floor++) {
                    for (let unitNum = 1; unitNum <= 2; unitNum++) {
                        const unitId = `unit-${prop.id.slice(0, 4)}-${tower.id.slice(0, 4)}-f${floor}u${unitNum}`;
                        const uNum = `${tower.name.split(' ')[1] || 'T'}-${floor}0${unitNum}`;
                        
                        db.units.push({
                            id: unitId,
                            towerId: tower.id,
                            propertyId: prop.id,
                            unitNumber: uNum,
                            floor: floor,
                            type: floor === 1 ? 'TWO_BHK' : 'THREE_BHK',
                            status: 'AVAILABLE',
                            carpetArea: 800 + (floor * 200),
                            builtUpArea: 1100 + (floor * 250),
                            facing: 'North',
                            basePrice: prop.startingPrice || 5000000 + (floor * 1000000),
                            floorRise: 50000 * floor,
                            plcCharges: 100000,
                            totalPrice: (prop.startingPrice || 5000000) + (floor * 1150000),
                            specifications: {
                                bedrooms: floor + 1,
                                bathrooms: floor + 1,
                                balconies: 1,
                                parkingSlots: 1
                            },
                            createdAt: now.toISOString(),
                            updatedAt: now.toISOString()
                        });
                        propUnitCount++;
                    }
                }
            } else {
                propUnitCount += towerUnits.length;
            }
        }
        
        // Update property stats
        prop.totalTowers = propTowers.length;
        prop.totalUnits = propUnitCount;
        prop.availableUnits = propUnitCount;
        prop.bookedUnits = 0;
    }

    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
    console.log(`✅ Success: Added ${db.leads.length} leads, ${db.bookings.length} bookings, and verified units for all towers.`);
}

repopulate();
