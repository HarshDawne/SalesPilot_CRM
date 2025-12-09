/**
 * TypeScript Type Definitions for Property Management OS
 */

// ============================================================================
// ENUMS
// ============================================================================

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

export enum LicenseType {
    VIEW_ONLY = 'VIEW_ONLY',
    DOWNLOAD = 'DOWNLOAD',
    COMMERCIAL = 'COMMERCIAL',
}

// ============================================================================
// CORE ENTITIES
// ============================================================================

export interface Project {
    id: string;
    name: string;
    description: string;
    location: {
        city: string;
        area: string;
        address: string;
        pincode: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
    status: ProjectStatus;
    thumbnailUrl?: string;
    bannerUrl?: string;
    totalTowers: number;
    totalUnits: number;
    availableUnits: number;
    bookedUnits: number;
    amenities: Amenity[];
    highlights: string[];
    startDate: Date;
    expectedCompletion?: Date;
    reraNumber?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Building {
    id: string;
    projectId: string;
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
    createdAt: Date;
    updatedAt: Date;
}

export interface Unit {
    id: string;
    buildingId: string;
    projectId: string;
    unitNumber: string;
    floor: number;
    type: UnitType;
    status: UnitStatus;
    carpetArea: number;      // in sqft
    builtUpArea: number;     // in sqft  
    facing?: string;         // North, South, etc.
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
    createdAt: Date;
    updatedAt: Date;
}

export interface Amenity {
    id: string;
    name: string;
    icon: string;           // Lucide icon name
    category?: string;
}

// ============================================================================
// RESERVATION SYSTEM
// ============================================================================

export interface UnitReservation {
    id: string;
    unitId: string;
    reservedBy: string;     // User ID
    reservedAt: Date;
    expiresAt: Date;
    canExtend: boolean;
    extendedCount: number;
    maxExtensions: number;  // Usually 2
    lockedBy: 'system' | 'admin';
    reason?: string;        // For admin locks
    isActive: boolean;
}

// ============================================================================
// 3D RENDER SYSTEM
// ============================================================================

export interface ThreeDRender {
    id: string;
    projectId: string;
    buildingId?: string;
    name: string;
    description: string;
    thumbnailUrl: string;
    watermarkedPreviewUrl?: string;  // Watermarked preview
    videoUrl?: string;               // Full quality video
    modelUrl?: string;               // Interactive 3D model URL
    purchasedBy: string | null;      // User ID
    purchaseDate: Date | null;
    licenseType: LicenseType | null;
    price: number;
    previewAllowed: boolean;         // Can view watermarked version
    receiptId: string | null;        // Link to invoice document
    features: string[];
    duration?: number;               // Video duration in seconds
    createdAt: Date;
    updatedAt: Date;
}

export interface RenderPurchase {
    id: string;
    renderId: string;
    userId: string;
    licenseType: LicenseType;
    amount: number;
    transactionId?: string;
    receiptUrl?: string;
    purchasedAt: Date;
}

// ============================================================================
// DOCUMENTS & MEDIA
// ============================================================================

export interface Document {
    id: string;
    projectId: string;
    buildingId?: string;
    name: string;
    category: DocumentCategory;
    fileUrl: string;
    fileName: string;
    fileSize: number;        // in bytes
    mimeType: string;
    thumbnailUrl?: string;
    uploadedBy: string;      // User ID
    uploadedAt: Date;
}

export interface Media {
    id: string;
    projectId: string;
    buildingId?: string;
    type: 'image' | 'video';
    url: string;
    thumbnailUrl?: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    caption?: string;
    order: number;           // Display order
    uploadedBy: string;
    uploadedAt: Date;
}

// ============================================================================
// PRICING
// ============================================================================

export interface PricingTemplate {
    id: string;
    projectId: string;
    name: string;
    basePricePerSqft: number;
    floorRisePercentage: number;     // Per floor
    plcOptions: {
        corner: number;                // Premium for corner units
        parkFacing: number;
        roadFacing: number;
    };
    otherCharges: {
        name: string;
        amount: number;
    }[];
    gstPercentage: number;
    registrationCharges: number;
    createdAt: Date;
    updatedAt: Date;
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
    breakdown: {
        label: string;
        amount: number;
    }[];
}

// ============================================================================
// USER & ROLES
// ============================================================================

export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: 'ADMIN' | 'AGENT' | 'VIEWER';
    avatar?: string;
    createdAt: Date;
}

// ============================================================================
// FILTERS & SEARCH
// ============================================================================

export interface ProjectFilter {
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
    searchQuery?: string;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
    timestamp: number;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}
