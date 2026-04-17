import { VOICE_CONFIG } from "@/lib/voice-config";
import { Lead } from "@/modules/leads/types";

export class VoiceService {
    static async triggerCall(lead: Lead, context: Record<string, any> = {}, options?: { agentId?: string, maxDuration?: number }) {
        try {
            const phoneNumber = lead.phone || lead.primaryPhone || "";
            // Validate Phone Number
            if (!phoneNumber || phoneNumber.length < 10) {
                console.warn(`[Voice Service] Invalid phone for lead ${lead.id}: ${phoneNumber}`);
                return { success: false, error: "Invalid Phone" };
            }

            // Normalize Phone Number for India (User Request)
            let formattedPhone = phoneNumber.replace(/\s+/g, '').replace(/-/g, '');

            // Case 1: Already has +91 (e.g., +919999999999) - Keep as is
            if (formattedPhone.startsWith('+91') && formattedPhone.length === 13) {
                // Keep as is
            }
            // Case 2: 12 digits starting with 91 but missing + (e.g., 919999999999) - Add +
            else if (formattedPhone.startsWith('91') && formattedPhone.length === 12) {
                formattedPhone = '+' + formattedPhone;
            }
            // Case 3: 10 digits (e.g., 9999999999) - Add +91
            else if (formattedPhone.length === 10) {
                formattedPhone = '+91' + formattedPhone;
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
    static async getCallDetails(executionId: string) {
        try {
            console.log(`[Voice Service] Fetching details for execution: ${executionId}`);

            // API Execution endpoint - Start
            // Robustly extract origin to handle different config URLs (e.g. /call vs /calls/make)
            let baseUrl = "";
            try {
                const urlObj = new URL(VOICE_CONFIG.API_URL);
                baseUrl = urlObj.origin;
            } catch (e) {
                // Fallback if invalid URL in config
                baseUrl = "https://api.bolna.ai";
            }

            const url = `${baseUrl}/executions/${executionId}`;
            console.log(`[Voice Service] Fetching call details from: ${url}`);

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${VOICE_CONFIG.API_KEY}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                console.warn(`[Voice Service] Failed to fetch details: ${response.status}`);
                return null;
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error(`[Voice Service] Error fetching details:`, error);
            return null;
        }
    }
}

