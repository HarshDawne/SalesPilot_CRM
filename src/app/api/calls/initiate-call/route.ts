import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { BolnaService } from "@/modules/communication/bolna-service";
import { normalizePhone, isValidPhone } from "@/lib/phone-utils";

/**
 * POST /api/calls/initiate-call
 *
 * Initiates a single Bolna AI call for one lead + one property.
 * This is the clean endpoint used by the InitiateCallModal UI.
 *
 * Body: { leadId: string; propertyId: string; agentId?: string }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { leadId, propertyId, agentId } = body;

        // ── Validate input ──────────────────────────────────────────────────
        if (!leadId || !propertyId) {
            return NextResponse.json(
                { error: "leadId and propertyId are required" },
                { status: 400 }
            );
        }

        // ── Fetch lead ──────────────────────────────────────────────────────
        const lead = db.leads.findById(leadId);
        if (!lead) {
            return NextResponse.json(
                { error: `Lead not found: ${leadId}` },
                { status: 404 }
            );
        }

        // ── Fetch property ──────────────────────────────────────────────────
        const allProperties = db.propertyManagement.findAll();
        const property = allProperties.find((p) => p.id === propertyId);
        if (!property) {
            return NextResponse.json(
                { error: `Property not found: ${propertyId}` },
                { status: 404 }
            );
        }

        const phone = normalizePhone(lead.primaryPhone || (lead as any).phone || "");
        if (!isValidPhone(phone)) {
            return NextResponse.json(
                { error: "Lead has no phone number" },
                { status: 422 }
            );
        }

        console.log(
            `[InitiateCall] Lead: ${lead.name} | Property: ${property.name}`
        );

        // ── Trigger Bolna call with full context ────────────────────────────
        const result = await BolnaService.initiateCallWithContext(lead, property, {
            agentId,
        });

        if (!result.success) {
            console.error("[InitiateCall] Bolna call failed:", result.error);
            return NextResponse.json(
                { error: result.error || "Failed to initiate call" },
                { status: 502 }
            );
        }

        // ── Update lead stage to AI_Calling ─────────────────────────────────
        db.leads.update(leadId, {
            currentStage: "AI_Calling",
            updatedAt: new Date().toISOString(),
            aiCalling: {
                attempts: ((lead.aiCalling?.attempts || 0) + 1),
                followupScheduled: false,
                lastAttemptAt: new Date().toISOString(),
                callRecords: [
                    ...(lead.aiCalling?.callRecords || []),
                    {
                        callId: result.callId || `bolna_${Date.now()}`,
                        startTime: new Date().toISOString(),
                        status: "ringing",
                        notes: `Pitched: ${property.name}`,
                    },
                ],
            },
        });

        // ── Log timeline event ──────────────────────────────────────────────
        try {
            db.timeline.create({
                id: `tl_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                leadId,
                type: "ai_call_attempt",
                timestamp: new Date().toISOString(),
                actor: "system",
                summary: `AI call initiated via Aarini | Property: ${property.name} | Call ID: ${result.callId}`,
                immutable: true,
                payload: {
                    callId: result.callId,
                    propertyId: property.id,
                    propertyName: property.name,
                    agentUsed: agentId || "default",
                    bolnaResponse: result.data,
                },
            });
        } catch (tlErr) {
            console.warn("[InitiateCall] Timeline log failed (non-critical):", tlErr);
        }

        return NextResponse.json({
            success: true,
            callId: result.callId,
            leadName: lead.name,
            propertyName: property.name,
            message: `Call initiated for ${lead.name} — pitching ${property.name}`,
        });
    } catch (error) {
        console.error("[InitiateCall] Unexpected error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
