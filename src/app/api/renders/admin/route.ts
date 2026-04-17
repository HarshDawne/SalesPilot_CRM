import { NextRequest, NextResponse } from 'next/server';
import type { RenderRequest } from '@/types/render';
import { firebasePropertyDb } from '@/lib/firebase-property-db';

// Mock storage (shared with request route)
const renderRequests: RenderRequest[] = [];

export async function GET(request: NextRequest) {
    try {
        // In production, add authentication check for admin users

        // Return all requests sorted by priority and date
        // Return all requests sorted by date
        const requests = await firebasePropertyDb.getAllRenderRequests();
        const sortedRequests = [...requests].sort((a, b) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        return NextResponse.json({
            success: true,
            data: sortedRequests,
        });
    } catch (error) {
        console.error('Error fetching admin requests:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch requests' },
            { status: 500 }
        );
    }
}
