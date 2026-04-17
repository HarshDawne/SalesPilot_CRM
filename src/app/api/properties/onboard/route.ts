import { NextRequest, NextResponse } from 'next/server';
import { propertyService, towerService, unitService } from '@/lib/property-db';
import { BuildingStatus, UnitStatus } from '@/types/property';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { mode, config } = body;

        if (mode === 'rule-engine') {
            // Rule-based generation
            const { projectName, towers, floorsPerTower, unitsPerFloor, basePrice, priceIncrement } = config;

            // Create property first
            const property = await propertyService.create({
                name: projectName,
                totalTowers: towers.split(',').length,
                totalUnits: towers.split(',').length * parseInt(floorsPerTower) * parseInt(unitsPerFloor),
                defaultFloorsPerTower: parseInt(floorsPerTower),
                status: 'ACTIVE'
            } as any);

            // Generate towers and units
            const towerNames = towers.split(',').map((t: string) => t.trim());
            const units = [];

            for (const towerName of towerNames) {
                // Create tower
                const tower = await towerService.create({
                    propertyId: property.id,
                    name: `Tower ${towerName}`,
                    totalFloors: parseInt(floorsPerTower),
                    totalUnits: parseInt(floorsPerTower) * parseInt(unitsPerFloor),
                    availableUnits: parseInt(floorsPerTower) * parseInt(unitsPerFloor),
                    status: BuildingStatus.READY
                });

                // Generate units for this tower
                for (let floor = 1; floor <= parseInt(floorsPerTower); floor++) {
                    for (let unitNum = 1; unitNum <= parseInt(unitsPerFloor); unitNum++) {
                        const unitNumber = `${towerName}${floor.toString().padStart(2, '0')}${unitNum.toString().padStart(2, '0')}`;

                        // Calculate price with floor increment
                        const floorIncrement = priceIncrement ? (floor - 1) * parseInt(priceIncrement) : 0;
                        const price = parseInt(basePrice) + floorIncrement;

                        const unit = await unitService.create({
                            propertyId: property.id,
                            towerId: tower.id,
                            unitNumber,
                            floor,
                            bhk: unitNum <= 2 ? 2 : 3, // Simple logic: first 2 units are 2BHK, rest 3BHK
                            area: unitNum <= 2 ? 1200 : 1500,
                            price,
                            status: UnitStatus.AVAILABLE
                        } as any);

                        units.push(unit);
                    }
                }
            }

            return NextResponse.json({
                success: true,
                property,
                unitsGenerated: units.length,
                message: `Successfully generated ${units.length} units`
            }, { status: 201 });
        }

        if (mode === 'bulk-import') {
            // Bulk import from CSV/Excel data
            const { projectName, units: importedUnits } = config;

            // Create property
            const property = await propertyService.create({
                name: projectName,
                totalUnits: importedUnits.length,
                status: 'ACTIVE'
            } as any);

            // Create units
            const createdUnits = [];
            for (const unit of importedUnits) {
                const created = await unitService.create({
                    propertyId: property.id,
                    unitNumber: unit.unitNumber,
                    floor: unit.floor,
                    bhk: unit.bhk,
                    area: unit.area,
                    price: unit.price,
                    status: 'AVAILABLE'
                } as any);
                createdUnits.push(created);
            }

            return NextResponse.json({
                success: true,
                property,
                unitsImported: createdUnits.length
            }, { status: 201 });
        }

        if (mode === 'manual') {
            // Manual single property creation
            const property = await propertyService.create(config as any);

            return NextResponse.json({
                success: true,
                property
            }, { status: 201 });
        }

        return NextResponse.json({
            success: false,
            error: 'Invalid mode'
        }, { status: 400 });

    } catch (error: unknown) {
        console.error('Error in onboarding:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create property' },
            { status: 500 }
        );
    }
}
