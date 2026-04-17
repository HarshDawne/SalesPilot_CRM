import { AI_CONFIG } from '@/lib/ai-config';
import fs from 'fs/promises';
import path from 'path';

interface PersonalizationContext {
    leadName: string;
    leadPhone: string;
    leadEmail?: string;
    leadPreferences?: any;
    callTranscript?: string;
    callOutcome?: string;
    propertyData: {
        propertyName: string;
        bedrooms?: string;
        locality?: string;
        city?: string;
        priceFormatted?: string;
        amenities?: string[];
        [key: string]: any;
    };
    templateId: string;
    channel: 'EMAIL' | 'WHATSAPP' | 'SMS';
}

export class AIPersonalizationService {
    /**
     * Generate AI-personalized message based on template and context
     */
    static async personalizeMessage(context: PersonalizationContext): Promise<{
        subject?: string;
        content: string;
        isPersonalized: boolean;
    }> {
        try {
            // If AI not configured, fall back to template
            if (!AI_CONFIG.apiKey) {
                console.warn('[AIPersonalization] AI_API_KEY not configured. Using template only.');
                return this.getTemplateOnly(context);
            }

            // Get base template
            const template = await this.getTemplate(context.templateId, context.channel);

            // Build AI prompt
            const prompt = this.buildPersonalizationPrompt(context, template);

            // Call AI
            const aiResponse = await this.callAI(prompt);

            // Parse response
            const personalized = this.parseAIResponse(aiResponse, context.channel);

            console.log(`[AIPersonalization] ✅ Personalized ${context.channel} for ${context.leadName}`);

            return {
                ...personalized,
                isPersonalized: true
            };

        } catch (error) {
            console.error('[AIPersonalization] Error personalizing message:', error);
            // Fallback to template
            return this.getTemplateOnly(context);
        }
    }

    /**
     * Build AI prompt for personalization
     */
    private static buildPersonalizationPrompt(context: PersonalizationContext, template: any): string {
        const { leadName, callTranscript, callOutcome, propertyData, channel } = context;

        let prompt = `You are an expert real estate sales assistant. Create a personalized ${channel.toLowerCase()} message for a lead.

**Lead Information:**
- Name: ${leadName}
- Call Outcome: ${callOutcome || 'Unknown'}

**Property:**
- Name: ${propertyData.propertyName}
- Type: ${propertyData.bedrooms || ''} BHK
- Location: ${propertyData.locality}, ${propertyData.city}
- Price: ${propertyData.priceFormatted || ''}

**Call Context:**
${callTranscript ? `Transcript: ${callTranscript.substring(0, 500)}...` : 'No transcript available'}

**Template (Use as STRUCTURE GUIDE, but PERSONALIZE the content):**
${template.text || template.template}

**CRITICAL INSTRUCTIONS:**
1. **Personalize based on call context** - Reference specific things discussed
2. **Keep it natural and conversational** - Not robotic
3. **Maintain professional tone** - Real estate sales style
4. **Be concise** - ${channel === 'WHATSAPP' ? '2-3 short paragraphs max' : channel === 'SMS' ? '160 chars max' : '150 words max'}
5. **Include CTA** - Clear next step
6. **Use emojis sparingly** - Only for WhatsApp, 2-3 max
`;

        if (channel === 'EMAIL') {
            prompt += `\n7. **Return JSON** with "subject" and "html" fields
8. **HTML should be simple** - Use <p>, <strong>, <ul>, <li> only

Example output:
{
  "subject": "Your {{propertyName}} Visit - Next Steps",
  "html": "<p>Hi {{leadName}},</p><p>Following our conversation about...</p>"
}`;
        } else {
            prompt += `\n7. **Return plain text only** - No JSON, no formatting
8. **For WhatsApp**: Use \\n for line breaks, emojis OK
9. **For SMS**: Ultra concise, no special chars

Example output for WhatsApp:
Hi ${leadName}! 👋

Great speaking with you about...

Would love to show you around. Reply YES to schedule!

Team`;
        }

        return prompt;
    }

    /**
     * Call AI API (OpenRouter)
     */
    private static async callAI(prompt: string): Promise<string> {
        const response = await fetch(`${AI_CONFIG.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
                'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
                'X-Title': AI_CONFIG.appName,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: AI_CONFIG.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a professional real estate sales assistant who writes personalized, contextual follow-up messages.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7, // Creative but not random
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error(`AI API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    /**
     * Parse AI response based on channel
     */
    private static parseAIResponse(aiResponse: string, channel: string): { subject?: string; content: string } {
        if (channel === 'EMAIL') {
            try {
                // Try to parse as JSON
                const cleaned = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                const parsed = JSON.parse(cleaned);
                return {
                    subject: parsed.subject || 'Follow-up from our call',
                    content: parsed.html || parsed.content
                };
            } catch (e) {
                // If parsing fails, treat as plain text
                return {
                    subject: 'Follow-up from our call',
                    content: `<p>${aiResponse.replace(/\n/g, '</p><p>')}</p>`
                };
            }
        } else {
            // WhatsApp/SMS - plain text
            return {
                content: aiResponse.trim()
            };
        }
    }

    /**
     * Get template without AI personalization (fallback)
     */
    private static async getTemplateOnly(context: PersonalizationContext): Promise<{
        subject?: string;
        content: string;
        isPersonalized: boolean;
    }> {
        const template = await this.getTemplate(context.templateId, context.channel);

        // Simple variable replacement
        let content = template.text || template.template;
        let subject = template.subject || '';

        const replacements: Record<string, string> = {
            leadName: context.leadName,
            propertyName: context.propertyData.propertyName,
            bedrooms: context.propertyData.bedrooms || '',
            locality: context.propertyData.locality || '',
            priceFormatted: context.propertyData.priceFormatted || '',
            salesTeamName: context.propertyData.salesTeamName || 'Sales Team'
        };

        Object.entries(replacements).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            content = content.replace(regex, value);
            subject = subject.replace(regex, value);
        });

        return {
            subject: subject || undefined,
            content,
            isPersonalized: false
        };
    }

    /**
     * Load template from file
     */
    private static async getTemplate(templateId: string, channel: string): Promise<any> {
        const filename = channel === 'EMAIL' ? 'email-templates.json' : 'whatsapp-templates.json';
        const templatesPath = path.join(process.cwd(), 'data', filename);
        const content = await fs.readFile(templatesPath, 'utf-8');
        const templates = JSON.parse(content);

        if (!templates[templateId]) {
            throw new Error(`Template '${templateId}' not found in ${filename}`);
        }

        return templates[templateId];
    }
}
