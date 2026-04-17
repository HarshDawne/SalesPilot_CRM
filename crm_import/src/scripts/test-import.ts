import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

// MOCK: Set your API key here for testing or use env var
const API_KEY = process.env.GEMINI_API_KEY || '';

async function testImport(filePath: string) {
    if (!API_KEY) {
        console.error('❌ Please set GEMINI_API_KEY environment variable.');
        return;
    }

    console.log(`📄 Processing: ${filePath}`);
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();

    let rawText = '';

    if (ext === '.pdf') {
        const data = await pdf(fileBuffer);
        rawText = data.text;
    } else if (ext === '.docx') {
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        rawText = result.value;
    } else {
        console.error('❌ Unsupported file type');
        return;
    }

    console.log(`✅ Text Extracted (${rawText.length} chars)`);
    if (rawText.length < 100) {
        console.warn('⚠️ Warning: Short text extracted.');
        console.log(rawText);
    }

    // AI Extraction
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    const prompt = `
      You are an expert real estate data analyst. Extract key project details from the following brochure text into a JSON object.
      
      Brochure Text:
      """
      ${rawText.slice(0, 10000)}
      """

      Return a JSON object with this exact structure:
      {
        "name": "Project Name",
        "developer": "Developer Name",
        "status": "PLANNING | UNDER_CONSTRUCTION | ACTIVE | COMPLETED",
        "city": "City Name",
        "locality": "Micro-market",
        "address": "Full address",
        "reraId": "RERA Registration Number",
        "launchDate": "YYYY-MM-DD",
        "expectedCompletion": "YYYY-MM-DD",
        "towersCount": Number,
        "totalUnits": Number,
        "pricing": {
          "startingPrice": Number
        }
      }
    `;

    console.log('🤖 Sending to Gemini...');
    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        console.log('✅ AI Response Received');

        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(jsonStr);
        console.log('DATA:', JSON.stringify(data, null, 2));

    } catch (e) {
        console.error('❌ AI Extraction Failed:', e);
    }
}

// Run with a sample file
const samplePath = process.argv[2];
if (samplePath) {
    testImport(samplePath);
} else {
    console.log('Usage: ts-node src/scripts/test-import.ts <path-to-pdf-or-docx>');
}
