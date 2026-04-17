import { NextResponse, NextRequest } from 'next/server';
import { unitService } from '@/lib/property-db';
import { UnitStatus } from '@/types/property';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  try {
    const { unitId } = await params;

    // 1. Get current unit status
    const unit = await unitService.getById(unitId);
    if (!unit) {
      return NextResponse.json({ success: false, error: 'Unit not found' }, { status: 404 });
    }

    // 2. Clear hold
    const updated = await unitService.update(unitId, {
      status: 'AVAILABLE' as UnitStatus,
      holdExpiry: undefined,
      reservation: undefined
    });

    return NextResponse.json({ success: true, unit: updated });
  } catch (error) {
    console.error('Error releasing unit:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
