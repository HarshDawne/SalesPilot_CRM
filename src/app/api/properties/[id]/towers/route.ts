import { NextRequest, NextResponse } from 'next/server';
import { towerService } from '@/lib/property-db';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const towers = towerService.getByProperty(id);

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
