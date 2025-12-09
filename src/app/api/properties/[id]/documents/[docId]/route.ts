import { NextRequest, NextResponse } from 'next/server';

// Mock document storage
const documents: any[] = [];

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string; docId: string } }
) {
    try {
        const index = documents.findIndex(d => d.id === params.docId);

        if (index === -1) {
            return NextResponse.json(
                { success: false, error: 'Document not found' },
                { status: 404 }
            );
        }

        // In production, delete from Firebase Storage or S3
        documents.splice(index, 1);

        return NextResponse.json({
            success: true,
            message: 'Document deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting document:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete document' },
            { status: 500 }
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string; docId: string } }
) {
    try {
        const document = documents.find(d => d.id === params.docId);

        if (!document) {
            return NextResponse.json(
                { success: false, error: 'Document not found' },
                { status: 404 }
            );
        }

        // In production, generate signed URL for download
        return NextResponse.json({
            success: true,
            data: document,
        });
    } catch (error) {
        console.error('Error fetching document:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch document' },
            { status: 500 }
        );
    }
}
