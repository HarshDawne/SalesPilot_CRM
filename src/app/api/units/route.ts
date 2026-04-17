import { NextRequest, NextResponse } from 'next/server';
import { unitService } from '@/lib/property-db';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const towerId = searchParams.get('towerId');
        const propertyId = searchParams.get('propertyId');

        let units;
        if (towerId) {
            units = await unitService.getByTower(towerId);
        } else if (propertyId) {
            units = await unitService.getByProperty(propertyId);
        } else {
            units = await unitService.getAll();
        }

        return NextResponse.json(units);
    } catch (error) {
        console.error('Error fetching units:', error);
        return NextResponse.json(
            { error: 'Failed to fetch units' },
            { status: 500 }
        );
    }
}
