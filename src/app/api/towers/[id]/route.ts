import { NextRequest, NextResponse } from 'next/server';
import { towerService, unitService } from '@/lib/property-db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const tower = await towerService.getById(id);
        
        if (!tower) {
            return NextResponse.json(
                { success: false, error: 'Tower not found' },
                { status: 404 }
            );
        }
        
        return NextResponse.json({ success: true, data: tower });
    } catch (error) {
        console.error('Error fetching tower:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch tower' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        
        const tower = await towerService.update(id, body);
        if (!tower) {
            return NextResponse.json(
                { success: false, error: 'Tower not found' },
                { status: 404 }
            );
        }

        // If units are provided in the update, sync them
        if (body.units && Array.isArray(body.units)) {
            const existingUnits = await unitService.getByTower(id);
            const existingUnitIds = new Set<string>(existingUnits.map(u => u.id));
            
            for (const u of body.units) {
                const matchingUnit = existingUnits.find(ex => ex.unitNumber === u.unitNumber || ex.id === u.id);
                
                if (matchingUnit) {
                    await unitService.update(matchingUnit.id, {
                        floor: u.floor || matchingUnit.floor,
                        type: u.type || matchingUnit.type,
                        configuration: u.configuration || matchingUnit.configuration,
                        status: u.status || matchingUnit.status,
                        carpetArea: u.carpetArea || u.areaSqft || matchingUnit.carpetArea,
                        builtUpArea: u.builtUpArea || matchingUnit.builtUpArea,
                        superBuiltUpArea: u.superBuiltUpArea || matchingUnit.superBuiltUpArea,
                        basePrice: u.basePrice || matchingUnit.basePrice,
                        floorRise: u.floorRise || matchingUnit.floorRise,
                        plcCharges: u.plcCharges || matchingUnit.plcCharges,
                        totalPrice: u.totalPrice || matchingUnit.totalPrice,
                    });
                    existingUnitIds.delete(matchingUnit.id);
                } else {
                    await unitService.create({
                        propertyId: tower.propertyId,
                        towerId: tower.id,
                        unitNumber: u.unitNumber || u.id,
                        floor: u.floor || 1,
                        type: u.type || 'Apartment',
                        configuration: u.configuration || '2BHK',
                        status: u.status || 'AVAILABLE',
                        carpetArea: u.carpetArea || u.areaSqft || 1000,
                        builtUpArea: u.builtUpArea || 1200,
                        superBuiltUpArea: u.superBuiltUpArea || 1500,
                        basePrice: u.basePrice || 0,
                        floorRise: u.floorRise || 0,
                        plcCharges: u.plcCharges || 0,
                        totalPrice: u.totalPrice || 0,
                    });
                }
            }
            
            for (const deletedId of existingUnitIds) {
                await unitService.delete(deletedId);
            }
        }

        return NextResponse.json({ success: true, data: tower });
    } catch (error) {
        console.error('Error updating tower:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update tower' },
            { status: 500 }
        );
    }
}
