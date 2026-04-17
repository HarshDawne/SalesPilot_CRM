import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { firebasePropertyDb } from '@/lib/firebase-property-db';
import { requireRole } from '@/lib/auth';
import type { RenderAsset, RenderMedia } from '@/types/render';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const authError = await requireRole(request, 'admin');
        if (authError) return authError;

        const body = await request.json();
        const { media, renderType } = body;

        if (!media || !renderType) {
            return NextResponse.json(
                { success: false, error: 'Missing render data' },
                { status: 400 }
            );
        }

        // 1. Fetch the original request
        const renderRequest = await firebasePropertyDb.getRenderRequestById(id);
        if (!renderRequest) {
            return NextResponse.json(
                { success: false, error: 'Render request not found' },
                { status: 404 }
            );
        }

        // 2. Create the RenderAsset
        const renderAsset: RenderAsset = {
            id: uuidv4(),
            linkedTo: renderRequest.sourceType, // Use original source type directly
            propertyId: renderRequest.propertyId,
            towerId: renderRequest.towerId,
            unitId: renderRequest.unitId,
            media: media as RenderMedia[],
            renderType,
            uploadedAt: new Date().toISOString(),
        };

        // 3. Auto-Routing Logic
        console.log('[ADD-RENDER] Auto-routing logic:', { 
            sourceType: renderRequest.sourceType, 
            propertyId: renderRequest.propertyId,
            towerId: renderRequest.towerId,
            unitId: renderRequest.unitId 
        });

        if (renderRequest.sourceType === 'UNIT' && renderRequest.unitId) {
            // Attach to Unit
            console.log('[ADD-RENDER] Attaching to UNIT:', renderRequest.unitId);
            const unit = await firebasePropertyDb.getUnitById(renderRequest.unitId);
            if (unit) {
                const currentRenders = unit.renders || [];
                await firebasePropertyDb.updateUnit(unit.id, {
                    renders: [...currentRenders, renderAsset]
                });
                console.log('[ADD-RENDER] ✓ Successfully attached to Unit');
            } else {
                console.error('[ADD-RENDER] ✗ Unit not found:', renderRequest.unitId);
            }
        } else if (renderRequest.sourceType === 'TOWER' && renderRequest.towerId) {
            // Attach to Tower
            console.log('[ADD-RENDER] Attaching to TOWER:', renderRequest.towerId);
            const tower = await firebasePropertyDb.getTowerById(renderRequest.towerId);
            if (tower) {
                const currentRenders = tower.renders || [];
                await firebasePropertyDb.updateTower(tower.id, {
                    renders: [...currentRenders, renderAsset]
                });
                console.log('[ADD-RENDER] ✓ Successfully attached to Tower');
            } else {
                console.error('[ADD-RENDER] ✗ Tower not found:', renderRequest.towerId);
            }
        } else {
            // Default: Attach to Property (for sourceType === 'PROPERTY' or generic fallback)
            console.log('[ADD-RENDER] Attaching to PROPERTY:', renderRequest.propertyId);
            const property = await firebasePropertyDb.getPropertyById(renderRequest.propertyId);
            if (property) {
                const currentRenders = property.renders || [];
                await firebasePropertyDb.updateProperty(property.id, {
                    renders: [...currentRenders, renderAsset]
                });
                console.log('[ADD-RENDER] ✓ Successfully attached to Property');
            } else {
                console.error('[ADD-RENDER] ✗ Property not found:', renderRequest.propertyId);
            }
        }

        // 4. Update request status to COMPLETED
        console.log('[ADD-RENDER] Marking request as COMPLETED:', id);
        await firebasePropertyDb.updateRenderRequest(id, {
            status: 'COMPLETED',
            completedAt: new Date().toISOString(),
            renders: [...(renderRequest.renders || []), renderAsset]
        });

        return NextResponse.json({
            success: true,
            message: 'Render added and auto-routed successfully',
            asset: renderAsset
        });

    } catch (error) {
        console.error('Error adding 3D render:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to add 3D render' },
            { status: 500 }
        );
    }
}
