
import { AIService } from '@/modules/ai/ai-service';
import { VisitService } from '@/modules/sales/visit-service';
import { db } from '@/lib/db';

export class CallAnalysisService {

    /**
     * Analyzes the call transcript to extract booking/visit details.
     * If a visit is detected, it creates a booking record.
     */
    static async extractAndScheduleVisit(leadId: string, transcript: string): Promise<boolean> {
        if (!transcript || transcript.length < 50) return false;

        console.log(`[CallAnalysis] Analyzing transcript for lead ${leadId}...`);

        const systemPrompt = `You are an expert scheduler for a Real Estate company.
        Analyze the following call transcript between an AI agent and a lead.
        Determine if the lead agreed to a specific time for a "Site Visit" or "Office Visit".
        
        If YES, extract the details in JSON format.
        If NO, return { "visitDetected": false }.

        Current Date/Time: ${new Date().toISOString()}
        
        JSON Schema:
        {
            "visitDetected": boolean,
            "visitDate": string (ISO 8601, future date),
            "visitTime": string (HH:mm format),
            "visitType": "site_visit" | "office_visit",
            "notes": string (context about the visit)
        }
        `;

        const userPrompt = `Transcript:
        ${transcript}`;

        // REAL IMPLEMENTATION
        const response = await AIService.analyzeTranscript(systemPrompt, userPrompt);

        if (response && response.visitDetected) {
            console.log(`[CallAnalysis] Visit detected for lead ${leadId}:`, response);

            // Calculate start/end times
            let slotStart = new Date();
            if (response.visitDate && response.visitTime) {
                slotStart = new Date(`${response.visitDate}T${response.visitTime}`);
            } else {
                // Fallback: tomorrow 10am if parsing fails but intent is strong
                slotStart.setDate(slotStart.getDate() + 1);
                slotStart.setHours(10, 0, 0, 0);
            }

            const slotEnd = new Date(slotStart);
            slotEnd.setHours(slotEnd.getHours() + 1);

            // Create Visit
            await VisitService.createVisit({
                leadId,
                slotStart: slotStart.toISOString(),
                slotEnd: slotEnd.toISOString(),
                mode: response.visitType || 'site_visit',
                notes: response.notes || 'Auto-scheduled by AI',
                status: 'confirmed'
            });

            return true;
        }

        return false;
    }

    /**
     * Evaluates if a lead is qualified for Agent 2 based on transcript analysis.
     */
    static async evaluateQualification(transcript: string, config: any): Promise<{
        isQualified: boolean;
        budget?: number;
        timelineMonths?: number;
        intent: string;
        reasoning: string;
    }> {
        if (!transcript || transcript.length < 30) {
            return { isQualified: false, intent: 'unknown', reasoning: 'Transcript too short for evaluation.' };
        }

        const systemPrompt = `You are a Senior Real Estate Sales Qualifier.
        Analyze the transcript to determine if the lead should be passed to a Closing Specialist.
        
        Qualification Criteria:
        1. Intent: Must show active interest (asking prices, configurations, site visit).
        2. Budget: Extract any mentioned budget (in Lacs/Crores).
        3. Timeline: When do they plan to buy?
        
        JSON Schema:
        {
            "isQualified": boolean,
            "budget": number (in Lacs, use 0 if unknown),
            "timelineMonths": number (use 12 if unknown),
            "intent": "interested" | "callback" | "site_visit" | "not_interested",
            "reasoning": "string"
        }
        `;

        const userPrompt = `Transcript:\n${transcript}`;

        const analysis = await AIService.analyzeTranscript(systemPrompt, userPrompt);

        if (!analysis) {
             return { isQualified: false, intent: 'unknown', reasoning: 'AI analysis failed.' };
        }

        // Apply strict thresholds if provided in config
        let qualified = analysis.isQualified;
        
        if (config?.minIntentLevel === 'high' && analysis.intent === 'callback') qualified = false;
        if (config?.maxTimelineMonths && analysis.timelineMonths > config.maxTimelineMonths) qualified = false;

        return {
            ...analysis,
            isQualified: qualified
        };
    }
}
