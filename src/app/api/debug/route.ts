import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
    try {
        const data = {
            users: db.users.findAll(),
            leads: db.leads.findAll(),
            activities: db.activities.findAll(),
            bookings: db.bookings.findAll(),
            // properties are not exposed via db adapter yet, but let's skip or add if needed.
            // db.ts doesn't have properties.findAll, let's check.
        };
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch debug data" }, { status: 500 });
    }
}
