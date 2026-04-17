import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import type { PropertyDocument } from '@/types/property';

// Mock document storage (in production, use Firebase Storage or S3)
const documents: PropertyDocument[] = [];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const towerId = searchParams.get('towerId');
    const unitId = searchParams.get('unitId');

    let filteredDocs = documents.filter(d => d.propertyId === id);

    if (towerId) {
      filteredDocs = filteredDocs.filter(d => d.towerId === towerId);
    }

    if (unitId) {
      filteredDocs = filteredDocs.filter(d => d.unitId === unitId);
    }

    return NextResponse.json({
      success: true,
      data: filteredDocs,
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string;
    const towerId = formData.get('towerId') as string | null;
    const unitId = formData.get('unitId') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // In production, upload to Firebase Storage or S3
    // For now, create a mock document record
    const document: PropertyDocument = {
      id: uuidv4(),
      propertyId: id,
      towerId: towerId || undefined,
      unitId: unitId || undefined,
      name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      category: category as any,
      fileUrl: `/uploads/${file.name}`, // Mock URL
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadedBy: 'current-user', // In production, get from auth
      uploadedAt: new Date().toISOString(),
    };

    documents.push(document);

    return NextResponse.json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}
