/**
 * AI Service for extracting property details from brochure PDFs
 * Supports multiple AI providers with fallback to mock data
 */

import { BrochureExtractedData } from '@/types/brochure-extraction';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Extract property details from a brochure PDF using AI
 * @param pdfContent - Buffer or base64 string of the PDF
 * @param fileName - Original filename for context
 * @returns Extracted property data
 */
export async function extractFromBrochure(
  pdfContent: Buffer | string,
  fileName: string = 'brochure.pdf'
): Promise<BrochureExtractedData> {
  
  // Try Gemini AI first if API key is available
  if (GEMINI_API_KEY) {
    try {
      return await extractWithGemini(pdfContent, fileName);
    } catch (error) {
      console.error('Gemini extraction failed:', error);
      // Fall through to other methods
    }
  }

  // Try OpenAI if available
  if (OPENAI_API_KEY) {
    try {
      return await extractWithOpenAI(pdfContent, fileName);
    } catch (error) {
      console.error('OpenAI extraction failed:', error);
    }
  }

  // Fallback to mock extraction for development
  console.warn('No AI API key configured. Using mock extraction for development.');
  return mockExtraction(fileName);
}

/**
 * Extract using Google Gemini AI
 */
async function extractWithGemini(
  pdfContent: Buffer | string,
  fileName: string
): Promise<BrochureExtractedData> {
  
  const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  
  // Convert PDF to base64 if it's a Buffer
  const base64Content = Buffer.isBuffer(pdfContent) 
    ? pdfContent.toString('base64')
    : pdfContent;

  const prompt = buildExtractionPrompt();

  const requestBody = {
    contents: [{
      parts: [
        { text: prompt },
        {
          inline_data: {
            mime_type: 'application/pdf',
            data: base64Content
          }
        }
      ]
    }],
    generationConfig: {
      temperature: 0.1, // Low temperature for factual extraction
      responseMimeType: 'application/json'
    }
  };

  const response = await fetch(`${apiUrl}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const result = await response.json();
  
  // Extract the JSON from Gemini's response
  const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!generatedText) {
    throw new Error('No content in Gemini response');
  }

  // Parse the JSON response
  let extractedData: BrochureExtractedData;
  try {
    extractedData = JSON.parse(generatedText);
  } catch (e) {
    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = generatedText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      extractedData = JSON.parse(jsonMatch[1]);
    } else {
      throw new Error('Failed to parse Gemini response as JSON');
    }
  }

  return sanitizeExtractedData(extractedData);
}

/**
 * Extract using OpenAI GPT-4 Vision
 */
async function extractWithOpenAI(
  pdfContent: Buffer | string,
  fileName: string
): Promise<BrochureExtractedData> {
  
  // OpenAI doesn't directly support PDF, would need conversion to images
  // This is a placeholder for future implementation
  throw new Error('OpenAI extraction not yet implemented. Use Gemini or add implementation.');
}

/**
 * Build the prompt for AI extraction
 */
function buildExtractionPrompt(): string {
  return `You are a real estate data extraction assistant. Extract property details from this project brochure PDF.

Return ONLY a valid JSON object with these fields (all fields are optional - only include if clearly stated in the brochure):

{
  "name": "Full project name",
  "developerName": "Developer company name",
  "tagline": "Marketing tagline or slogan",
  "description": "Brief project description (1-2 sentences)",
  "projectType": "RESIDENTIAL | COMMERCIAL | MIXED_USE",
  "status": "ACTIVE | UNDER_CONSTRUCTION | COMPLETED | ON_HOLD",
  "city": "City name",
  "locality": "Area or locality name",
  "pincode": "6-digit pincode",
  "fullAddress": "Complete address",
  "landmark": "Nearby landmark if mentioned",
  "googleMapsUrl": "Google Maps URL if present",
  "reraId": "RERA registration number",
  "reraUrl": "RERA website URL if present",
  "expectedCompletion": "Completion date in YYYY-MM-DD or YYYY-MM format",
  "launchDate": "Launch date in YYYY-MM-DD format",
  "possessionFrom": "Possession date in YYYY-MM-DD format",
  "totalTowers": (number) Total number of towers/buildings,
  "totalUnits": (number) Total number of units/apartments,
  "minBedrooms": (number) Minimum bedrooms (e.g., 2 for 2 BHK),
  "maxBedrooms": (number) Maximum bedrooms (e.g., 4 for 4 BHK),
  "minAreaSqft": (number) Minimum area in square feet,
  "maxAreaSqft": (number) Maximum area in square feet,
  "startingPrice": (number) Starting price in rupees (no commas, just number),
  "pricePerSqftFrom": (number) Price per sqft from (in rupees),
  "pricePerSqftTo": (number) Price per sqft to (in rupees),
  "bookingAmount": (number) Token/booking amount in rupees,
  "paymentPlanType": "CONSTRUCTION_LINKED | TIME_LINKED | DOWN_PAYMENT | FLEXI | OTHER",
  "amenities": ["Gym", "Swimming Pool", "Club House", ...],
  "highlights": ["Near Metro", "Sea Facing", "Premium Location", ...],
  "unitMix": [
    {
      "bhkType": "2 BHK",
      "areaRange": "750-900 sq.ft",
      "tower": "A, B",
      "count": 80
    }
  ]
}

IMPORTANT RULES:
1. Return ONLY the JSON object, no other text
2. If a field is not found or unclear, omit it entirely (don't use null or empty strings)
3. For prices and numbers, extract only numeric values without currency symbols or commas
4. For dates, use YYYY-MM-DD format when day is available, otherwise YYYY-MM
5. Extract amenities and highlights as arrays of strings
6. Be precise - only include information that is explicitly stated in the brochure

Now extract the data from the provided PDF brochure.`;
}

/**
 * Sanitize and validate extracted data
 */
function sanitizeExtractedData(data: any): BrochureExtractedData {
  const sanitized: BrochureExtractedData = {};

  // Copy over valid fields
  if (typeof data.name === 'string' && data.name.trim()) {
    sanitized.name = data.name.trim();
  }
  
  if (typeof data.developerName === 'string' && data.developerName.trim()) {
    sanitized.developerName = data.developerName.trim();
  }

  if (typeof data.tagline === 'string' && data.tagline.trim()) {
    sanitized.tagline = data.tagline.trim();
  }

  if (typeof data.description === 'string' && data.description.trim()) {
    sanitized.description = data.description.trim();
  }

  // Enums with validation
  if (['RESIDENTIAL', 'COMMERCIAL', 'MIXED_USE'].includes(data.projectType)) {
    sanitized.projectType = data.projectType;
  }

  if (['ACTIVE', 'UNDER_CONSTRUCTION', 'COMPLETED', 'ON_HOLD'].includes(data.status)) {
    sanitized.status = data.status;
  }

  // Location fields
  if (typeof data.city === 'string' && data.city.trim()) {
    sanitized.city = data.city.trim();
  }

  if (typeof data.locality === 'string' && data.locality.trim()) {
    sanitized.locality = data.locality.trim();
  }

  if (typeof data.pincode === 'string' && data.pincode.trim()) {
    sanitized.pincode = data.pincode.trim();
  }

  if (typeof data.fullAddress === 'string' && data.fullAddress.trim()) {
    sanitized.fullAddress = data.fullAddress.trim();
  }

  if (typeof data.landmark === 'string' && data.landmark.trim()) {
    sanitized.landmark = data.landmark.trim();
  }

  if (typeof data.googleMapsUrl === 'string' && data.googleMapsUrl.trim()) {
    sanitized.googleMapsUrl = data.googleMapsUrl.trim();
  }

  // Regulatory
  if (typeof data.reraId === 'string' && data.reraId.trim()) {
    sanitized.reraId = data.reraId.trim();
  }

  if (typeof data.reraUrl === 'string' && data.reraUrl.trim()) {
    sanitized.reraUrl = data.reraUrl.trim();
  }

  // Dates
  if (typeof data.expectedCompletion === 'string' && data.expectedCompletion.trim()) {
    sanitized.expectedCompletion = data.expectedCompletion.trim();
  }

  if (typeof data.launchDate === 'string' && data.launchDate.trim()) {
    sanitized.launchDate = data.launchDate.trim();
  }

  if (typeof data.possessionFrom === 'string' && data.possessionFrom.trim()) {
    sanitized.possessionFrom = data.possessionFrom.trim();
  }

  // Numbers
  if (typeof data.totalTowers === 'number' && data.totalTowers > 0) {
    sanitized.totalTowers = Math.floor(data.totalTowers);
  }

  if (typeof data.totalUnits === 'number' && data.totalUnits >= 0) {
    sanitized.totalUnits = Math.floor(data.totalUnits);
  }

  if (typeof data.minBedrooms === 'number' && data.minBedrooms > 0) {
    sanitized.minBedrooms = Math.floor(data.minBedrooms);
  }

  if (typeof data.maxBedrooms === 'number' && data.maxBedrooms > 0) {
    sanitized.maxBedrooms = Math.floor(data.maxBedrooms);
  }

  if (typeof data.minAreaSqft === 'number' && data.minAreaSqft > 0) {
    sanitized.minAreaSqft = data.minAreaSqft;
  }

  if (typeof data.maxAreaSqft === 'number' && data.maxAreaSqft > 0) {
    sanitized.maxAreaSqft = data.maxAreaSqft;
  }

  if (typeof data.startingPrice === 'number' && data.startingPrice > 0) {
    sanitized.startingPrice = data.startingPrice;
  }

  if (typeof data.pricePerSqftFrom === 'number' && data.pricePerSqftFrom > 0) {
    sanitized.pricePerSqftFrom = data.pricePerSqftFrom;
  }

  if (typeof data.pricePerSqftTo === 'number' && data.pricePerSqftTo > 0) {
    sanitized.pricePerSqftTo = data.pricePerSqftTo;
  }

  if (typeof data.bookingAmount === 'number' && data.bookingAmount > 0) {
    sanitized.bookingAmount = data.bookingAmount;
  }

  // Payment plan type
  if (['CONSTRUCTION_LINKED', 'TIME_LINKED', 'DOWN_PAYMENT', 'FLEXI', 'OTHER'].includes(data.paymentPlanType)) {
    sanitized.paymentPlanType = data.paymentPlanType;
  }

  // Arrays
  if (Array.isArray(data.amenities)) {
    sanitized.amenities = data.amenities
      .filter((a: any) => typeof a === 'string' && a.trim())
      .map((a: string) => a.trim());
  }

  if (Array.isArray(data.highlights)) {
    sanitized.highlights = data.highlights
      .filter((h: any) => typeof h === 'string' && h.trim())
      .map((h: string) => h.trim());
  }

  if (Array.isArray(data.unitMix)) {
    sanitized.unitMix = data.unitMix.filter((u: any) => u && typeof u === 'object');
  }

  return sanitized;
}

/**
 * Mock extraction for development/testing when no AI API is available
 */
function mockExtraction(fileName: string): BrochureExtractedData {
  const randomCity = ['Mumbai', 'Pune', 'Bangalore', 'Delhi', 'Hyderabad'][Math.floor(Math.random() * 5)];
  
  return {
    name: `${fileName.replace('.pdf', '')} Premium Residences`,
    developerName: 'Sample Developers Ltd.',
    tagline: 'Luxury Living Redefined',
    description: 'A premium residential project offering world-class amenities and modern living spaces in a prime location.',
    projectType: 'RESIDENTIAL',
    status: 'UNDER_CONSTRUCTION',
    city: randomCity,
    locality: 'Premium Locality',
    pincode: '400001',
    fullAddress: '123 Main Street, Premium Locality',
    reraId: 'P51800000001',
    expectedCompletion: '2026-12-31',
    launchDate: '2024-01-15',
    totalTowers: 3,
    totalUnits: 240,
    minBedrooms: 2,
    maxBedrooms: 4,
    minAreaSqft: 850,
    maxAreaSqft: 2200,
    startingPrice: 8500000,
    pricePerSqftFrom: 8500,
    pricePerSqftTo: 12000,
    bookingAmount: 500000,
    paymentPlanType: 'CONSTRUCTION_LINKED',
    amenities: [
      'Swimming Pool',
      'Gymnasium',
      'Club House',
      'Children\'s Play Area',
      'Landscaped Gardens',
      '24/7 Security',
      'Power Backup',
      'Covered Parking'
    ],
    highlights: [
      '5 minutes from Metro Station',
      'Close to Schools and Hospitals',
      'Premium Location',
      'Vastu Compliant',
      'Earthquake Resistant Structure'
    ],
    unitMix: [
      {
        bhkType: '2 BHK',
        areaRange: '850-1050 sq.ft',
        tower: 'A, B',
        count: 120
      },
      {
        bhkType: '3 BHK',
        areaRange: '1200-1500 sq.ft',
        tower: 'B, C',
        count: 90
      },
      {
        bhkType: '4 BHK',
        areaRange: '1800-2200 sq.ft',
        tower: 'C',
        count: 30
      }
    ]
  };
}
