import { NextRequest, NextResponse } from 'next/server';
import { firebasePropertyDb } from '@/lib/firebase-property-db';
import { requireRole } from '@/lib/auth';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authError = await requireRole(request, 'admin');
        if (authError) return authError;

        const { id } = await params;
        const body = await request.json();

        // Get the current request
        const currentRequest = await firebasePropertyDb.getRenderRequestById(id);
        if (!currentRequest) {
            return NextResponse.json(
                { success: false, error: 'Render request not found' },
                { status: 404 }
            );
        }

        // Update the request with the new data
        const updatedRequest = {
            ...currentRequest,
            ...body,
        };

        await firebasePropertyDb.updateRenderRequest(id, updatedRequest);

        return NextResponse.json({
            success: true,
            data: updatedRequest,
        });
    } catch (error) {
        console.error('Error updating render request:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update render request' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authError = await requireRole(request, 'admin');
        if (authError) return authError;

        const { id } = await params;

        // Get the current request to verify it exists
        const currentRequest = await firebasePropertyDb.getRenderRequestById(id);
        
        if (!currentRequest) {
            // Requirement #5: Log all existing IDs for debugging
            const allRequests = await firebasePropertyDb.getAllRenderRequests();
            const allIds = allRequests.map(r => ({ id: r.id, type: typeof r.id }));
            
            console.error('[DELETE API] Render request not found:', {
                requestedId: id,
                requestedIdType: typeof id,
                existingRequestsCount: allRequests.length,
                existingIds: allIds
            });

            return NextResponse.json(
                { 
                    success: false, 
                    error: 'Render request not found',
                    debug: {
                        requestedId: id,
                        requestedIdType: typeof id,
                        existingIds: allIds.map(i => i.id)
                    }
                },
                { status: 404 }
            );
        }

        // Delete the request
        await firebasePropertyDb.deleteRenderRequest(id);

        return NextResponse.json({
            success: true,
            message: 'Render request deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting render request:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete render request' },
            { status: 500 }
        );
    }
}

