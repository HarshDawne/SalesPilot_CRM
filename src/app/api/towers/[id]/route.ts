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

        // If units are provided in the update, sync them in bulk for performance
        if (body.units && Array.isArray(body.units)) {
            await unitService.updateBulk(id, body.units);
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
