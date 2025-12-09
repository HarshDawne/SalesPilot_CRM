import { NextRequest, NextResponse } from 'next/server';
import { unitService } from '@/lib/property-db';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const unit = unitService.getById(id);

        if (!unit) {
            return NextResponse.json(
                { success: false, error: 'Unit not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: unit });
    } catch (error: unknown) {
        console.error('Error fetching unit:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch unit' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await request.json();

        const unit = unitService.update(id, body);
        if (!unit) {
            return NextResponse.json(
                { success: false, error: 'Unit not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: unit });
    } catch (error: unknown) {
        console.error('Error updating unit:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update unit' },
            { status: 500 }
        );
    }
}
