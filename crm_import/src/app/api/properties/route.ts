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

        // Auto-create towers based on totalTowers
        if (property.totalTowers > 0) {
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
