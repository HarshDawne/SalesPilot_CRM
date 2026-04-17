import { localPropertyService } from './src/lib/services/localPropertyService';
import { ProjectStatus, ConstructionStatus, PropertyType } from './src/types/property';

async function verifySpaceModel() {
    console.log("--- Starting Space Model Verification ---");

    // 1. Create a dummy legacy property (with units directly in tower)
    const legacyProperty = {
        id: 'legacy_prop_1',
        name: 'Legacy Project',
        propertyType: 'Residential',
        towers: [
            {
                id: 'tower_legacy',
                name: 'Tower A',
                units: [
                    { id: 'u1', unitNumber: '101', status: 'AVAILABLE', areaSqft: 1000, bhk: '2 BHK' },
                    { id: 'u2', unitNumber: '102', status: 'SOLD', areaSqft: 1200, bhk: '3 BHK' }
                ]
            }
        ]
    };

    console.log("Saving legacy property...");
    await localPropertyService.create(legacyProperty as any);

    // 2. Fetch and verify migration (Simulate loading in Blueprint Editor)
    // Note: The migration happens in useBlueprint hook during loadBlueprint. 
    // Here we test if localPropertyService can handle the new structure which we'll manually save soon.

    const fetchedProp = await localPropertyService.getById('legacy_prop_1');
    console.log("Fetched Legacy Property:", JSON.stringify(fetchedProp, null, 2));

    // 3. Create a new structure property (Property -> Tower -> Floor -> Space)
    const spaceModelProperty = {
        id: 'space_model_prop_1',
        name: 'Space Oasis',
        propertyType: 'Mixed-Use',
        towers: [
            {
                id: 'tower_1',
                name: 'Tower Oasis',
                description: 'Premium Mixed-Use Tower',
                floors: [
                    {
                        id: 'floor_1',
                        label: 'Ground Floor',
                        floorNumber: 0,
                        spaces: [
                            { id: 's1', label: 'Shop-01', type: 'Retail Shop', status: 'AVAILABLE', areaSqft: 500, configuration: 'Front Face' },
                            { id: 's2', label: 'Shop-02', type: 'Retail Shop', status: 'BOOKED', areaSqft: 600, configuration: 'Inside' }
                        ]
                    },
                    {
                        id: 'floor_2',
                        label: 'Floor 1',
                        floorNumber: 1,
                        spaces: [
                            { id: 's3', label: 'Office-101', type: 'Office', status: 'AVAILABLE', areaSqft: 1500, configuration: 'Open Floor' },
                            { id: 's4', label: '102', type: 'Apartment', status: 'AVAILABLE', areaSqft: 1200, configuration: '2 BHK' }
                        ]
                    }
                ]
            }
        ]
    };

    console.log("Saving Space Model property...");
    await localPropertyService.create(spaceModelProperty as any);

    const fetchedSpaceProp = await localPropertyService.getById('space_model_prop_1');
    console.log("Fetched Space Model Property:", JSON.stringify(fetchedSpaceProp, null, 2));

    // 4. Verification Assertions (Manual check of log output)
    if (fetchedSpaceProp && fetchedSpaceProp.towers[0].floors.length === 2) {
        console.log("SUCCESS: Floors correctly persisted.");
    } else {
        console.error("FAILURE: Floors not persisted correctly.");
    }

    if (fetchedSpaceProp && fetchedSpaceProp.towers[0].floors[0].spaces.length === 2) {
        console.log("SUCCESS: Spaces correctly persisted inside floors.");
    } else {
        console.error("FAILURE: Spaces not persisted correctly.");
    }

    console.log("--- Verification Complete ---");
}

verifySpaceModel().catch(console.error);
