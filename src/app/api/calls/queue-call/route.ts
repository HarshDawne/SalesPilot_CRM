import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { BolnaService } from "@/modules/communication/bolna-service";
import { normalizePhone, isValidPhone } from "@/lib/phone-utils";

/**
 * POST /api/calls/queue-call
 *
 * Accepts an array of lead IDs and a property ID,
 * then calls each lead **sequentially** (one after another).
 *
 * Body: { leadIds: string[]; propertyId: string; agentId?: string; delayMs?: number }
 *
 * The response streams back per-lead results so the frontend can
 * show progress in real-time.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { leadIds, propertyId, agentId, delayMs = 2000 } = body;

        // ── Validate ────────────────────────────────────────────────────
        if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
            return NextResponse.json(
                { error: "leadIds array is required" },
                { status: 400 }
            );
        }
        if (!propertyId) {
            return NextResponse.json(
                { error: "propertyId is required" },
                { status: 400 }
            );
        }

        // ── Fetch property ──────────────────────────────────────────────
        const allProperties = db.propertyManagement.findAll();
        const property = allProperties.find((p) => p.id === propertyId);
        if (!property) {
            return NextResponse.json(
                { error: `Property not found: ${propertyId}` },
                { status: 404 }
            );
        }

        console.log(
            `[QueueCall] Starting sequential call queue — ${leadIds.length} leads | Property: ${property.name}`
        );

        const results: {
            leadId: string;
            leadName: string;
            phone: string;
            success: boolean;
            callId?: string;
            error?: string;
            position: number;
        }[] = [];

        let successCount = 0;
        let failCount = 0;
        let skippedCount = 0;

        // ── Process each lead sequentially ──────────────────────────────
        for (let i = 0; i < leadIds.length; i++) {
            const leadId = leadIds[i];
            const lead = db.leads.findById(leadId);

            if (!lead) {
                results.push({
                    leadId,
                    leadName: "Unknown",
                    phone: "",
                    success: false,
                    error: "Lead not found",
                    position: i + 1,
                });
                skippedCount++;
                continue;
            }

            const phone = normalizePhone(
                lead.primaryPhone || (lead as any).phone || ""
            );

            if (!isValidPhone(phone)) {
                results.push({
                    leadId,
                    leadName: lead.name || "Unknown",
                    phone: phone || "(none)",
                    success: false,
                    error: "Invalid or missing phone number",
                    position: i + 1,
                });
                skippedCount++;
                continue;
            }

            console.log(
                `[QueueCall] [${i + 1}/${leadIds.length}] Calling ${lead.name} at ${phone}…`
            );

            try {
                // Call the Bolna service
                const result = await BolnaService.initiateCallWithContext(
                    lead,
                    property,
                    { agentId }
                );

                if (result.success) {
                    // Update lead stage
                    db.leads.update(leadId, {
                        currentStage: "AI_Calling",
                        updatedAt: new Date().toISOString(),
                        aiCalling: {
                            attempts: (lead.aiCalling?.attempts || 0) + 1,
                            followupScheduled: false,
                            lastAttemptAt: new Date().toISOString(),
                            callRecords: [
                                ...(lead.aiCalling?.callRecords || []),
                                {
                                    callId:
                                        result.callId || `bolna_${Date.now()}`,
                                    startTime: new Date().toISOString(),
                                    status: "ringing",
                                    notes: `Pitched: ${property.name}`,
                                },
                            ],
                        },
                    });

                    // Log timeline
                    try {
                        db.timeline.create({
                            id: `tl_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                            leadId,
                            type: "ai_call_attempt",
                            timestamp: new Date().toISOString(),
                            actor: "system",
                            summary: `AI call initiated (queue ${i + 1}/${leadIds.length}) | Property: ${property.name}`,
                            immutable: true,
                            payload: {
                                callId: result.callId,
                                propertyId: property.id,
                                propertyName: property.name,
                                queuePosition: i + 1,
                                queueTotal: leadIds.length,
                            },
                        });
                    } catch (_) {}

                    results.push({
                        leadId,
                        leadName: lead.name || "Unknown",
                        phone,
                        success: true,
                        callId: result.callId,
                        position: i + 1,
                    });
                    successCount++;
                } else {
                    results.push({
                        leadId,
                        leadName: lead.name || "Unknown",
                        phone,
                        success: false,
                        error: result.error || "Call failed",
                        position: i + 1,
                    });
                    failCount++;
                }
            } catch (err: any) {
                results.push({
                    leadId,
                    leadName: lead.name || "Unknown",
                    phone,
                    success: false,
                    error: err.message || String(err),
                    position: i + 1,
                });
                failCount++;
            }

            // ── Delay before next call to avoid flooding the API ────────
            if (i < leadIds.length - 1) {
                await new Promise((resolve) =>
                    setTimeout(resolve, Math.max(delayMs, 1000))
                );
            }
        }

        console.log(
            `[QueueCall] Done — Success: ${successCount}, Failed: ${failCount}, Skipped: ${skippedCount}`
        );

        return NextResponse.json({
            success: true,
            total: leadIds.length,
            successCount,
            failCount,
            skippedCount,
            results,
            message: `Queue complete: ${successCount} called, ${failCount} failed, ${skippedCount} skipped`,
        });
    } catch (error: any) {
        console.error("[QueueCall] Unexpected error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
