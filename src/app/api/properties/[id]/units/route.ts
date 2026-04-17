import { NextRequest, NextResponse } from 'next/server';
import { unitService } from '@/lib/property-db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const type = searchParams.get('type');
        const sectionType = searchParams.get('sectionType');

        let units = await unitService.getByProperty(id, sectionType || undefined);

        if (status) {
            units = units.filter(u => u.status === status);
        }

        if (type) {
            units = units.filter(u => u.type === type);
        }

        return NextResponse.json({
            success: true,
            data: units,
            count: units.length,
        });
    } catch (error: unknown) {
        console.error('Error fetching units:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch units' },
            { status: 500 }
        );
    }
}
