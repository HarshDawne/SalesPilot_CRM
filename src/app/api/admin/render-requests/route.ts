import { NextRequest, NextResponse } from 'next/server';
import { firebasePropertyDb } from '@/lib/firebase-property-db';
import { requireRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const authError = await requireRole(request, 'admin');
        if (authError) return authError;

        const requests = await firebasePropertyDb.getAllRenderRequests();
        
        // Sort by createdAt descending
        const sortedRequests = [...requests].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return NextResponse.json({
            success: true,
            data: sortedRequests,
        });
    } catch (error) {
        console.error('Error fetching admin render requests:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch render requests' },
            { status: 500 }
        );
    }
}
