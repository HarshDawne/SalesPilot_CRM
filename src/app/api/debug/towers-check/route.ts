import { NextResponse } from 'next/server';
import { towerService, propertyService } from '@/lib/property-db';

export async function GET() {
    try {
        const towers = await towerService.getAll();
        const properties = await propertyService.getAll();
        
        return NextResponse.json({
            count: towers.length,
            towers: towers.map(t => ({
                id: t.id,
                name: t.name,
                propertyId: t.propertyId,
                status: t.status,
                propertyName: properties.find(p => p.id === t.propertyId)?.name || 'UNKNOWN'
            })),
            properties: properties.map(p => ({
                id: p.id,
                name: p.name
            }))
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to perform tower check" }, { status: 500 });
    }
}
