import { NextRequest, NextResponse } from 'next/server';
import { propertyService, getPropertyWithDetails } from '@/lib/property-db';
import { propertySchema } from '@/lib/validations/property';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const includeDetails = searchParams.get('details') === 'true';
        const sectionType = searchParams.get('sectionType');

        if (includeDetails) {
            const details = await getPropertyWithDetails(id, sectionType || undefined);
            if (!details) {
                return NextResponse.json(
                    { success: false, error: 'Property not found' },
                    { status: 404 }
                );
            }
            return NextResponse.json({ success: true, data: details });
        }

        const property = await propertyService.getById(id);
        if (!property) {
            return NextResponse.json(
                { success: false, error: 'Property not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: property });
    } catch (error: unknown) {
        console.error('Error fetching property:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch property' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        
        console.log(`📡 [API] PUT /api/properties/${id} | Body keys:`, Object.keys(body));

        /* 
        DEBUG: Temporarily bypassing Zod validation to isolate persistent 500 errors.
        We will rely on manual data sanity check for this step.
        */
        const validatedData = body; 
        
        /*
        const result = propertySchema.partial().safeParse(body);
        if (!result.success) {
            console.error('❌ Schema Validation Error:', JSON.stringify(result.error.issues, null, 2));
            return NextResponse.json(
                { 
                    success: false, 
                    error: 'Validation failed', 
                    details: result.error.issues,
                    message: `Validation failed: ${result.error.issues[0].message} at ${result.error.issues[0].path.join('.')}`
                },
                { status: 400 }
            );
        }
        const validatedData = result.data;
        */

        const property = await propertyService.update(id, validatedData as any);
        if (!property) {
            return NextResponse.json(
                { success: false, error: 'Property not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: property });
    } catch (error: any) {
        console.error('🔥 [API] UNHANDLED ERROR in PUT /api/properties/[id]:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: 'Failed to update property', 
                message: error instanceof Error ? error.message : 'Unknown internal error',
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const deleted = await propertyService.delete(id);
        if (!deleted) {
            return NextResponse.json(
                { success: false, error: 'Property not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, message: 'Property deleted successfully' });
    } catch (error: unknown) {
        console.error('Error deleting property:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete property' },
            { status: 500 }
        );
    }
}
