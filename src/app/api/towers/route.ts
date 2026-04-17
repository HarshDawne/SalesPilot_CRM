import { NextRequest, NextResponse } from 'next/server';
import { towerService } from '@/lib/property-db';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const propertyId = searchParams.get('propertyId');
        
        let towersData;
        if (propertyId) {
            towersData = await towerService.getByProperty(propertyId);
        } else {
            towersData = await towerService.getAll();
        }
        
        // Ensure we always return an array
        const towers = Array.isArray(towersData) ? towersData : [];
        return NextResponse.json(towers);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch towers" }, { status: 500 });
    }
}
