/** Shared types for the War Room feature */

export type UnitStatus = 'AVAILABLE' | 'SOFT_HOLD' | 'BOOKED' | 'SOLD' | 'BLOCKED';

export interface WarRoomUnit {
    id: string;
    towerId: string;
    unitNumber: string;
    floor: number;
    configuration: string;   // e.g. "2 BHK", "3 BHK", "Studio"
    status: UnitStatus;
    carpetArea: number;      // sqft
    builtUpArea: number;     // sqft
    facing: string;          // "North", "East", etc.
    basePrice: number;       // ₹ total
    floorRise: number;       // ₹/sqft per floor above base
    plcCharges: number;      // Preferred Location Charges
    totalPrice: number;      // computed
    isHighDemand: boolean;
}

export interface WarRoomTower {
    id: string;
    name: string;
    totalFloors: number;
    units: WarRoomUnit[];
    status: string;
}

export interface HoldEntry {
    unitId: string;
    agentName: string;
    expiry: number;   // timestamp ms
}
