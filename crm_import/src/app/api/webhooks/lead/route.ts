import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Basic validation
        if (!body.name || !body.phone) {
            return NextResponse.json(
                { error: "ValidationError", message: "Name and Phone are required" },
                { status: 400 }
            );
        }

        // Create Lead
        const newLead = {
            id: uuidv4(),
            firstName: body.name.split(" ")[0],
            lastName: body.name.split(" ").slice(1).join(" ") || "",
            email: body.email || null,
            phone: body.phone,
            budgetMin: body.budget_min || 0,
            budgetMax: body.budget_max || 0,
            timelineToBuy: body.timeline_to_buy || "Unknown",
            status: "New",
            tags: body.tags || ["New Lead"],
            createdAt: new Date().toISOString(),
            lastContactedAt: null,
            assignedTo: null, // Auto-assignment logic could go here
        };

        await db.leads.create(newLead);

        // Log Activity
        await db.activities.create({
            id: uuidv4(),
            leadId: newLead.id,
            type: "form_submission",
            summary: `Lead created from ${body.source || "Landing Page"}`,
            createdAt: new Date().toISOString(),
            metadata: { source: body.source, property_interest: body.property_interest_id }
        });

        return NextResponse.json({
            id: newLead.id,
            status: "success",
            message: "Lead created successfully"
        }, { status: 201 });

    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json(
            { error: "ServerError", message: "Failed to process webhook" },
            { status: 500 }
        );
    }
}
