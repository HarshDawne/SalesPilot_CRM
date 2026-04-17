import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
    try {
        const leads = await db.leads.findAll();
        const bookings = await db.bookings.findAll();

        // 1. Leads Today
        const today = new Date().toISOString().split('T')[0];
        const leadsToday = leads.filter(l => l.createdAt.startsWith(today)).length;

        // 2. Pending Follow-ups (Contacted but not Qualified/Closed)
        const pendingFollowUps = leads.filter(l => ["New", "Contacted"].includes(l.status || '')).length;

        // 3. Visits Scheduled (Future bookings)
        const futureVisits = bookings.filter(b => new Date(b.date || b.slotStart) >= new Date()).length;

        // 4. Conversion Rate (Qualified / Total)
        const qualifiedLeads = leads.filter(l => ["Qualified", "Visit Booked", "Completed", "Closed"].includes(l.status || '')).length;
        const conversionRate = leads.length > 0 ? Math.round((qualifiedLeads / leads.length) * 100) : 0;

        return NextResponse.json({
            leadsToday,
            pendingFollowUps,
            futureVisits,
            conversionRate
        });

    } catch (error) {
        console.error("Metrics Error:", error);
        return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 });
    }
}
