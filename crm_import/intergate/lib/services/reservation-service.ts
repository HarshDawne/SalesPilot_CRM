/**
 * Unit Reservation Service
 * Critical: Handles 48-hour unit locks with atomic operations
 */

import { transaction } from '../db/database';
import { RESERVATION_HOURS, MAX_RESERVATION_EXTENSIONS } from '../constants';
import { generateUUID } from '../utils';
import type { Unit, UnitReservation } from '@/types/property';
import { updateProjectMetrics, updateBuildingMetrics } from './property-service';

/**
 * Reserve a unit (48-hour lock)
 */
export async function reserveUnit(
    unitId: string,
    userId: string
): Promise<{ reservation: UnitReservation; unit: Unit }> {
    return transaction('reserve_unit', async (db) => {
        const unit = db.units.find(u => u.id === unitId);
        if (!unit) {
            throw new Error(`Unit ${unitId} not found`);
        }

        if (unit.status !== 'AVAILABLE') {
            throw new Error(`Unit ${unitId} is not available (status: ${unit.status})`);
        }

        // Create reservation
        const reservation: UnitReservation = {
            id: generateUUID(),
            unitId,
            reservedBy: userId,
            reservedAt: new Date(),
            expiresAt: new Date(Date.now() + RESERVATION_HOURS * 60 * 60 * 1000),
            canExtend: true,
            extendedCount: 0,
            maxExtensions: MAX_RESERVATION_EXTENSIONS,
            lockedBy: 'system',
            isActive: true,
        };

        // Update unit
        unit.status = 'RESERVED';
        unit.reservation = reservation;
        unit.updatedAt = new Date();

        // Add to reservations collection
        db.reservations.push(reservation);

        return { data: db, result: { reservation, unit } };
    });
}

/**
 * Extend reservation (max 2 times)
 */
export async function extendReservation(
    unitId: string,
    userId: string
): Promise<UnitReservation> {
    return transaction('extend_reservation', async (db) => {
        const unit = db.units.find(u => u.id === unitId);
        if (!unit || !unit.reservation) {
            throw new Error(`No active reservation found for unit ${unitId}`);
        }

        const reservation = unit.reservation;

        if (reservation.reservedBy !== userId) {
            throw new Error('Only the user who reserved can extend the reservation');
        }

        if (!reservation.canExtend) {
            throw new Error('Reservation cannot be extended');
        }

        if (reservation.extendedCount >= reservation.maxExtensions) {
            throw new Error(`Maximum extensions (${reservation.maxExtensions}) reached`);
        }

        // Extend expiry by another period
        reservation.expiresAt = new Date(
            reservation.expiresAt.getTime() + RESERVATION_HOURS * 60 * 60 * 1000
        );
        reservation.extendedCount++;

        // Disable further extensions if max reached
        if (reservation.extendedCount >= reservation.maxExtensions) {
            reservation.canExtend = false;
        }

        // Update reservation in db
        const dbReservation = db.reservations.find(r => r.id === reservation.id);
        if (dbReservation) {
            Object.assign(dbReservation, reservation);
        }

        return { data: db, result: reservation };
    });
}

/**
 * Release reservation manually
 */
export async function releaseReservation(
    unitId: string,
    userId: string
): Promise<void> {
    await transaction('release_reservation', async (db) => {
        const unit = db.units.find(u => u.id === unitId);
        if (!unit || !unit.reservation) {
            throw new Error(`No active reservation found for unit ${unitId}`);
        }

        if (unit.reservation.reservedBy !== userId) {
            throw new Error('Only the user who reserved can release the reservation');
        }

        // Release unit
        unit.status = 'AVAILABLE';
        unit.reservation.isActive = false;
        delete unit.reservation;
        unit.updatedAt = new Date();

        // Update reservation in db
        const reservation = db.reservations.find(r => r.id === unit.id);
        if (reservation) {
            reservation.isActive = false;
        }

        return { data: db, result: undefined };
    });
}

/**
 * Book unit (finalize reservation)
 */
export async function bookUnit(
    unitId: string,
    userId: string
): Promise<Unit> {
    return transaction('book_unit', async (db) => {
        const unit = db.units.find(u => u.id === unitId);
        if (!unit) {
            throw new Error(`Unit ${unitId} not found`);
        }

        if (unit.status === 'BOOKED') {
            throw new Error('Unit is already booked');
        }

        if (unit.status === 'RESERVED' && unit.reservation?.reservedBy !== userId) {
            throw new Error('Unit is reserved by another user');
        }

        // Book unit
        unit.status = 'BOOKED';
        if (unit.reservation) {
            unit.reservation.isActive = false;
            delete unit.reservation;
        }
        unit.updatedAt = new Date();

        // Update metrics
        await updateProjectMetrics(unit.projectId);
        await updateBuildingMetrics(unit.buildingId);

        return { data: db, result: unit };
    });
}

/**
 * Admin override - force release reservation
 */
export async function adminOverrideReservation(
    unitId: string,
    adminId: string,
    reason: string
): Promise<void> {
    await transaction('admin_override_reservation', async (db) => {
        const unit = db.units.find(u => u.id === unitId);
        if (!unit || !unit.reservation) {
            throw new Error(`No active reservation found for unit ${unitId}`);
        }

        // Release unit
        unit.status = 'AVAILABLE';
        unit.reservation.isActive = false;
        unit.reservation.reason = `Admin override: ${reason}`;
        delete unit.reservation;
        unit.updatedAt = new Date();

        // Log override (in production, this would go to audit log)
        console.log(`Admin ${adminId} overrode reservation for unit ${unitId}: ${reason}`);

        return { data: db, result: undefined };
    });
}

/**
 * Auto-release expired reservations
 * This would typically run as a cron job
 */
export async function autoReleaseExpired(): Promise<number> {
    return transaction('auto_release_expired', async (db) => {
        const now = new Date();
        let releasedCount = 0;

        for (const unit of db.units) {
            if (
                unit.status === 'RESERVED' &&
                unit.reservation &&
                unit.reservation.isActive &&
                new Date(unit.reservation.expiresAt) < now
            ) {
                unit.status = 'AVAILABLE';
                unit.reservation.isActive = false;
                delete unit.reservation;
                unit.updatedAt = new Date();
                releasedCount++;
            }
        }

        console.log(`Auto-released ${releasedCount} expired reservations`);

        return { data: db, result: releasedCount };
    });
}

/**
 * Get active reservations for a user
 */
export async function getActiveReservations(userId?: string): Promise<UnitReservation[]> {
    const { readDB } = await import('../db/database');
    const db = await readDB();

    let reservations = db.reservations.filter(r => r.isActive);

    if (userId) {
        reservations = reservations.filter(r => r.reservedBy === userId);
    }

    return reservations;
}

/**
 * Check if unit can be reserved
 */
export async function canReserveUnit(unitId: string): Promise<boolean> {
    const { readDB } = await import('../db/database');
    const db = await readDB();

    const unit = db.units.find(u => u.id === unitId);
    return unit?.status === 'AVAILABLE';
}
