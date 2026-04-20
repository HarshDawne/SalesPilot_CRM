import { VOICE_CONFIG } from "@/lib/voice-config";
import { normalizePhone, isValidPhone } from "@/lib/phone-utils";
import type { Lead } from "@/lib/db";
import type { Property as PropertyManagement } from "@/types/property";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BolnaCallResult {
    success: boolean;
    callId?: string;
    data?: Record<string, any>;
    error?: string | null;
}

export interface BolnaCallVariables {
    // Lead context
    lead_name: string;
    lead_phone: string;
    lead_budget: string;
    lead_area: string;
    lead_property_type: string;
    lead_config: string;
    lead_purpose: string;
    lead_stage: string;
    lead_notes: string;

    // Property context
    property_name: string;
    property_location: string;
    property_config: string;
    property_price: string;
    property_highlights: string;
    property_amenities: string;
    property_possession: string;
    property_rera: string;
    property_developer: string;
    property_visit_slots: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Phone formatting is now handled by the shared normalizePhone utility
// in @/lib/phone-utils.ts which supports all Indian number formats.

function formatBudget(min?: number | null, max?: number | null): string {
    const fmt = (n: number) => {
        if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
        if (n >= 100000) return `₹${(n / 100000).toFixed(0)} L`;
        return `₹${n.toLocaleString("en-IN")}`;
    };
    if (min && max) return `${fmt(min)} – ${fmt(max)}`;
    if (min) return `${fmt(min)}+`;
    if (max) return `up to ${fmt(max)}`;
    return "Not specified";
}

function formatPrice(min?: number | null, max?: number | null): string {
    const fmt = (n: number) => {
        if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
        if (n >= 100000) return `₹${(n / 100000).toFixed(0)} L`;
        return `₹${n.toLocaleString("en-IN")}`;
    };
    if (min && max) return `${fmt(min)} – ${fmt(max)}`;
    if (min) return `Starting ${fmt(min)}`;
    return "Price on request";
}

// ─── Variable Builder ─────────────────────────────────────────────────────────

export function buildBolnaVariables(
    lead: Lead,
    property: PropertyManagement
): BolnaCallVariables {
    const q = lead.qualification;

    return {
        // Lead
        lead_name: lead.name || "there",
        lead_phone: normalizePhone(lead.primaryPhone || lead.phone || ""),
        lead_budget: formatBudget(
            q?.budgetMin ?? lead.budgetMin,
            q?.budgetMax ?? lead.budgetMax
        ),
        lead_area:
            q?.preferredLocations?.join(", ") ||
            lead.preferredLocation ||
            "Not specified",
        lead_property_type: q?.propertyType?.join(", ") || lead.unitType || "Residential",
        lead_config: q?.configurations?.join(", ") || "Not specified",
        lead_purpose: q?.purpose === "investment" ? "Investment" : q?.purpose === "self-use" ? "Self Use" : "Buy",
        lead_stage: lead.currentStage || "New",
        lead_notes: q?.qualificationNotes || lead.meta?.notes || "",

        // Property
        property_name: property.name,
        property_location: `${property.location?.locality || ""}, ${property.location?.city || ""}`.replace(/^, |, $/, ""),
        property_config: (() => {
            const mn = property.minBedrooms;
            const mx = property.maxBedrooms;
            if (mn && mx && mn !== mx) return `${mn}BHK – ${mx}BHK`;
            if (mn) return `${mn}BHK`;
            return "Various configurations";
        })(),
        property_price: formatPrice(property.startingPrice, undefined),
        property_highlights: (property.highlights || []).slice(0, 4).join(", ") || "Premium amenities",
        property_amenities: (property.amenities || [])
            .slice(0, 6)
            .map((a) => (typeof a === "string" ? a : a.name))
            .join(", ") || "Modern amenities",
        property_possession:
            property.possessionFrom ||
            property.expectedCompletion ||
            "Contact for details",
        property_rera: property.reraId || "Applied for",
        property_developer: property.developerName || "Citizen Properties",
        property_visit_slots: "Saturday & Sunday, 11am – 5pm",
    };
}

// ─── BolnaService ─────────────────────────────────────────────────────────────

export const BolnaService = {
    /**
     * Initiate a personalised Bolna AI call for a lead,
     * injecting both lead and property context as prompt variables.
     */
    async initiateCallWithContext(
        lead: Lead,
        property: PropertyManagement,
        options?: { agentId?: string; campaignId?: string }
    ): Promise<BolnaCallResult> {
        const phone = normalizePhone(lead.primaryPhone || lead.phone || "");

        if (!isValidPhone(phone)) {
            console.warn(`[BolnaService] Invalid phone for lead ${lead.id}: ${phone}`);
            return { success: false, error: "Invalid phone number" };
        }

        const variables = buildBolnaVariables(lead, property);

        const payload = {
            agent_id: options?.agentId || VOICE_CONFIG.AGENT_ID,
            recipient_phone_number: phone,
            webhook_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/calls/webhook`,
            variables,
            metadata: {
                lead_id: lead.id,
                property_id: property.id,
                campaign_id: options?.campaignId || null,
                initiated_at: new Date().toISOString(),
                crm: "SalesPilot",
            },
        };

        console.log(
            `[BolnaService] Initiating call → Lead: ${lead.name} (${phone}) | Property: ${property.name}`
        );

        try {
            const response = await fetch(VOICE_CONFIG.API_URL, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${VOICE_CONFIG.API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                console.error(`[BolnaService] API Error ${response.status}:`, data);
                return {
                    success: false,
                    error: data?.message || data?.error || `API error ${response.status}`,
                };
            }

            const callId =
                data?.call_id ||
                data?.run_id ||
                data?.execution_id ||
                data?.id ||
                `bolna_${Date.now()}`;

            console.log(`[BolnaService] Call started. Call ID: ${callId}`);
            return { success: true, callId, data };
        } catch (err) {
            console.error("[BolnaService] Network error:", err);
            return { success: false, error: String(err) };
        }
    },

    /**
     * Legacy stub used by existing dispatch route (kept for compatibility).
     */
    async initiateCall(
        leadId: string,
        campaignId: string
    ): Promise<BolnaCallResult> {
        console.warn(
            `[BolnaService] Legacy initiateCall called for lead ${leadId}. Use initiateCallWithContext() for full variable injection.`
        );
        return {
            success: true,
            callId: `legacy_${Date.now()}`,
            data: { run_id: `mock-run-${Date.now()}` },
            error: null,
        };
    },

    async getCallStatus(callId: string): Promise<{ status: string; duration?: number }> {
        try {
            let baseUrl = "https://api.bolna.ai";
            try {
                const u = new URL(VOICE_CONFIG.API_URL);
                baseUrl = u.origin;
            } catch (_) {}

            const res = await fetch(`${baseUrl}/executions/${callId}`, {
                headers: { Authorization: `Bearer ${VOICE_CONFIG.API_KEY}` },
            });

            if (!res.ok) return { status: "unknown" };
            return await res.json();
        } catch {
            return { status: "unknown" };
        }
    },
};
