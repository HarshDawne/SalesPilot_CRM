import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import type { RenderRequest } from '@/types/render';
import { firebasePropertyDb } from '@/lib/firebase-property-db';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            sourceType,
            propertyId,
            towerId,
            unitId,
            contactDetails,
            propertyName,
            builderName,
            requestedRenderTypes,
            instructions,
            mediaUrls
        } = body;

        // Global required fields
        if (!sourceType || !propertyName || !builderName || !contactDetails || !requestedRenderTypes || requestedRenderTypes.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Missing required base fields' },
                { status: 400 }
            );
        }

        // Strict Source Type Validation
        if (sourceType === 'UNIT') {
            if (!propertyId || !towerId || !unitId) {
                return NextResponse.json(
                    { success: false, error: 'UNIT requests must include propertyId, towerId, and unitId' },
                    { status: 400 }
                );
            }
        } else if (sourceType === 'PROPERTY') {
            if (!propertyId) {
                return NextResponse.json(
                    { success: false, error: 'PROPERTY requests must include propertyId' },
                    { status: 400 }
                );
            }
            if (towerId || unitId) {
                return NextResponse.json(
                    { success: false, error: 'PROPERTY requests cannot include towerId or unitId' },
                    { status: 400 }
                );
            }
        } else if (sourceType === 'TOWER') {
            if (!propertyId || !towerId) {
                return NextResponse.json(
                    { success: false, error: 'TOWER requests must include propertyId and towerId' },
                    { status: 400 }
                );
            }
            if (unitId) {
                return NextResponse.json(
                    { success: false, error: 'TOWER requests cannot include unitId' },
                    { status: 400 }
                );
            }
        } else {
            return NextResponse.json(
                { success: false, error: 'Invalid sourceType' },
                { status: 400 }
            );
        }

        const renderRequest: RenderRequest = {
            id: uuidv4(),
            sourceType,
            propertyId,
            towerId,
            unitId,
            contactDetails,
            propertyName,
            builderName,
            requestedRenderTypes,
            instructions,
            mediaUrls: mediaUrls || [],
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            renders: [],
        };

        await firebasePropertyDb.createRenderRequest(renderRequest);

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
        const propertyId = searchParams.get('propertyId');
        
        let requests = await firebasePropertyDb.getAllRenderRequests();
        
        if (propertyId) {
            requests = requests.filter(r => r.propertyId === propertyId);
        }

        return NextResponse.json({
            success: true,
            data: requests,
        });
    } catch (error) {
        console.error('Error fetching render requests:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch render requests' },
            { status: 500 }
        );
    }
}
