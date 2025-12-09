import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // 1. Fetch "Native" Bookings (Mock for now)
        const nativeBookings: any[] = [];

        // 2. Fetch Lead Visits (The "Auto-Booked" ones)
        const allLeads = db.leads.findAll();
        const visitBookings = allLeads
            .filter(l => l.visit && l.visit.visitDateTime) // Only leads with scheduled visits
            .map(l => {
                const visitTime = new Date(l.visit!.visitDateTime);
                return {
                    id: l.visit!.visitId,
                    projectId: l.visit!.projectId || 'project-1', // Default or actual
                    leadName: l.name,
                    leadId: l.id,
                    slotStart: visitTime.toISOString(),
                    slotEnd: new Date(visitTime.getTime() + 60 * 60 * 1000).toISOString(), // Assume 1 hour default
                    status: l.visit!.visitStatus,
                    type: "VISIT",
                    agentId: l.visit!.assignedAgentId
                };
            });

        // Filter by date range if provided
        let allEvents = [...nativeBookings, ...visitBookings];

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            allEvents = allEvents.filter(e => {
                const eDate = new Date(e.slotStart);
                return eDate >= start && eDate <= end;
            });
        }

        return NextResponse.json(allEvents);

    } catch (error) {
        console.error("Fetch Bookings Error:", error);
        return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
    }
}
