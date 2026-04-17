import { NextResponse, NextRequest } from 'next/server';
import { unitService } from '@/lib/property-db';
import { UnitStatus } from '@/types/property';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  try {
    const { agentName, durationMinutes = 30 } = await request.json();
    const { unitId } = await params;

    // 1. Get current unit status
    const unit = await unitService.getById(unitId);
    if (!unit) {
      return NextResponse.json({ success: false, error: 'Unit not found' }, { status: 404 });
    }

    if (unit.status !== 'AVAILABLE') {
      return NextResponse.json({ success: false, error: 'Unit is no longer available' }, { status: 409 });
    }

    // 2. Set hold expiry
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();

    // 3. Update unit
    const updated = await unitService.update(unitId, {
      status: 'BLOCKED' as UnitStatus,
      holdExpiry: expiresAt,
      reservation: {
        id: crypto.randomUUID(),
        unitId,
        leadId: 'WAR-ROOM-HOLD',
        reservedBy: agentName || 'Sales Agent',
        reservedAt: new Date().toISOString(),
        expiresAt,
        canExtend: true,
        extendedCount: 0,
        maxExtensions: 2,
        lockedBy: 'admin',
        isActive: true
      }
    });

    return NextResponse.json({ success: true, unit: updated });
  } catch (error) {
    console.error('Error holding unit:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
