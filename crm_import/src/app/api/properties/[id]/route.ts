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

        // Validate using partial schema for updates
        const validatedData = propertySchema.partial().parse(body);

        const property = await propertyService.update(id, validatedData as any);
        if (!property) {
            return NextResponse.json(
                { success: false, error: 'Property not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: property });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            console.error('❌ Validation failed:', JSON.stringify(error.issues, null, 2));
            return NextResponse.json(
                { success: false, error: 'Validation failed', details: error.issues },
                { status: 400 }
            );
        }

        console.error('Error updating property:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update property' },
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
