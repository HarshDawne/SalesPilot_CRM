/**
 * Shared domain interfaces to link Leads with Property Management OS entities.
 * These interfaces define the contract without duplicating data.
 */

export interface PropertyReference {
    propertyId: string;
    propertyName?: string;
}

export interface TowerReference {
    propertyId: string;
    towerId: string;
    towerName?: string;
}

export interface UnitReference {
    propertyId: string;
    towerId: string;
    unitId: string;
    unitNumber?: string;
}

/**
 * Extension for the Lead type to include Property OS references.
 * Lead Management OS should only store these references.
 */
export interface LeadPropertyContext {
    propertyRef?: PropertyReference;
    towerRef?: TowerReference;
    unitRef?: UnitReference;
}
