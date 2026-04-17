import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    // Standardized Response Structure
    let finalResponse = {
        success: true,
        extractedFields: {
            projectName: null as string | null,
            developerName: null as string | null,
            projectType: null as string | null,
            location: null as string | null,
            reraNumber: null as string | null,
            startingPrice: null as string | null,
            towers: null as string | null,
            amenities: [] as string[]
        },
        extractedText: '',
        warning: undefined as string | undefined
    };

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            finalResponse.warning = 'No file uploaded.';
            return NextResponse.json(finalResponse);
        }

        console.log(`[AI-Extract] Processing: ${file.name} (${file.type})`);

        // 1. Text Extraction (Safe Dynamic Imports)
        let rawText = '';
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = (file.name || '').toLowerCase();

        try {
            if (fileName.endsWith('.pdf')) {
                const pdf = require('pdf-parse');
                const data = await pdf(buffer);
                rawText = data.text;
            } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
                const mammoth = require('mammoth');
                const result = await mammoth.extractRawText({ buffer });
                rawText = result.value;
            } else {
                // Fallback for .txt 
                rawText = buffer.toString('utf-8');
            }
        } catch (err) {
            console.error('Text parsing failed:', err);
            finalResponse.warning = 'Could not read text from this file.';
            return NextResponse.json(finalResponse);
        }

        // Clean Text & Limit Length for AI Context Window
        rawText = rawText.replace(/\s+/g, ' ').trim();
        finalResponse.extractedText = rawText.slice(0, 2000); // Return snippet

        if (!rawText || rawText.length < 50) {
            finalResponse.warning = 'File appears to be empty or contains no readable text.';
            return NextResponse.json(finalResponse);
        }

        // 2. AI Extraction (Hugging Face)
        const HF_API_KEY = process.env.HF_API_KEY;
        const MODEL_ID = "mistralai/Mistral-7B-Instruct-v0.3";

        let aiSuccess = false;

        if (HF_API_KEY) {
            try {
                // Construct Prompt
                // Mistral/Llama instruct format
                const promptText = `
                [INST] You are a specialized real estate data assistant. 
                Extract the following project details from the brochure text below.

                Format the output strictly as a JSON object. Do not include markdown formatting or explanations.
                If a field is not found, set it to null.

                Fields to extract:
                - projectName: Name of the real estate project
                - developerName: Name of the builder or developer
                - projectType: "Residential", "Commercial", or "Mixed Use"
                - location: City or specific locality
                - reraNumber: The RERA registration ID (usually starts with P)
                - startingPrice: The starting price (e.g., "1.5 Cr", "50 Lakhs")
                - towers: Number of towers (as a string or number)
                - amenities: Array of key amenities found

                Brochure Text:
                "${rawText.slice(0, 15000).replace(/"/g, '\"')}"
                [/INST]
                `;

                const response = await fetch(`https://api-inference.huggingface.co/models/${MODEL_ID}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${HF_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        inputs: promptText,
                        options: { wait_for_model: true }
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    // HF Inference often returns an array: [{ generated_text: "..." }]
                    // Or just the text depending on the task. Mistral Instruct usually completes the prompt.

                    let generated = '';
                    if (Array.isArray(result) && result[0]?.generated_text) {
                        generated = result[0].generated_text;
                    } else if (typeof result === 'object' && result?.generated_text) {
                        generated = result.generated_text;
                    }

                    // Extract JSON from the predicted text (it might contain the prompt too)
                    // We look for the JSON block after [/INST] if possible, or just the first { } structure
                    const jsonMatch = generated.match(/\{[\s\S]*\}/);

                    if (jsonMatch) {
                        const jsonStr = jsonMatch[0];
                        try {
                            const parsed = JSON.parse(jsonStr);

                            // Merge into extractedFields
                            finalResponse.extractedFields = {
                                ...finalResponse.extractedFields,
                                ...parsed
                            };
                            aiSuccess = true;
                        } catch (parseErr) {
                            console.warn("AI JSON parse failed:", parseErr);
                            // Proceed to regex fallback if AI output was garbage
                        }
                    }
                } else {
                    console.warn(`HF API Error: ${response.status} ${response.statusText}`);
                    finalResponse.warning = "AI service is busy or unreachable. Attempting manual extraction.";
                }

            } catch (aiError) {
                console.error("AI Request Failed:", aiError);
                finalResponse.warning = "AI connectivity issue. Using basic extraction.";
            }
        } else {
            finalResponse.warning = "AI capability is disabled (missing API key). Using basic text scan.";
        }


        // 3. Fallback / Safety Net (Regex)
        // Even if AI works, sometimes it misses the strict format of RERA or Price. 
        // We'll trust AI first, but if fields are null, we try regex.

        const ef = finalResponse.extractedFields;
        const searchCtx = rawText.slice(0, 3000);

        if (!ef.reraNumber) {
            const reraMatch = searchCtx.match(/\b(P\d{11})\b/i);
            if (reraMatch) ef.reraNumber = reraMatch[1];
        }

        if (!ef.startingPrice) {
            const priceMatch = searchCtx.match(/(?:₹|Rs\.?|INR)\s*(\d+(?:\.\d+)?)\s*(Cr|Crore|L|Lakh)s?/i);
            if (priceMatch) ef.startingPrice = `${priceMatch[1]} ${priceMatch[2]}`;
        }

        if (!ef.towers) {
            const towerMatch = searchCtx.match(/(\d+)\s*(?:Towers|Buildings|Wings)/i);
            if (towerMatch) ef.towers = towerMatch[1];
        }

        // Final Polish of fields
        if (ef.projectType) {
            ef.projectType = ef.projectType.toUpperCase().includes('COMMERCIAL') ? 'COMMERCIAL' : 'RESIDENTIAL';
        } else if (searchCtx.match(/\b(Commercial|Office|Shop)\b/i)) {
            ef.projectType = 'COMMERCIAL';
        } else {
            ef.projectType = 'RESIDENTIAL';
        }

        return NextResponse.json(finalResponse);

    } catch (error) {
        console.error('SERVER ERROR:', error);
        // CRITICAL: Always return 200
        return NextResponse.json({
            success: true,
            extractedFields: {},
            extractedText: '',
            warning: 'Internal processing error. Please fill manually.'
        });
    }
}
