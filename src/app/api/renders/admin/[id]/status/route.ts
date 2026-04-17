import { NextRequest, NextResponse } from 'next/server';
import type { RenderRequest, RenderStatus } from '@/types/render';
import { broadcastSSE } from '@/lib/realtime';

// Mock storage
const renderRequests: RenderRequest[] = [];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const requestIndex = renderRequests.findIndex(r => r.id === id);

    if (requestIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
    }

    const oldStatus = renderRequests[requestIndex].status;
    renderRequests[requestIndex].status = status as RenderStatus;

    // Broadcast status update to user
    broadcastSSE('render-status-update', {
      requestId: id,
      oldStatus,
      newStatus: status,
      propertyId: renderRequests[requestIndex].propertyId,
    });

    // If status is READY, notify the user
    if (status === 'READY') {
      // In production, send email/WhatsApp notification
      console.log(`Notify user: Render ${id} is ready`);
    }

    return NextResponse.json({
      success: true,
      data: renderRequests[requestIndex],
      message: 'Status updated successfully',
    });
  } catch (error) {
    console.error('Error updating status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update status' },
      { status: 500 }
    );
  }
}
