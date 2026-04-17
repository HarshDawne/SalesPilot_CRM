import { NextRequest, NextResponse } from 'next/server';
import { propertyService, unitService } from '@/lib/property-db';
import type { PropertyInventoryStats } from '@/types/property';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const propertyId = searchParams.get('propertyId');

        if (propertyId) {
            // Get stats for specific property
            const stats = await unitService.getInventoryStats(propertyId);

            return NextResponse.json({
                success: true,
                data: stats,
            });
        } else {
            // Get stats for all properties
            const properties = await propertyService.getAll();
            const allUnits = await unitService.getAll();

            const totalStats: PropertyInventoryStats = {
                propertyId: 'all',
                totalUnits: allUnits.length,
                available: allUnits.filter(u => u.status === 'AVAILABLE').length,
                reserved: allUnits.filter(u => u.status === 'RESERVED').length,
                negotiation: allUnits.filter(u => u.status === 'NEGOTIATION').length,
                booked: allUnits.filter(u => u.status === 'BOOKED').length,
                blocked: allUnits.filter(u => u.status === 'BLOCKED').length,
                occupancyRate: 0,
            };

            totalStats.occupancyRate = totalStats.totalUnits > 0
                ? ((totalStats.booked + totalStats.reserved) / totalStats.totalUnits) * 100
                : 0;

            return NextResponse.json({
                success: true,
                data: totalStats,
            });
        }
    } catch (error) {
        console.error('Error fetching inventory stats:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch inventory stats' },
            { status: 500 }
        );
    }
}
