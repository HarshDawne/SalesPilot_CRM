import { NextRequest, NextResponse } from 'next/server';
import { unitService } from '@/lib/property-db';
import { addTimelineEvent } from '@/lib/timeline';
import { broadcastSSE } from '@/lib/realtime';

/**
 * Cron job endpoint to expire reservations
 * Should be triggered periodically (e.g., every 15 minutes)
 * 
 * Usage: GET /api/cron/expire-reservations
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security (optional but recommended)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[CRON] Starting reservation expiry check...');

    // Get all units with active reservations
    const allUnits = await unitService.getAll();
    const reservedUnits = allUnits.filter(
      u => u.reservation && u.reservation.isActive && u.status === 'RESERVED'
    );

    console.log(`[CRON] Found ${reservedUnits.length} reserved units to check`);

    const now = new Date();
    const expiredUnits: string[] = [];
    const expiringUnits: string[] = []; // Expiring within 24 hours

    for (const unit of reservedUnits) {
      if (!unit.reservation) continue;

      const expiresAt = new Date(unit.reservation.expiresAt);
      const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Check if expired
      if (expiresAt <= now) {
        console.log(`[CRON] Expiring unit ${unit.unitNumber} (${unit.id})`);
        
        // Release the unit
        const released = await unitService.releaseReservation(unit.id);
        
        if (released) {
          expiredUnits.push(unit.id);

          // Create timeline event
          addTimelineEvent({
            leadId: unit.reservation.leadId,
            type: 'reservation_expired',
            summary: `Reservation for unit ${unit.unitNumber} expired automatically`,
            payload: {
              unitId: unit.id,
              unitNumber: unit.unitNumber,
              propertyId: unit.propertyId,
              reservedBy: unit.reservation.reservedBy,
              expiresAt: unit.reservation.expiresAt,
              autoReleased: true,
            },
            actor: 'system',
            visibleTo: 'all',
          });

          // Broadcast real-time update
          broadcastSSE('unit-update', {
            unitId: unit.id,
            status: 'AVAILABLE',
            reservation: null,
          });

          // TODO: Send notification to agent/lead
          console.log(`[CRON] ✓ Released unit ${unit.unitNumber}`);
        }
      }
      // Check if expiring soon (within 24 hours)
      else if (hoursUntilExpiry > 0 && hoursUntilExpiry <= 24) {
        expiringUnits.push(unit.id);
        console.log(`[CRON] Unit ${unit.unitNumber} expiring in ${hoursUntilExpiry.toFixed(1)} hours`);
        
        // TODO: Send expiry warning notification
      }
    }

    const report = {
      timestamp: now.toISOString(),
      totalReserved: reservedUnits.length,
      expired: expiredUnits.length,
      expiringSoon: expiringUnits.length,
      expiredUnitIds: expiredUnits,
      expiringUnitIds: expiringUnits,
    };

    console.log('[CRON] Expiry check complete:', report);

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('[CRON] Error in reservation expiry:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process reservation expiry',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
