import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import type { RenderRequest } from '@/types/render';
import { addTimelineEvent } from '@/lib/timeline';
import { broadcastSSE } from '@/lib/realtime';

// Mock storage (in production, use database)
const renderRequests: RenderRequest[] = [];

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { propertyId, unitId, renderType, description, specifications, requestedByName } = body;

        if (!propertyId || !renderType) {
            return NextResponse.json(
                { success: false, error: 'Property ID and render type are required' },
                { status: 400 }
            );
        }

        const renderRequest: RenderRequest = {
            id: uuidv4(),
            propertyId,
            unitId,
            requestedBy: 'current-user-id', // In production, get from auth
            requestedByName: requestedByName || 'User',
            renderType,
            description,
            specifications,
            status: 'REQUESTED',
            requestedAt: new Date().toISOString(),
            priority: 'MEDIUM',
            renders: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        renderRequests.push(renderRequest);

        // Create timeline event if there's a lead associated
        // In production, you'd link this to the actual lead

        // Broadcast notification to admins
        broadcastSSE('render-request', {
            requestId: renderRequest.id,
            status: 'REQUESTED',
            propertyId,
            renderType,
        });

        return NextResponse.json({
            success: true,
            data: renderRequest,
            message: 'Render request submitted successfully',
        });
    } catch (error) {
        console.error('Error creating render request:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create render request' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const propertyId = searchParams.get('propertyId');

        let filteredRequests = renderRequests;

        if (userId) {
            filteredRequests = filteredRequests.filter(r => r.requestedBy === userId);
        }

        if (propertyId) {
            filteredRequests = filteredRequests.filter(r => r.propertyId === propertyId);
        }

        return NextResponse.json({
            success: true,
            data: filteredRequests,
        });
    } catch (error) {
        console.error('Error fetching render requests:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch render requests' },
            { status: 500 }
        );
    }
}
