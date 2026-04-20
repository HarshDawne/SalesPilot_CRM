import { VOICE_CONFIG } from "@/lib/voice-config";
import { Lead } from "@/modules/leads/types";
import { normalizePhone } from "@/lib/phone-utils";

export class VoiceService {
    static async triggerCall(lead: Lead, context: Record<string, any> = {}, options?: { agentId?: string, maxDuration?: number }) {
        try {
            const phoneNumber = lead.phone || lead.primaryPhone || "";
            // Use shared normalizePhone for consistent formatting
            const formattedPhone = normalizePhone(phoneNumber);

            if (!formattedPhone || formattedPhone.length < 12) {
                console.warn(`[Voice Service] Invalid phone for lead ${lead.id}: ${phoneNumber}`);
                return { success: false, error: "Invalid Phone" };
            }

            console.log(`[Voice Service] Normalized Phone: ${phoneNumber} -> ${formattedPhone}`);

            // Construct Payload with Context
            const payload = {
                agent_id: options?.agentId || VOICE_CONFIG.AGENT_ID,
                recipient_phone_number: formattedPhone,
                max_duration: options?.maxDuration || undefined,
                webhook_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/calls/webhook`,
                user_data: {
                    lead_name: lead.name,
                    lead_source: lead.source,
                    interest: lead.preferences?.configuration?.[0] || "General",
                    ...context // Merge additional context (property details, etc.)
                }
            };

            console.log(`[Voice Service] Triggering Call for ${payload.user_data.lead_name} (${payload.recipient_phone_number}) with Agent ${payload.agent_id}`, context);

            // Execute Request
            const response = await fetch(VOICE_CONFIG.API_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${VOICE_CONFIG.API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[Voice Service] API Error: ${response.status} - ${errorText}`);
                return { success: false, error: errorText };
            }

            const data = await response.json();
            console.log(`[Voice Service] Call Initiated:`, data);
            return { success: true, data };

        } catch (error) {
            console.error(`[Voice Service] Service Error:`, error);
            return { success: false, error: String(error) };
        }
    }

    /**
     * Fetch call execution details from Bolna API.
     *
     * Bolna exposes multiple possible endpoints depending on the version:
     *   - GET {origin}/call/details/{execution_id}
     *   - GET {origin}/execution/{execution_id}
     *   - GET {origin}/executions/{execution_id}
     *
     * We try all of them in order so we're resilient to API changes.
     */
    static async getCallDetails(executionId: string): Promise<any | null> {
        if (!executionId) return null;

        try {
            console.log(`[Voice Service] Fetching details for execution: ${executionId}`);

            let baseUrl = "";
            try {
                const urlObj = new URL(VOICE_CONFIG.API_URL);
                baseUrl = urlObj.origin;
            } catch (_) {
                baseUrl = "https://api.bolna.dev";
            }

            const headers = {
                "Authorization": `Bearer ${VOICE_CONFIG.API_KEY}`,
                "Content-Type": "application/json"
            };

            // Try multiple endpoint patterns used by Bolna API
            const endpoints = [
                `${baseUrl}/call/details/${executionId}`,
                `${baseUrl}/execution/${executionId}`,
                `${baseUrl}/executions/${executionId}`,
            ];

            for (const url of endpoints) {
                try {
                    console.log(`[Voice Service] Trying: ${url}`);
                    const response = await fetch(url, {
                        method: "GET",
                        headers,
                        signal: AbortSignal.timeout(10000), // 10s timeout per attempt
                    });

                    if (response.ok) {
                        const data = await response.json();
                        console.log(`[Voice Service] ✓ Got details from: ${url}`);

                        // Normalize the response into a consistent shape
                        return this.normalizeBolnaResponse(data);
                    }

                    if (response.status === 404) {
                        console.log(`[Voice Service] 404 at ${url}, trying next…`);
                        continue;
                    }

                    console.warn(`[Voice Service] ${response.status} at ${url}`);
                } catch (fetchErr: any) {
                    if (fetchErr.name === 'TimeoutError' || fetchErr.name === 'AbortError') {
                        console.warn(`[Voice Service] Timeout at ${url}`);
                    } else {
                        console.warn(`[Voice Service] Fetch error at ${url}:`, fetchErr.message);
                    }
                    continue;
                }
            }

            console.warn(`[Voice Service] All endpoints failed for ${executionId}`);
            return null;

        } catch (error) {
            console.error(`[Voice Service] Error fetching details:`, error);
            return null;
        }
    }

    /**
     * Normalize the various Bolna API response shapes into a single consistent format.
     * Bolna returns different field names depending on the API version.
     */
    private static normalizeBolnaResponse(raw: any): any {
        if (!raw) return null;

        return {
            // Status
            status: raw.status || raw.call_status || "unknown",

            // Duration (seconds)
            duration:
                raw.conversation_time ??
                raw.conversation_duration ??
                raw.call_duration ??
                raw.duration ??
                raw.telephony_data?.duration ??
                0,

            // Cost
            total_cost:
                raw.total_cost ??
                raw.cost ??
                raw.usage_cost ??
                0,

            cost_breakdown: raw.cost_breakdown || null,

            // Transcript
            transcript:
                raw.transcript ??
                raw.conversation_text ??
                "",

            // Recording
            recording_url:
                raw.recording_url ??
                raw.telephony_data?.recording_url ??
                raw.audio_url ??
                "",

            // Summary / Analysis
            summary:
                raw.summary ??
                raw.call_summary ??
                "",

            // Intent / Extracted data
            intent:
                raw.intent ??
                raw.detected_intent ??
                raw.extracted_data?.intent ??
                "",

            extracted_data: raw.extracted_data || null,

            // Telephony metadata
            telephony_data: raw.telephony_data || null,

            // Hangup reason
            hangup_reason:
                raw.hangup_reason ??
                raw.telephony_data?.hangup_reason ??
                "",

            // Keep raw for debugging
            _raw: raw,
        };
    }
}
