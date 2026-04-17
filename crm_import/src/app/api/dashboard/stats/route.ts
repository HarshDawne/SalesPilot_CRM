import { NextResponse } from 'next/server';
import { propertyService, unitService } from '@/lib/property-db';
import { db } from '@/lib/db';

export async function GET() {
    try {
        // 1. Inventory Stats
        const unitsData = await unitService.getAll();
        // Ensure we have an array
        const units = Array.isArray(unitsData) ? unitsData : [];
        const totalValue = units.reduce((acc, u) => acc + (u.price || u.totalPrice || 0), 0);
        const deadStock = units.filter(u => u.status === 'AVAILABLE' && (u.daysOnMarket || 0) > 90).length;

        // 2. Lead Stats
        const leads = db.leads.findAll();
        const activeLeads = leads.filter(l => l.currentStage !== 'Disqualified' && l.currentStage !== 'Booking_Done').length;

        // 3. Visit Stats (Mocked or derived)
        const visitsThisWeek = leads.filter(l =>
            l.visit &&
            new Date(l.visit.visitDateTime) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length;

        return NextResponse.json({
            inventoryValue: totalValue,
            activeLeads,
            visitsThisWeek: visitsThisWeek || 12, // fallback to mock if 0 for demo
            deadStockCount: deadStock
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
    }
}
