import { NextRequest, NextResponse } from 'next/server';
import { firebasePropertyDb } from '@/lib/firebase-property-db';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        
        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Request ID is required' },
                { status: 400 }
            );
        }

        const success = await firebasePropertyDb.deleteRenderRequest(id);

        if (success) {
            return NextResponse.json({
                success: true,
                message: 'Render request deleted successfully'
            });
        } else {
            return NextResponse.json(
                { success: false, error: 'Failed to delete render request' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error deleting render request:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
