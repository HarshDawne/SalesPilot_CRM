import { NextRequest, NextResponse } from 'next/server';
import type { RenderRequest } from '@/types/render';

// Mock storage (shared with request route)
const renderRequests: RenderRequest[] = [];

export async function GET(request: NextRequest) {
    try {
        // In production, add authentication check for admin users

        // Return all requests sorted by priority and date
        const sortedRequests = [...renderRequests].sort((a, b) => {
            const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];

            if (priorityDiff !== 0) return priorityDiff;

            return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
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
