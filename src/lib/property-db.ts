/**
 * Property Database Service
 * High-level operations for property management
 */

import { firebasePropertyDb } from './firebase-property-db';
import type { Property, Tower, Unit, UnitStatus, PropertyInventoryStats, PropertyDocument } from '@/types/property';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// Helper to read documents from db.json (since documents aren't in the main db interface yet)
function getDocumentsFromFile(): PropertyDocument[] {
    try {
        const dbPath = path.join(process.cwd(), 'data', 'db.json');
        const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        return data.propertyDocuments || [];
    } catch {
        return [];
    }
}

// ============================================================================
// DOCUMENT OPERATIONS
// ============================================================================

export const documentService = {
    // Get all documents
    getAll(): PropertyDocument[] {
        return getDocumentsFromFile();
    },

    // Get documents by property
    getByProperty(propertyId: string): PropertyDocument[] {
        const docs = getDocumentsFromFile();
        return docs.filter(d => d.propertyId === propertyId);
    },

    // Get documents by unit
    getByUnit(unitId: string): PropertyDocument[] {
        const docs = getDocumentsFromFile();
        return docs.filter(d => d.unitId === unitId);
    },
};

// ============================================================================
// PROPERTY OPERATIONS (NOW USING FIREBASE)
// ============================================================================

