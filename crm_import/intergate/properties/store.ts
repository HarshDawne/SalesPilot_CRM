'use client';

import { create } from 'zustand';

// Mock data store with state management
interface Project {
    id: string;
    name: string;
    location: string;
    city: string;
    status: 'Active' | 'Under Construction' | 'Completed';
    totalTowers: number;
    totalUnits: number;
    availableUnits: number;
    bookedUnits: number;
    imageGradient: string;
}

interface Unit {
    id: string;
    projectId: string;
    towerId: string;
    unitNumber: string;
    carpetArea: number;
    builtUpArea: number;
    type: '1BHK' | '2BHK' | '3BHK' | 'Shop' | 'Office';
    status: 'Available' | 'Reserved' | 'Booked' | 'Blocked';
    floor: number;
    facing: string;
    basePrice: number;
    floorRise: number;
    plc: number;
    totalPrice: number;
    reservedUntil?: Date;
    reservedBy?: string;
}

interface ActivityLog {
    id: string;
    type: 'reserve' | 'book' | 'release' | 'block' | 'upload' | 'price_change' | 'purchase_render';
    description: string;
    timestamp: Date;
    projectId?: string;
    unitId?: string;
}

interface PropertyStore {
    projects: Project[];
    units: Unit[];
    activityLog: ActivityLog[];
    rendersPurchased: Record<string, boolean>;

    // Actions
    updateUnitStatus: (unitId: string, status: Unit['status'], reservedBy?: string) => void;
    addActivityLog: (activity: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
    toggleRenderPurchased: (renderId: string) => void;
    updateUnitPrice: (unitId: string, pricing: { basePrice: number; floorRise: number; plc: number }) => void;
}

export const usePropertyStore = create<PropertyStore>((set) => ({
    projects: [
        {
            id: 'proj-001',
            name: 'Skyline Residency',
            location: 'Mumbai, Andheri West',
            city: 'Mumbai',
            status: 'Active',
            totalTowers: 3,
            totalUnits: 120,
            availableUnits: 45,
            bookedUnits: 65,
            imageGradient: 'from-indigo-500 to-purple-600',
        },
        {
            id: 'proj-002',
            name: 'Green Valley Homes',
            location: 'Pune, Hinjewadi',
            city: 'Pune',
            status: 'Under Construction',
            totalTowers: 4,
            totalUnits: 180,
            availableUnits: 95,
            bookedUnits: 70,
            imageGradient: 'from-emerald-500 to-teal-600',
        },
        {
            id: 'proj-003',
            name: 'Urban Square',
            location: 'Bangalore, Whitefield',
            city: 'Bangalore',
            status: 'Active',
            totalTowers: 2,
            totalUnits: 85,
            availableUnits: 30,
            bookedUnits: 50,
            imageGradient: 'from-blue-500 to-cyan-600',
        },
        {
            id: 'proj-004',
            name: 'Luxury Heights',
            location: 'Mumbai, Powai',
            city: 'Mumbai',
            status: 'Completed',
            totalTowers: 2,
            totalUnits: 60,
            availableUnits: 5,
            bookedUnits: 55,
            imageGradient: 'from-purple-500 to-pink-600',
        },
        {
            id: 'proj-005',
            name: 'City Center Mall',
            location: 'Delhi, Connaught Place',
            city: 'Delhi',
            status: 'Active',
            totalTowers: 1,
            totalUnits: 45,
            availableUnits: 12,
            bookedUnits: 28,
            imageGradient: 'from-orange-500 to-red-600',
        },
    ],

    units: [
        {
            id: 'unit-001',
            projectId: 'proj-001',
            towerId: 'tower-001',
            unitNumber: 'A-101',
            carpetArea: 850,
            builtUpArea: 1200,
            type: '2BHK',
            status: 'Available',
            floor: 1,
            facing: 'North',
            basePrice: 50000,
            floorRise: 2000,
            plc: 500000,
            totalPrice: 60500000,
        },
        {
            id: 'unit-002',
            projectId: 'proj-001',
            towerId: 'tower-001',
            unitNumber: 'A-102',
            carpetArea: 1200,
            builtUpArea: 1650,
            type: '3BHK',
            status: 'Reserved',
            floor: 1,
            facing: 'East',
            basePrice: 50000,
            floorRise: 2000,
            plc: 750000,
            totalPrice: 83250000,
            reservedUntil: new Date(Date.now() + 48 * 60 * 60 * 1000),
            reservedBy: 'John Doe',
        },
        // Add more units as needed
    ],

    activityLog: [
        {
            id: 'activity-001',
            type: 'reserve',
            description: 'Unit A-102 reserved by John Doe',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            projectId: 'proj-001',
            unitId: 'unit-002',
        },
    ],

    rendersPurchased: {},

    updateUnitStatus: (unitId, status, reservedBy) => set((state) => ({
        units: state.units.map((unit) =>
            unit.id === unitId
                ? {
                    ...unit,
                    status,
                    ...(status === 'Reserved'
                        ? {
                            reservedUntil: new Date(Date.now() + 48 * 60 * 60 * 1000),
                            reservedBy: reservedBy || 'Unknown',
                        }
                        : { reservedUntil: undefined, reservedBy: undefined }),
                }
                : unit
        ),
    })),

    addActivityLog: (activity) => set((state) => ({
        activityLog: [
            {
                ...activity,
                id: `activity-${Date.now()}`,
                timestamp: new Date(),
            },
            ...state.activityLog,
        ],
    })),

    toggleRenderPurchased: (renderId) => set((state) => ({
        rendersPurchased: {
            ...state.rendersPurchased,
            [renderId]: !state.rendersPurchased[renderId],
        },
    })),

    updateUnitPrice: (unitId, pricing) => set((state) => ({
        units: state.units.map((unit) =>
            unit.id === unitId
                ? {
                    ...unit,
                    ...pricing,
                    totalPrice: (unit.carpetArea * pricing.basePrice) + pricing.floorRise + pricing.plc,
                }
                : unit
        ),
    })),
}));
