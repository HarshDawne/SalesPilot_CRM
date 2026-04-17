// Property Types & Interfaces

export interface Property {
    id: string;
    name: string;
    developer?: string;
    status: 'planning' | 'under-construction' | 'completed';
    tagline?: string;
    description?: string;
    city?: string;
    area?: string;
    address?: string;
    reraId?: string;
    launchDate?: string;
    expectedCompletion?: string;
    coverImage?: string;
    towersCount?: number;
    totalUnits?: number;
    availableUnits?: number;
    bookedUnits?: number;
    priceFrom?: number;
    metadata?: Record<string, any>;
    createdAt?: string;
    updatedAt?: string;
}

export interface Tower {
    id: string;
    propertyId: string;
    name: string;
    code?: string;
    floors?: number;
    totalUnits?: number;
    availableUnits?: number;
    metadata?: Record<string, any>;
    createdAt?: string;
}

export interface Unit {
    id: string;
    towerId: string;
    propertyId: string;
    label?: string;
    floor?: number;
    sizeSqft?: number;
    bedrooms?: number;
    bathrooms?: number;
    category: 'residential' | 'office' | 'rental' | 'commercial';
    price?: number;
    status: 'available' | 'booked' | 'sold' | 'blocked';
    bookedBy?: {
        name: string;
        contact?: string;
        email?: string;
        bookingDate?: string;
    } | null;
    documents?: PropertyDocument[];
    metadata?: Record<string, any>;
}

export interface PropertyDocument {
    id: string;
    name: string;
    type: 'brochure' | 'floorplan' | 'rera' | 'contract' | 'other';
    url: string;
    uploadedAt?: string;
    size?: number;
}

export interface BrochureParseResult {
    success: boolean;
    property?: Partial<Property> & {
        // Add specific extracted fields that might not be in Property interface yet or are mapped differently
        locality?: string;
        maxFloors?: number;
        pricing?: {
            startingPrice?: number;
            highestPrice?: number;
            pricePerSqft?: number;
        };
        totalTowers?: number;
        possessionDate?: string;
    };
    towers?: Array<Partial<Tower> & { units?: Partial<Unit>[] }>;
    confidence?: number;
    rawText?: string;
    errors?: string[];
    extractedFields?: string[];
    message?: string;
}

export interface PropertyFilters {
    status?: string;
    city?: string;
    category?: string;
    priceMin?: number;
    priceMax?: number;
    availability?: 'available' | 'booked' | 'sold';
    search?: string;
}

export const UNIT_STATUS_CONFIG = {
    available: {
        label: 'Available',
        color: 'emerald',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        dot: 'bg-emerald-500',
        iconColor: 'text-emerald-600'
    },
    booked: {
        label: 'Booked',
        color: 'blue',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        dot: 'bg-blue-500',
        iconColor: 'text-blue-600'
    },
    sold: {
        label: 'Sold',
        color: 'slate',
        bg: 'bg-slate-100',
        border: 'border-slate-200',
        text: 'text-slate-700',
        dot: 'bg-slate-300',
        iconColor: 'text-slate-400'
    },
    blocked: {
        label: 'Blocked',
        color: 'amber',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-800',
        dot: 'bg-amber-400',
        iconColor: 'text-amber-600'
    }
} as const;
