import { AI_CONFIG } from '@/lib/ai-config';

interface AIResponse {
    content: string;
    error?: string;
}

export class AIService {

    public static async callLLM(systemPrompt: string, userPrompt: string): Promise<AIResponse> {
        if (!AI_CONFIG.apiKey) {
            console.warn("AI_API_KEY is missing");
            return { content: '', error: "AI Configuration Missing" };
        }

        try {
            const res = await fetch(`${AI_CONFIG.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': AI_CONFIG.appName,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: AI_CONFIG.model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ]
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error?.message || 'AI Request Failed');
            }

            return { content: data.choices[0].message.content };
        } catch (e: any) {
            console.error("AI Service Error:", e);
            return { content: '', error: e.message };
        }
    }

    static async analyzeTranscript(systemPrompt: string, userPrompt: string): Promise<any> {
        const response = await this.callLLM(systemPrompt, userPrompt);
        try {
            if (response.error) throw new Error(response.error);
            const jsonStr = response.content.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error("Failed to parse transcript analysis", e);
            return null;
        }
    }

    static async analyzeLead(leadData: any): Promise<{ score: number; reasoning: string; tags: string[] }> {
        const systemPrompt = `You are an expert Real Estate Lead Analyst. Analyze the lead data and provide:
    1. A lead score (0-100) based on intent and budget.
    2. A brief reasoning (max 1 sentence).
    3. Three relevant tags (e.g., HIGH_BUDGET, IMMEDIATE_BUYER).
    
    Output purely in JSON format: { "score": number, "reasoning": "string", "tags": ["string"] }`;

        const userPrompt = `Lead Name: ${leadData.name}
    Source: ${leadData.source}
    Budget: ${JSON.stringify(leadData.budget)}
    Preferences: ${JSON.stringify(leadData.preferences)}
    Notes: ${JSON.stringify(leadData.metadata)}`;

        const response = await this.callLLM(systemPrompt, userPrompt);

        try {
            if (response.error) throw new Error(response.error);
            // Clean up markdown code blocks if any
            const jsonStr = response.content.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (e) {
            // Fallback
            return { score: 50, reasoning: "AI Analysis failed to parse", tags: ["MANUAL_REVIEW"] };
        }
    }

    static async generateScript(leadData: any, objective: 'INTRO' | 'FOLLOW_UP' | 'CLOSING'): Promise<string> {
        const systemPrompt = `You are a top-tier Real Estate Sales Trainer. Write a short, punchy, and persuasive phone script for a sales agent.
    Tone: Professional, Warm, Consultative. No robotic text.`;

        const userPrompt = `Lead: ${leadData.name}
    Project Interest: ${leadData.preferences?.configuration || 'General'}
    Objective: ${objective}
    
    Write the script (max 50 words).`;

        const response = await this.callLLM(systemPrompt, userPrompt);
        return response.content || "Script generation unavailable.";
    }
}
