import { NextResponse } from 'next/server';
import { unitService } from '@/lib/property-db';

export async function GET() {
    try {
        const units = unitService.getAll();
        return NextResponse.json(units); // Warning: Can be large, filtering should happen here ideally but we filter on client for wizard
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch units" }, { status: 500 });
    }
}
