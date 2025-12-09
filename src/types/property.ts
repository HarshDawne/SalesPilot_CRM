/**
 * Property Management Types - Integrated into CRM
 */

export enum UnitType {
    ONE_BHK = 'ONE_BHK',
    TWO_BHK = 'TWO_BHK',
    THREE_BHK = 'THREE_BHK',
    FOUR_BHK = 'FOUR_BHK',
    SHOP = 'SHOP',
    OFFICE = 'OFFICE',
}

export enum ProjectStatus {
    PLANNING = 'PLANNING',
    UNDER_CONSTRUCTION = 'UNDER_CONSTRUCTION',
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
    ON_HOLD = 'ON_HOLD',
}

export enum BuildingStatus {
    PLANNING = 'PLANNING',
    FOUNDATION = 'FOUNDATION',
    STRUCTURE = 'STRUCTURE',
    FINISHING = 'FINISHING',
    READY = 'READY',
}

export enum UnitStatus {
    AVAILABLE = 'AVAILABLE',
    RESERVED = 'RESERVED',
    NEGOTIATION = 'NEGOTIATION',
    BOOKED = 'BOOKED',
    BLOCKED = 'BLOCKED',
}

export enum DocumentCategory {
    BROCHURE = 'BROCHURE',
    PRICE_SHEET = 'PRICE_SHEET',
    FLOOR_PLAN = 'FLOOR_PLAN',
    RERA_CERTIFICATE = 'RERA_CERTIFICATE',
    LAYOUT = 'LAYOUT',
    OTHER = 'OTHER',
}

export interface Property {
    id: string;
    // Basic Info
    name: string;
    code: string | null;
    status: ProjectStatus;
    projectType: "RESIDENTIAL" | "COMMERCIAL" | "MIXED_USE";
    developerName: string;
    tagline?: string | null;
    description?: string | null;

    // Location
    location: {
        city: string;
        locality: string;
        pincode: string;
        fullAddress: string;
        landmark?: string | null;
        latitude?: number | null;
        longitude?: number | null;
        googleMapsUrl?: string | null;
    };

    // Inventory Config
    totalTowers: number;
    totalUnits: number;
    defaultFloorsPerTower?: number | null;
    minBedrooms?: number | null;
    maxBedrooms?: number | null;
    minAreaSqft?: number | null;
    maxAreaSqft?: number | null;

    // Derived Inventory Constants
    availableUnits: number;
    bookedUnits: number;

    // Regulatory
    reraId: string;
    reraUrl?: string | null;
    reraExpiryDate?: string | null;

    // Dates
    launchDate?: string | null;
    expectedCompletion: string;
    possessionFrom?: string | null;

    // Pricing & Finance
    startingPrice?: number | null;
    pricePerSqftFrom?: number | null;
    pricePerSqftTo?: number | null;
    bookingAmount?: number | null;
    maintenanceChargePerSqft?: number | null;
    gstIncluded?: boolean;
    paymentPlanType?: "CONSTRUCTION_LINKED" | "TIME_LINKED" | "DOWN_PAYMENT" | "FLEXI" | "OTHER";

    // Marketing
    primaryImageUrl?: string | null;
    brochureUrl?: string | null;
    highlights: string[];
    amenities: string[];

    // Flags
    isActive: boolean;
    priorityRank?: number | null;

    createdAt: string;
    updatedAt: string;
    // Keep thumbnail for backward compatibility if needed, or map it to primaryImageUrl
    thumbnailUrl?: string | null;
}

export interface Tower {
    id: string;
    propertyId: string;
    name: string;
    floors: number;
    totalUnits: number;
    availableUnits: number;
    status: BuildingStatus;
    specifications?: {
        height?: string;
        structure?: string;
        amenities?: string[];
    };
    createdAt: string;
    updatedAt: string;
}

export interface Unit {
    id: string;
    towerId: string;
    propertyId: string;
    unitNumber: string;
    floor: number;
    type: UnitType;
    status: UnitStatus;
    carpetArea: number;
    builtUpArea: number;
    facing?: string;
    basePrice: number;
    floorRise: number;
    plcCharges: number;
    totalPrice: number;
    reservation?: UnitReservation;
    specifications?: {
        bedrooms?: number;
        bathrooms?: number;
        balconies?: number;
        parkingSlots?: number;
    };
    // Inventory Intelligence
    inventoryStats?: {
        daysOnMarket: number;
        lastCampaignDate?: string;
        campaignTouchCount: number;
        viewCount: number;
        shortlistCount: number;
        lastImpressionAt?: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface Amenity {
    id: string;
    name: string;
    icon: string;
    category?: string;
}

export interface UnitReservation {
    id: string;
    unitId: string;
    leadId: string;
    reservedBy: string;
    reservedAt: string;
    expiresAt: string;
    canExtend: boolean;
    extendedCount: number;
    maxExtensions: number;
    lockedBy: 'system' | 'admin';
    reason?: string;
    isActive: boolean;
}

export interface PropertyDocument {
    id: string;
    propertyId: string;
    towerId?: string;
    unitId?: string;
    name: string;
    category: DocumentCategory;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    thumbnailUrl?: string;
    uploadedBy: string;
    uploadedAt: string;
}

export interface PropertyMedia {
    id: string;
    propertyId: string;
    towerId?: string;
    unitId?: string;
    type: 'image' | 'video';
    url: string;
    thumbnailUrl?: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    caption?: string;
    order: number;
    uploadedBy: string;
    uploadedAt: string;
}

export interface PricingTemplate {
    id: string;
    propertyId: string;
    name: string;
    basePricePerSqft: number;
    floorRisePercentage: number;
    plcOptions: {
        corner: number;
        parkFacing: number;
        roadFacing: number;
    };
    otherCharges: { name: string; amount: number }[];
    gstPercentage: number;
    registrationCharges: number;
    createdAt: string;
    updatedAt: string;
}

export interface PriceCalculation {
    basePrice: number;
    floorRise: number;
    plcCharges: number;
    otherCharges: number;
    subtotal: number;
    gst: number;
    registration: number;
    totalPrice: number;
    breakdown: { label: string; amount: number }[];
}

export interface PropertyFilter {
    status?: ProjectStatus[];
    city?: string[];
    minPrice?: number;
    maxPrice?: number;
    searchQuery?: string;
}

export interface UnitFilter {
    status?: UnitStatus[];
    type?: UnitType[];
    minPrice?: number;
    maxPrice?: number;
    minArea?: number;
    maxArea?: number;
    floor?: number[];
    propertyId?: string;
    towerId?: string;
    searchQuery?: string;
}

export interface PropertyInventoryStats {
    propertyId: string;
    totalUnits: number;
    available: number;
    reserved: number;
    negotiation: number;
    booked: number;
    blocked: number;
    occupancyRate: number;
}
