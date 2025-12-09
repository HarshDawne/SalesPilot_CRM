import { NextRequest, NextResponse } from 'next/server';
import { unitService } from '@/lib/property-db';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const type = searchParams.get('type');

        let units = unitService.getByProperty(id);

        if (status) {
            units = units.filter(u => u.status === status);
        }

        if (type) {
            units = units.filter(u => u.type === type);
        }

        return NextResponse.json({
            success: true,
            data: units,
            count: units.length,
        });
    } catch (error: unknown) {
        console.error('Error fetching units:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch units' },
            { status: 500 }
        );
    }
}
