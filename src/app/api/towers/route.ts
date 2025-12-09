import { NextResponse } from 'next/server';
import { towerService } from '@/lib/property-db';

export async function GET() {
    try {
        const towers = towerService.getAll();
        return NextResponse.json(towers);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch towers" }, { status: 500 });
    }
}
