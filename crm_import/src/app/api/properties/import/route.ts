import { NextRequest, NextResponse } from 'next/server';
import { extractFromBrochure } from '@/lib/ai-extraction';
import { BrochureExtractedData, BrochureImportResponse } from '@/types/brochure-extraction';
import { v4 as uuidv4 } from 'uuid';

// In-memory cache for extracted data (expires after 1 hour)
// In production, use Redis or database for persistence
const extractionCache = new Map<string, { data: BrochureExtractedData; expiresAt: number }>();

// Cleanup expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of extractionCache.entries()) {
    if (entry.expiresAt < now) {
      extractionCache.delete(id);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes

/**
 * POST /api/properties/import
 * Upload a brochure PDF and extract property details using AI
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' } as BrochureImportResponse,
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'Only PDF files are supported' } as BrochureImportResponse,
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' } as BrochureImportResponse,
        { status: 413 }
      );
    }

    // Read file content as Buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    console.log(`📄 Processing brochure: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    // Extract data using AI
    let extractedData: BrochureExtractedData;
    try {
      extractedData = await extractFromBrochure(fileBuffer, file.name);
      console.log('✅ Extraction successful:', Object.keys(extractedData).length, 'fields extracted');
    } catch (error) {
      console.error('❌ AI extraction failed:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to extract data from brochure. Please try again or fill the form manually.',
        } as BrochureImportResponse,
        { status: 500 }
      );
    }

    // Generate extraction ID and cache the data
    const extractionId = uuidv4();
    const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour from now

    extractionCache.set(extractionId, {
      data: extractedData,
      expiresAt
    });

    // Build warnings if extraction is partial
    const warnings: string[] = [];
    const requiredFields = ['name', 'developerName', 'city', 'locality', 'reraId', 'expectedCompletion', 'launchDate'];
    const missingFields = requiredFields.filter(field => !extractedData[field as keyof BrochureExtractedData]);
    
    if (missingFields.length > 0) {
      warnings.push(`Some required fields could not be extracted: ${missingFields.join(', ')}. Please fill them manually.`);
    }

    return NextResponse.json({
      success: true,
      data: extractedData,
      extractionId,
      warnings: warnings.length > 0 ? warnings : undefined
    } as BrochureImportResponse);

  } catch (error) {
    console.error('Error in brochure import:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while processing the brochure',
      } as BrochureImportResponse,
      { status: 500 }
    );
  }
}

/**
 * GET /api/properties/import?extractionId=xxx
 * Retrieve cached extraction data by ID
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const extractionId = searchParams.get('extractionId');

    if (!extractionId) {
      return NextResponse.json(
        { success: false, error: 'extractionId parameter is required' },
        { status: 400 }
      );
    }

    const cached = extractionCache.get(extractionId);

    if (!cached) {
      return NextResponse.json(
        { success: false, error: 'Extraction not found or expired. Please upload the brochure again.' },
        { status: 404 }
      );
    }

    // Check if expired
    if (cached.expiresAt < Date.now()) {
      extractionCache.delete(extractionId);
      return NextResponse.json(
        { success: false, error: 'Extraction has expired. Please upload the brochure again.' },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      data: cached.data,
      extractionId
    } as BrochureImportResponse);

  } catch (error) {
    console.error('Error retrieving extraction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve extraction data' },
      { status: 500 }
    );
  }
}
