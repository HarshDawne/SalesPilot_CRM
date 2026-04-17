import { NextRequest, NextResponse } from 'next/server';
import { unitService } from '@/lib/property-db';

// POST /api/towers/:towerId/units - Create unit
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ towerId: string }> }
) {
    try {
        const body = await request.json();
        const { towerId } = await params;

        if (!body.label) {
            return NextResponse.json({ error: 'Unit label is required' }, { status: 400 });
        }

        if (!body.propertyId) {
            return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
        }

        const newUnit = await unitService.create({
            ...body,
            towerId,
            propertyId: body.propertyId,
            documents: [],
            metadata: {},
        });

        return NextResponse.json(newUnit, { status: 201 });
    } catch (error) {
        console.error('Create unit error:', error);
        return NextResponse.json({ error: 'Failed to create unit' }, { status: 500 });
    }
}

// GET /api/towers/:towerId/units - List units
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ towerId: string }> }
) {
    try {
        const { towerId } = await params;
        const units = await unitService.getByTower(towerId);
        return NextResponse.json(units);
    } catch (error) {
        console.error('Get units error:', error);
        return NextResponse.json({ error: 'Failed to fetch units' }, { status: 500 });
    }
}