export const propertyService = {
    // Get all properties
    async getAll(): Promise<Property[]> {
        return await firebasePropertyDb.getAllProperties();
    },

    // Get property by ID
    async getById(id: string): Promise<Property | null> {
        return await firebasePropertyDb.getPropertyById(id);
    },

    // Create property
    async create(data: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<Property> {
        const property: Property = {
            ...data,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        return await firebasePropertyDb.createProperty(property);
    },

    // Update property
    async update(id: string, data: Partial<Property>): Promise<Property | null> {
        return await firebasePropertyDb.updateProperty(id, {
            ...data,
            updatedAt: new Date().toISOString(),
        });
    },

    // Delete property
    async delete(id: string): Promise<boolean> {
        return await firebasePropertyDb.deleteProperty(id);
    },

    // Get properties by status
    async getByStatus(status: string): Promise<Property[]> {
        const properties = await firebasePropertyDb.getAllProperties();
        return properties.filter(p => p.status === status);
    },

    // Get properties by city
    async getByCity(city: string): Promise<Property[]> {
        const properties = await firebasePropertyDb.getAllProperties();
        return properties.filter(p => p.location.city === city);
    },

    // Update inventory counts
    async updateInventory(propertyId: string): Promise<void> {
        const property = await firebasePropertyDb.getPropertyById(propertyId);
        if (!property) return;

        const units = await firebasePropertyDb.getUnitsByProperty(propertyId);
        const availableUnits = units.filter(u => u.status === 'AVAILABLE').length;
        const bookedUnits = units.filter(u => u.status === 'BOOKED').length;

        await firebasePropertyDb.updateProperty(propertyId, {
            totalUnits: units.length,
            availableUnits,
            bookedUnits,
            updatedAt: new Date().toISOString(),
        });
    },
};

// ============================================================================
// TOWER OPERATIONS (NOW USING FIREBASE)
// ============================================================================

export const towerService = {
    // Get all towers
    async getAll(): Promise<Tower[]> {
        return await firebasePropertyDb.getAllTowers();
    },

    // Get tower by ID
    async getById(id: string): Promise<Tower | null> {
        return await firebasePropertyDb.getTowerById(id);
    },

    // Get towers by property
    async getByProperty(propertyId: string): Promise<Tower[]> {
        return await firebasePropertyDb.getTowersByProperty(propertyId);
    },

    // Create tower
    async create(data: Omit<Tower, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tower> {
        const tower: Tower = {
            ...data,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        return await firebasePropertyDb.createTower(tower);
    },

    // Update tower
    async update(id: string, data: Partial<Tower>): Promise<Tower | null> {
        return await firebasePropertyDb.updateTower(id, {
            ...data,
            updatedAt: new Date().toISOString(),
        });
    },

    // Delete tower
    async delete(id: string): Promise<boolean> {
        return await firebasePropertyDb.deleteTower(id);
    },

    // Update tower inventory
    async updateInventory(towerId: string): Promise<void> {
        const tower = await firebasePropertyDb.getTowerById(towerId);
        if (!tower) return;

        const units = await firebasePropertyDb.getUnitsByTower(towerId);
        const availableUnits = units.filter(u => u.status === 'AVAILABLE').length;

        await firebasePropertyDb.updateTower(towerId, {
            totalUnits: units.length,
            availableUnits,
            updatedAt: new Date().toISOString(),
        });
    },
};

// ============================================================================
// UNIT OPERATIONS (NOW USING FIREBASE)
// ============================================================================

export const unitService = {
    // Get all units
    async getAll(): Promise<Unit[]> {
        return await firebasePropertyDb.getAllUnits();
    },

    // Get unit by ID
    async getById(id: string): Promise<Unit | null> {
        return await firebasePropertyDb.getUnitById(id);
    },

    // Get units by property
    async getByProperty(propertyId: string): Promise<Unit[]> {
        return await firebasePropertyDb.getUnitsByProperty(propertyId);
    },

    // Get units by tower
    async getByTower(towerId: string): Promise<Unit[]> {
        return await firebasePropertyDb.getUnitsByTower(towerId);
    },

    // Get units by status
    async getByStatus(status: UnitStatus): Promise<Unit[]> {
        const units = await firebasePropertyDb.getAllUnits();
        return units.filter(u => u.status === status);
    },

    // Get available units for property
    async getAvailable(propertyId?: string): Promise<Unit[]> {
        const units = propertyId
            ? await firebasePropertyDb.getUnitsByProperty(propertyId)
            : await firebasePropertyDb.getAllUnits();
        return units.filter(u => u.status === 'AVAILABLE');
    },

    // Create unit
    async create(data: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>): Promise<Unit> {
        const unit: Unit = {
            ...data,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const created = await firebasePropertyDb.createUnit(unit);

        // Update tower and property inventory
        await towerService.updateInventory(unit.towerId);
        await propertyService.updateInventory(unit.propertyId);

        return created;
    },

    // Update unit
    async update(id: string, data: Partial<Unit>): Promise<Unit | null> {
        const unit = await firebasePropertyDb.getUnitById(id);
        if (!unit) return null;

        const updated = await firebasePropertyDb.updateUnit(id, {
            ...data,
            updatedAt: new Date().toISOString(),
        });

        // Update inventory if status changed
        if (data.status && data.status !== unit.status) {
            await towerService.updateInventory(unit.towerId);
            await propertyService.updateInventory(unit.propertyId);
        }

        return updated;
    },

    // Delete unit
    async delete(id: string): Promise<boolean> {
        const unit = await firebasePropertyDb.getUnitById(id);
        if (!unit) return false;

        const deleted = await firebasePropertyDb.deleteUnit(id);
        if (deleted) {
            await towerService.updateInventory(unit.towerId);
            await propertyService.updateInventory(unit.propertyId);
        }
        return deleted;
    },

    // Get inventory stats
    async getInventoryStats(propertyId: string): Promise<PropertyInventoryStats> {
        const units = await firebasePropertyDb.getUnitsByProperty(propertyId);

        return {
            totalUnits: units.length,
            available: units.filter(u => u.status === 'AVAILABLE').length,
            reserved: units.filter(u => u.status === 'RESERVED').length,
            negotiation: units.filter(u => u.status === 'NEGOTIATION').length,
            booked: units.filter(u => u.status === 'BOOKED').length,
            blocked: units.filter(u => u.status === 'BLOCKED').length,
            occupancyRate: units.length > 0 ? (units.filter(u => u.status === 'BOOKED').length / units.length) * 100 : 0,
        };
    },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getPropertyWithDetails(propertyId: string) {
    const property = propertyService.getById(propertyId);
    if (!property) return null;

    const towers = towerService.getByProperty(propertyId);
    const units = unitService.getByProperty(propertyId);
    const stats = unitService.getInventoryStats(propertyId);

    return {
        property,
        towers,
        units,
        stats,
    };
}

export function getTowerWithUnits(towerId: string) {
    const tower = towerService.getById(towerId);
    if (!tower) return null;

    const units = unitService.getByTower(towerId);

    return {
        tower,
        units,
    };
}

// Cleanup expired reservations
export function cleanupExpiredReservations(): number {
    const expired = db.unitReservations.findExpired();
    let count = 0;

    for (const reservation of expired) {
        // Release the unit
        const unit = db.units.findById(reservation.unitId);
        if (unit && unit.status === 'RESERVED') {
            unitService.releaseReservation(reservation.unitId);
            count++;
        }
    }

    return count;
}
