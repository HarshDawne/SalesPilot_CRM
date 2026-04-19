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

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const tower = await towerService.create({
            ...body,
            status: body.status || 'PLANNING'
        });
        
        return NextResponse.json({
            success: true,
            data: tower
        }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to create tower" }, { status: 500 });
    }
}
