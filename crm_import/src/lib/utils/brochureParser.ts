import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source for PDF.js
// Using a CDN because setting up the worker locally in Next.js without specific config can be tricky
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface BrochureParseResult {
    success: boolean;
    data: ParsedData;
    confidence: number;
    text?: string;
}

export interface ParsedData {
    projectName?: string;
    developerName?: string;
    projectType?: string;
    city?: string;
    microMarket?: string;
    fullAddress?: string;
    reraRegistration?: string;
    configMix?: string;
    startingPrice?: number;
    launchDate?: string;
    possessionDate?: string;
    status?: string;
    [key: string]: any;
}

export const parseBrochure = async (file: File): Promise<BrochureParseResult> => {
    try {
        let text = '';
        if (file.type === 'application/pdf') {
            text = await extractTextFromPDF(file);
        } else if (file.type.startsWith('image/')) {
            text = await extractTextFromImage(file);
        } else {
            throw new Error('Unsupported file type');
        }

        const data = extractDetailsFromText(text);
        return {
            success: true,
            data,
            confidence: calculateConfidence(data),
            text: text.substring(0, 500) // Preview
        };
    } catch (error) {
        console.error('Brochure parsing failed:', error);
        throw error;
    }
};

const extractTextFromImage = async (file: File): Promise<string> => {
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(file);
    await worker.terminate();
    return text;
};

const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    // Limit to first 3 pages to save time/memory, usually info is on the first few pages
    const maxPages = Math.min(pdf.numPages, 3);

    // Create a worker for OCR
    const worker = await createWorker('eng');

    for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport } as any).promise;

        // OCR this page
        const { data: { text } } = await worker.recognize(canvas);
        fullText += text + '\n';
    }

    await worker.terminate();
    return fullText;
};

const extractDetailsFromText = (text: string): ParsedData => {
    const data: ParsedData = {};
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // Helper regex
    const findMatch = (pattern: RegExp) => {
        const match = text.match(pattern);
        return match ? match[1] || match[0] : undefined;
    };

    // 1. RERA
    const reraMatch = text.match(/P\d{11}|PR\/[A-Z0-9]+\/\d{6}\/\d{6}/i); // Basic patterns
    if (reraMatch) data.reraRegistration = reraMatch[0];

    // 2. Configurations (1 BHK, 2 BHK etc)
    const configs = text.match(/\b\d(\.5)?\s?BHK\b|\bStudio\b|\bVilla\b/gi);
    if (configs) {
        // Unique configs
        data.configMix = Array.from(new Set(configs.map(c => c.toUpperCase()))).join(', ');
    }

    // 3. Project Type
    if (/commercial|office|retail|shop/i.test(text)) data.projectType = 'COMMERCIAL';
    else if (/villa|plot|bungalow/i.test(text)) data.projectType = 'RESIDENTIAL'; // Defaulting to residential if not commercial, but specific keywords help
    else data.projectType = 'RESIDENTIAL';

    // 4. Price
    // Look for patterns like "Starts Rs 50 L", "₹1.5 Cr", "45 Lakhs"
    const priceMatch = text.match(/(?:Rs\.?|₹)\s?(\d+(?:\.\d+)?)\s?(Lakhs?|Cr|Crores?)/i);
    if (priceMatch) {
        const amount = parseFloat(priceMatch[1]);
        const unit = priceMatch[2].toLowerCase();

        if (unit.startsWith('cr')) {
            data.startingPrice = amount * 10000000;
        } else if (unit.startsWith('lakh')) {
            data.startingPrice = amount * 100000;
        }
    }

    // 5. Developer Name (Heuristic: "Developed by X", "X Group")
    // This is hard. We'll look for "Developed by" or "Builder"
    const devMatch = text.match(/(?:Developed by|Builder|Promoter)[:\s]+([A-Z\s&]+)(?:\n|$)/i);
    if (devMatch) {
        data.developerName = devMatch[1].trim();
    }

    // 6. Project Status
    if (/Ready to move/i.test(text) || /OC Received/i.test(text)) data.status = 'COMPLETED';
    else if (/Under construction/i.test(text) || /Possession soon/i.test(text)) data.status = 'UNDER_CONSTRUCTION';
    else if (/Pre-launch/i.test(text) || /Coming soon/i.test(text)) data.status = 'PLANNING';

    // 7. Dates
    // Possession Date: "Possession: Dec 2025"
    const possessionMatch = text.match(/Possession(?: by)?:?\s?([A-Za-z]+\s\d{4})/i);
    if (possessionMatch) {
        // Convert "Dec 2025" to YYYY-MM-DD
        const d = new Date(possessionMatch[1]);
        if (!isNaN(d.getTime())) {
            data.possessionDate = d.toISOString().split('T')[0];
        }
    }

    // 8. Location/City
    // Very hard without a list of cities. We'll try to find "Mumbai", "Pune", "Bangalore", "Delhi" etc.
    const majorCities = ['Mumbai', 'Pune', 'Bangalore', 'Bengaluru', 'Delhi', 'Gurgaon', 'Noida', 'Hyderabad', 'Chennai', 'Kolkata', 'Ahmedabad'];
    for (const city of majorCities) {
        if (new RegExp(`\\b${city}\\b`, 'i').test(text)) {
            data.city = city;
            break;
        }
    }

    // 9. Project Name
    // Heuristic: The largest text on the first page usually.
    // Tesseract doesn't give font size easily in the simple text output. 
    // We will assume the first non-empty line that isn't a common keyword is the Name.
    // Or we skip this as it's often the filename.
    // Let's try to grab the first significant line.
    for (const line of lines.slice(0, 5)) {
        if (line.length > 5 && !line.match(/brochure|project|residency|heights|building/i)) { // Weak check
            // data.projectName = line; // Too risky, might be "Welcome to"
            // break;
        }
    }

    // Better heuristic for Name: "X Residences", "X Heights", "The X"
    const nameMatch = text.match(/([A-Z][a-z]+ (?:Residences|Heights|Towers|City|Park|Gardens|Enclave|Villas))/);
    if (nameMatch) {
        data.projectName = nameMatch[1];
    }

    return data;
};

const calculateConfidence = (data: ParsedData): number => {
    let score = 0;
    let total = 0;

    const fields = ['projectName', 'developerName', 'city', 'configMix', 'startingPrice', 'reraRegistration', 'status'];
    fields.forEach(f => {
        total++;
        if (data[f]) score++;
    });

    return total === 0 ? 0 : score / total;
};
