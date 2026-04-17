import { NextRequest, NextResponse } from 'next/server';
import { towerService } from '@/lib/property-db';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ towerId: string }> }
) {
    try {
        const { towerId } = await params;
        const body = await request.json();

        const updated = await towerService.update(towerId, body);

        if (!updated) {
            return NextResponse.json(
                { success: false, error: 'Tower not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error('Error updating tower:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update tower' },
            { status: 500 }
        );
    }
}
