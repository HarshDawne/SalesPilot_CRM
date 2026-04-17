/**
 * Property Database Service
 * High-level operations for property management
 */

import { db } from './db';
import { Property, Tower, Unit, UnitStatus, PropertyInventoryStats } from '../types/property';
import { v4 as uuidv4 } from 'uuid';

export interface Building extends Tower { }

// ============================================================================
// PROPERTY OPERATIONS
// ============================================================================

export const propertyService = {
    getAll(): Property[] {
        return db.propertyManagement.findAll();
    },

    getById(id: string): Property | undefined {
        return db.propertyManagement.findById(id);
    },

    create(data: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Property {
        const property: Property = {
            ...data,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        return db.propertyManagement.create(property);
    },

    update(id: string, data: Partial<Property>): Property | null {
        return db.propertyManagement.update(id, {
            ...data,
            updatedAt: new Date().toISOString(),
        });
    },

    delete(id: string): boolean {
        return db.propertyManagement.delete(id);
    },

    getByStatus(status: string): Property[] {
        return db.propertyManagement.findByStatus(status);
    },

    getByCity(city: string): Property[] {
        return db.propertyManagement.findByCity(city);
    },

    updateInventory(propertyId: string): void {
        const property = db.propertyManagement.findById(propertyId);
        if (!property) return;

        const units = db.units.findByProperty(propertyId);
        const availableUnits = units.filter(u => u.status === 'AVAILABLE').length;
        const bookedUnits = units.filter(u => u.status === 'BOOKED').length;

        db.propertyManagement.update(propertyId, {
            totalUnits: units.length,
            availableUnits,
            bookedUnits,
            updatedAt: new Date().toISOString(),
        });
    },
};

// ============================================================================
// TOWER OPERATIONS
// ============================================================================

export const towerService = {
    getAll(): Tower[] {
        return db.towers.findAll();
    },

    getById(id: string): Tower | undefined {
        return db.towers.findById(id);
    },

    getByProperty(propertyId: string): Tower[] {
        return db.towers.findByProperty(propertyId);
    },

    create(data: Omit<Tower, 'id' | 'createdAt' | 'updatedAt'>): Tower {
        const tower: Tower = {
            ...data,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        return db.towers.create(tower);
    },

    update(id: string, data: Partial<Tower>): Tower | null {
        return db.towers.update(id, {
            ...data,
            updatedAt: new Date().toISOString(),
        });
    },

    delete(id: string): boolean {
        return db.towers.delete(id);
    },

    updateInventory(towerId: string): void {
        const tower = db.towers.findById(towerId);
        if (!tower) return;

        const units = db.units.findByTower(towerId);
        const availableUnits = units.filter(u => u.status === 'AVAILABLE').length;

        db.towers.update(towerId, {
            totalUnits: units.length,
            availableUnits,
            updatedAt: new Date().toISOString(),
        });
    },
};

// ============================================================================
// UNIT OPERATIONS
// ============================================================================

export const unitService = {
    getAll(): Unit[] {
        return db.units.findAll();
    },

    getById(id: string): Unit | undefined {
        return db.units.findById(id);
    },

    getByProperty(propertyId: string): Unit[] {
        return db.units.findByProperty(propertyId);
    },

    getByTower(towerId: string): Unit[] {
        return db.units.findByTower(towerId);
    },

    getByStatus(status: UnitStatus): Unit[] {
        return db.units.findByStatus(status);
    },

    getAvailable(propertyId?: string): Unit[] {
        return db.units.findAvailable(propertyId);
    },

    create(data: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>): Unit {
        const unit: Unit = {
            ...data,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const created = db.units.create(unit);
        towerService.updateInventory(unit.towerId);
        propertyService.updateInventory(unit.propertyId);
        return created;
    },

    update(id: string, data: Partial<Unit>): Unit | null {
        const unit = db.units.findById(id);
        if (!unit) return null;

        const updated = db.units.update(id, {
            ...data,
            updatedAt: new Date().toISOString(),
        });

        if (data.status && data.status !== unit.status) {
            towerService.updateInventory(unit.towerId);
            propertyService.updateInventory(unit.propertyId);
        }

        return updated;
    },

    delete(id: string): boolean {
        const unit = db.units.findById(id);
        if (!unit) return false;

        const deleted = db.units.delete(id);
        if (deleted) {
            towerService.updateInventory(unit.towerId);
            propertyService.updateInventory(unit.propertyId);
        }
        return deleted;
    },

    reserve(unitId: string, leadId: string, leadName: string, hours: number = 48): Unit | null {
        const unit = db.units.findById(unitId);
        if (!unit || unit.status !== UnitStatus.AVAILABLE) return null;

        const reservation = {
            id: uuidv4(),
            unitId,
            leadId,
            reservedBy: leadName,
            reservedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000).toISOString(),
            canExtend: true,
            extendedCount: 0,
            maxExtensions: 2,
            lockedBy: 'system' as const,
            isActive: true,
        };

        db.unitReservations.create(reservation);
        return this.update(unitId, { status: UnitStatus.RESERVED, reservation });
    },

    releaseReservation(unitId: string): Unit | null {
        const unit = db.units.findById(unitId);
        if (!unit || unit.status !== UnitStatus.RESERVED) return null;

        const reservation = db.unitReservations.findByUnit(unitId);
        if (reservation) {
            db.unitReservations.update(reservation.id, { isActive: false });
        }

        return this.update(unitId, { status: UnitStatus.AVAILABLE, reservation: undefined });
    },


    extendReservation(unitId: string, hours: number = 24): Unit | null {
        const unit = db.units.findById(unitId);
        if (!unit || !unit.reservation || !unit.reservation.canExtend) return null;
        if (unit.reservation.extendedCount >= unit.reservation.maxExtensions) return null;

        const updatedReservation = {
            ...unit.reservation,
            expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000).toISOString(),
            extendedCount: unit.reservation.extendedCount + 1,
            canExtend: unit.reservation.extendedCount + 1 < unit.reservation.maxExtensions,
        };

        db.unitReservations.update(unit.reservation.id, updatedReservation);
        return this.update(unitId, { reservation: updatedReservation });
    },

    book(unitId: string): Unit | null {
        const unit = db.units.findById(unitId);
        if (!unit) return null;

        const reservation = db.unitReservations.findByUnit(unitId);
        if (reservation) {
            db.unitReservations.update(reservation.id, { isActive: false });
        }

        return this.update(unitId, { status: UnitStatus.BOOKED, reservation: undefined });
    },

    isAvailable(unitId: string): boolean {
        const unit = db.units.findById(unitId);
        return unit?.status === 'AVAILABLE';
    },

    getInventoryStats(propertyId: string): PropertyInventoryStats {
        const units = this.getByProperty(propertyId);
        const available = units.filter(u => u.status === 'AVAILABLE').length;
        const reserved = units.filter(u => u.status === 'RESERVED').length;
        const negotiation = units.filter(u => u.status === 'NEGOTIATION').length;
        const booked = units.filter(u => u.status === 'BOOKED').length;
        const blocked = units.filter(u => u.status === 'BLOCKED').length;

        return {
            propertyId,
            totalUnits: units.length,
            available,
            reserved,
            negotiation,
            booked,
            blocked,
            occupancyRate: units.length > 0 ? ((booked / units.length) * 100) : 0,
        };
    },
};

export function getPropertyWithDetails(propertyId: string) {
    const property = propertyService.getById(propertyId);
    if (!property) return null;

    return {
        property,
        towers: towerService.getByProperty(propertyId),
        units: unitService.getByProperty(propertyId),
        stats: unitService.getInventoryStats(propertyId),
    };
}

export function getTowerWithUnits(towerId: string) {
    const tower = towerService.getById(towerId);
    if (!tower) return null;

    return {
        tower,
        units: unitService.getByTower(towerId),
    };
}

export function cleanupExpiredReservations(): number {
    const expired = db.unitReservations.findExpired();
    let count = 0;

    for (const reservation of expired) {
        const unit = db.units.findById(reservation.unitId);
        if (unit && unit.status === 'RESERVED') {
            unitService.releaseReservation(reservation.unitId);
            count++;
        }
    }

    return count;
}
