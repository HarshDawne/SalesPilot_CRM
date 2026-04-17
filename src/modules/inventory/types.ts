import { Entity, UUID } from '../core/types';

export enum UnitStatus {
    AVAILABLE = 'AVAILABLE',
    BLOCKED = 'BLOCKED',
    BOOKED = 'BOOKED',
    SOLD = 'SOLD',
    HOLD_ADMIN = 'HOLD_ADMIN',
    UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
}

export enum UnitType {
    APARTMENT = 'APARTMENT',
    VILLA = 'VILLA',
    PLOT = 'PLOT',
    COMMERCIAL = 'COMMERCIAL'
}

export interface Project extends Entity {
    name: string;
    code: string;
    location: string;
    reraId?: string;
    developer: string;
    amenities: string[];
    status: 'LAUNCHING' | 'UNDER_CONSTRUCTION' | 'READY_TO_MOVE' | 'COMPLETED';
}

export interface Tower extends Entity {
    projectId: UUID;
    name: string; // "Tower A"
    totalFloors: number;
}

export interface Unit extends Entity {
    projectId: UUID;
    towerId?: UUID;

    unitNumber: string; // "101", "A-202"
    floorNumber: number;

    type: UnitType;
    configuration: string; // "3BHK + Servant"

    facing?: string; // "East", "Park View"

    area: {
        carpet?: number;
        superBuiltUp?: number;
        unit: 'SQFT' | 'SQM';
    };

    price: {
        basePrice: number;
        floorRise: number;
        plc: number; // Preferential Location Charge
        totalCost: number;
        currency: string;
    };

    status: UnitStatus;
    blockedBy?: UUID; // User ID
    blockedAt?: Date;
}
