import { NextRequest, NextResponse } from 'next/server';
import { towerService } from '@/lib/property-db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const towers = await towerService.getByProperty(id);

        return NextResponse.json({
            success: true,
            data: towers,
            count: towers.length,
        });
    } catch (error: unknown) {
        console.error('Error fetching towers:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch towers' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const body = await request.json();
        const { id } = await params;

        // Basic validation
        if (!body.name) {
            return NextResponse.json(
                { success: false, error: 'Tower name is required' },
                { status: 400 }
            );
        }

        const tower = await towerService.create({
            ...body,
            propertyId: id,
            availableUnits: body.totalUnits || 0, // Initial available units = total
        });

        return NextResponse.json({
            success: true,
            data: tower,
            id: tower.id, // For compatibility
        }, { status: 201 });

    } catch (error: unknown) {
        console.error('Error creating tower:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create tower' },
            { status: 500 }
        );
    }
}
