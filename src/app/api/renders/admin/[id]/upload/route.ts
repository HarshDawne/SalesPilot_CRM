import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import type { RenderRequest, Render3D } from '@/types/render';
import { broadcastSSE } from '@/lib/realtime';

// Mock storage
const renderRequests: RenderRequest[] = [];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    const requestIndex = renderRequests.findIndex(r => r.id === id);

    if (requestIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
    }

    // In production, upload to Firebase Storage or S3
    const render: Render3D = {
      id: uuidv4(),
      requestId: id,
      name: file.name,
      fileUrl: `/uploads/renders/${file.name}`, // Mock URL
      fileSize: file.size,
      resolution: '1920x1080', // In production, extract from file
      format: file.type.split('/')[1],
      uploadedBy: 'admin-user', // In production, get from auth
      uploadedAt: new Date().toISOString(),
      version: renderRequests[requestIndex].renders.length + 1,
      isLatest: true,
    };

    // Mark previous renders as not latest
    (renderRequests[requestIndex].renders as any[]).forEach(r => { if (r.isLatest) r.isLatest = false; });

    // Add new render
    (renderRequests[requestIndex].renders as any[]).push(render);

    // Auto-update status to READY if not already
    if (renderRequests[requestIndex].status === 'IN_PROGRESS') {
      (renderRequests[requestIndex] as any).status = 'COMPLETED';
    }

    // Broadcast to user
    broadcastSSE('render-uploaded', {
      requestId: id,
      renderId: render.id,
      propertyId: renderRequests[requestIndex].propertyId,
    });

    // Notify user that render is ready
    console.log(`Notify user: New render uploaded for request ${id}`);

    return NextResponse.json({
      success: true,
      data: render,
      message: 'Render uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading render:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload render' },
      { status: 500 }
    );
  }
}
