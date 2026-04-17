import { NextResponse } from 'next/server';
import { propertyService, towerService, unitService } from '@/lib/property-db';

export async function GET() {
    try {
        const properties = await propertyService.getAll();
        const allUnits = await unitService.getAll();

        // 1. Dead Stock Analysis (Available > 90 Days)
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const deadStock = allUnits.filter(u =>
            u.status === 'AVAILABLE' &&
            new Date(u.createdAt) < ninetyDaysAgo
        );

        // 2. Velocity (Simulated - Booked in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentBookings = allUnits.filter(u =>
            u.status === 'BOOKED' &&
            new Date(u.updatedAt) > thirtyDaysAgo
        );

        // 3. Occupancy by Property
        const propertyStats = await Promise.all(properties.map(async p => {
            const stats = await unitService.getInventoryStats(p.id);
            return {
                id: p.id,
                name: p.name,
                ...stats
            };
        }));

        // 4. Dead Stock Value
        const deadStockValue = deadStock.reduce((sum, u) => sum + u.totalPrice, 0);

        return NextResponse.json({
            deadStockCount: deadStock.length,
            deadStockValue,
            monthlyVelocity: recentBookings.length,
            propertyStats,
            deadStockUnits: deadStock.map(u => ({
                id: u.id,
                unitNumber: u.unitNumber,
                price: u.totalPrice,
                daysOnMarket: Math.floor((new Date().getTime() - new Date(u.createdAt).getTime()) / (1000 * 3600 * 24)),
                type: u.type,
                towerId: u.towerId,
                propertyId: u.propertyId
            })).slice(0, 50) // Top 50 oldest
        });

    } catch (error) {
        console.error("Inventory Intelligence Error:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
