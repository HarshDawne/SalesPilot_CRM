import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { firebasePropertyDb } from '@/lib/firebase-property-db';
import type { RenderAsset, RenderType, RenderMedia } from '@/types/render';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: requestId } = await params;
        const body = await request.json();
        const { media, renderType } = body;

        if (!media || !renderType) {
            return NextResponse.json(
                { success: false, error: 'Media and render type are required' },
                { status: 400 }
            );
        }

        // 1. Fetch the original request
        const renderRequest = await firebasePropertyDb.getRenderRequestById(requestId);
        if (!renderRequest) {
            return NextResponse.json(
                { success: false, error: 'Render request not found' },
                { status: 404 }
            );
        }

        if (renderRequest.status === 'COMPLETED') {
            return NextResponse.json(
                { success: false, error: 'Request is already completed and locked' },
                { status: 400 }
            );
        }

        // 2. Prepare the RenderAsset
        const renderAsset: RenderAsset = {
            id: uuidv4(),
            linkedTo: renderRequest.sourceType === 'UNIT' ? 'UNIT' : 'PROPERTY',
            propertyId: renderRequest.propertyId,
            towerId: renderRequest.towerId,
            unitId: renderRequest.unitId,
            media: media as RenderMedia[],
            renderType: renderType as RenderType,
            uploadedAt: new Date().toISOString(),
        };

        // 3. Auto-Routing Logic
        if (renderRequest.sourceType === 'UNIT' && renderRequest.unitId) {
            // Attach to Unit
            const unit = await firebasePropertyDb.getUnitById(renderRequest.unitId);
            if (unit) {
                const currentRenders = unit.renders || [];
                await firebasePropertyDb.updateUnit(renderRequest.unitId, {
                    renders: [...currentRenders, renderAsset]
                });
            }
        } else {
            // Attach to Property
            const property = await firebasePropertyDb.getPropertyById(renderRequest.propertyId);
            if (property) {
                const currentRenders = property.renders || [];
                await firebasePropertyDb.updateProperty(renderRequest.propertyId, {
                    renders: [...currentRenders, renderAsset]
                });
            }
        }

        // 4. Update RenderRequest status
        const updatedRequest = await firebasePropertyDb.updateRenderRequest(requestId, {
            status: 'COMPLETED',
            completedAt: new Date().toISOString(),
            renders: [...(renderRequest.renders || []), renderAsset]
        });

        return NextResponse.json({
            success: true,
            data: updatedRequest,
            message: 'Render completed and attached successfully',
        });

    } catch (error: any) {
        console.error('Error completing render request:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
