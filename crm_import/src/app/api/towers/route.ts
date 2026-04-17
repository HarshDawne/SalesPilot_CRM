import { NextResponse } from 'next/server';
import { towerService } from '@/lib/property-db';

export async function GET() {
    try {
        const towersData = towerService.getAll();
        // Ensure we always return an array
        const towers = Array.isArray(towersData) ? towersData : [];
        return NextResponse.json(towers);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch towers" }, { status: 500 });
    }
}
