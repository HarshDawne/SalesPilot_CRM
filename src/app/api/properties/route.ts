import { NextRequest, NextResponse } from 'next/server';
import { propertyService, towerService } from '@/lib/property-db';
import { BuildingStatus } from '@/types/property';
import { propertySchema } from '@/lib/validations/property';
import { z } from 'zod';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const city = searchParams.get('city');

        let properties;

        if (status) {
            properties = await propertyService.getByStatus(status);
        } else if (city) {
            properties = await propertyService.getByCity(city);
        } else {
            properties = await propertyService.getAll();
        }

        return NextResponse.json({
            success: true,
            data: properties,
            count: properties.length,
        });
    } catch (error: unknown) {
        console.error('Error fetching properties:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch properties' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate request body
        const validatedData = propertySchema.parse(body);

        const property = await propertyService.create(validatedData as any);

        // Create towers and units if present in the payload (Blueprint Mode)
        if (body.towers && Array.isArray(body.towers) && body.towers.length > 0) {
            const towerPromises = [];
            for (const t of body.towers) {
                // Determine initial status based on property status
                let initialStatus = BuildingStatus.PLANNING;
                if (property.status === 'ACTIVE' || property.status === 'COMPLETED') {
                    initialStatus = BuildingStatus.READY;
                } else if (property.status === 'UNDER_CONSTRUCTION') {
                    initialStatus = BuildingStatus.STRUCTURE;
                }

                // If UI generated an internal UUID that we want to keep, use it or let towerService generate one
                // Currently towerService generates one, we can also let UI pass it through.
                // Assuming t.id comes from Blueprint, we can pass it to towerService
                const towerPromise = towerService.create({
                    propertyId: property.id,
                    name: t.name || `Tower ${body.towers.indexOf(t) + 1}`,
                    totalFloors: t.totalFloors || property.defaultFloorsPerTower || 10,
                    totalUnits: t.units?.length || Math.floor(property.totalUnits / property.totalTowers),
                    availableUnits: t.units?.length || Math.floor(property.availableUnits / property.totalTowers),
                    status: initialStatus,
                }).then(async (createdTower) => {
                    // Create unit inventory for this tower
                    if (t.units && Array.isArray(t.units)) {
                        for (const u of t.units) {
                            import('@/lib/property-db').then(({ unitService }) => {
                                unitService.create({
                                    propertyId: property.id,
                                    towerId: createdTower.id,
                                    unitNumber: u.unitNumber,
                                    floor: u.floor || 1,
                                    type: u.type || 'Apartment',
                                    configuration: u.configuration || '2BHK',
                                    status: u.status || 'AVAILABLE',
                                    carpetArea: u.areaSqft || 1000,
                                    builtUpArea: u.areaSqft ? u.areaSqft * 1.2 : 1200,
                                    basePrice: 0,
                                    floorRise: 0,
                                    plcCharges: 0,
                                    totalPrice: 0,
                                });
                            });
                        }
                    }
                });
                towerPromises.push(towerPromise);
            }

            await Promise.all(towerPromises);
        } else if (property.totalTowers > 0) {
            // Auto-create towers based on totalTowers if no detailed payload exists
            const towerPromises = [];
            
            for (let i = 0; i < property.totalTowers; i++) {
                const towerName = `Tower ${String.fromCharCode(65 + i)}`; // Tower A, Tower B, etc.
                
                // Determine initial status based on property status
                let initialStatus = BuildingStatus.PLANNING;
                if (property.status === 'ACTIVE' || property.status === 'COMPLETED') {
                    initialStatus = BuildingStatus.READY;
                } else if (property.status === 'UNDER_CONSTRUCTION') {
                    initialStatus = BuildingStatus.STRUCTURE;
                }

                towerPromises.push(towerService.create({
                    propertyId: property.id,
                    name: towerName,
                    totalFloors: property.defaultFloorsPerTower || 10, // Restored from floors
                    totalUnits: Math.floor(property.totalUnits / property.totalTowers),
                    availableUnits: Math.floor(property.availableUnits / property.totalTowers),
                    status: initialStatus,
                }));
            }

            await Promise.all(towerPromises);
        }

        return NextResponse.json({
            success: true,
            data: property,
        }, { status: 201 });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            console.error('❌ Validation failed:', JSON.stringify(error.issues, null, 2));
            return NextResponse.json(
                { success: false, error: 'Validation failed', details: error.issues },
                { status: 400 }
            );
        }

        console.error('Error creating property:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown server error',
                stack: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}
