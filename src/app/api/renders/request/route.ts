import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import type { RenderRequest, RenderSourceType, RenderType } from '@/types/render';
import { firebasePropertyDb } from '@/lib/firebase-property-db';

// Mock storage (in production, use database)
const renderRequests: RenderRequest[] = [];

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            propertyId,
            towerId,
            unitId,
            sourceType,
            propertyName,
            builderName,
            contactName,
            phone,
            businessEmail,
            renderTypes,
            instructions,
            userMedia,
            referenceMedia
        } = body;

        if (!propertyId || !sourceType || !propertyName || !builderName || !contactName || !phone || !businessEmail) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const renderRequest: RenderRequest = {
            id: uuidv4(),
            propertyId,
            towerId,
            unitId,
            sourceType: (sourceType || (unitId ? 'UNIT' : 'PROPERTY')) as RenderSourceType,
            propertyName,
            builderName,
            contactDetails: {
                name: contactName,
                phone: phone,
                email: businessEmail || 'unknown@builder.com'
            },
            requestedRenderTypes: (renderTypes || []) as RenderType[],
            instructions,
            mediaUrls: [...(userMedia || []), ...(referenceMedia || [])],
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
        const unitId = searchParams.get('unitId');

        let filteredRequests = await firebasePropertyDb.getAllRenderRequests();

        if (propertyId) {
            filteredRequests = filteredRequests.filter(r => r.propertyId === propertyId);
        }

        if (unitId) {
            filteredRequests = filteredRequests.filter(r => r.unitId === unitId);
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
