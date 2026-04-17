/**
 * Application Constants
 */

import { COLORS } from './design-tokens';

// Unit Types
export const UNIT_TYPES = {
    ONE_BHK: { label: '1 BHK', value: 'ONE_BHK', icon: 'Home' },
    TWO_BHK: { label: '2 BHK', value: 'TWO_BHK', icon: 'Home' },
    THREE_BHK: { label: '3 BHK', value: 'THREE_BHK', icon: 'Home' },
    FOUR_BHK: { label: '4 BHK', value: 'FOUR_BHK', icon: 'Home' },
    SHOP: { label: 'Shop', value: 'SHOP', icon: 'Store' },
    OFFICE: { label: 'Office', value: 'OFFICE', icon: 'Briefcase' },
} as const;

// Status Definitions with Colors
export const PROJECT_STATUS = {
    PLANNING: { label: 'Planning', color: COLORS.status.planning },
    UNDER_CONSTRUCTION: { label: 'Under Construction', color: COLORS.status.construction },
    ACTIVE: { label: 'Active', color: COLORS.status.active },
    COMPLETED: { label: 'Completed', color: COLORS.status.completed },
} as const;

export const BUILDING_STATUS = {
    PLANNING: { label: 'Planning', color: COLORS.status.planning },
    FOUNDATION: { label: 'Foundation', color: COLORS.status.construction },
    STRUCTURE: { label: 'Structure', color: COLORS.status.construction },
    FINISHING: { label: 'Finishing', color: COLORS.status.construction },
    READY: { label: 'Ready', color: COLORS.status.active },
} as const;

export const UNIT_STATUS = {
    AVAILABLE: { label: 'Available', color: COLORS.status.available },
    RESERVED: { label: 'Reserved', color: COLORS.status.reserved },
    NEGOTIATION: { label: 'Negotiation', color: COLORS.status.negotiation },
    BOOKED: { label: 'Booked', color: COLORS.status.booked },
    BLOCKED: { label: 'Blocked', color: COLORS.status.blocked },
} as const;

// Reservation Settings
export const RESERVATION_HOURS = parseInt(process.env.RESERVATION_LOCK_HOURS || '48', 10);
export const MAX_RESERVATION_EXTENSIONS = parseInt(process.env.MAX_RESERVATION_EXTENSIONS || '2', 10);

// Upload Settings
export const MAX_UPLOAD_MB = parseInt(process.env.MAX_UPLOAD_MB || '50', 10);
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const;
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'] as const;
export const ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;

// Document Categories
export const DOCUMENT_CATEGORIES = {
    BROCHURE: 'Brochure',
    PRICE_SHEET: 'Price Sheet',
    FLOOR_PLAN: 'Floor Plan',
    RERA_CERTIFICATE: 'RERA Certificate',
    LAYOUT: 'Layout',
    OTHER: 'Other',
} as const;

// 3D Render License Types
export const LICENSE_TYPES = {
    VIEW_ONLY: { label: 'View Only', price: 5000, description: 'View online only' },
    DOWNLOAD: { label: 'Download', price: 10000, description: 'Download and save' },
    COMMERCIAL: { label: 'Commercial Use', price: 25000, description: 'Use for marketing' },
} as const;

// Filter Options
export const PROPERTY_FILTERS = {
    ALL: 'All Projects',
    ACTIVE: 'Active',
    UNDER_CONSTRUCTION: 'Under Construction',
    COMPLETED: 'Completed',
} as const;

export const UNIT_FILTERS = {
    ALL: 'All',
    AVAILABLE: 'Available',
    RESERVED: 'Reserved',
    BOOKED: 'Booked',
    BLOCKED: 'Blocked',
} as const;

// Sort Options
export const SORT_OPTIONS = {
    NAME_ASC: 'Name (A-Z)',
    NAME_DESC: 'Name (Z-A)',
    DATE_ASC: 'Oldest First',
    DATE_DESC: 'Newest First',
    PRICE_ASC: 'Price (Low to High)',
    PRICE_DESC: 'Price (High to Low)',
} as const;

// Roles for RBAC
export const ROLES = {
    ADMIN: 'ADMIN',
    AGENT: 'AGENT',
    VIEWER: 'VIEWER',
} as const;

// Permissions
export const PERMISSIONS = {
    // Projects
    ADD_PROJECT: 'add_project',
    EDIT_PROJECT: 'edit_project',
    DELETE_PROJECT: 'delete_project',

    // Buildings
    ADD_BUILDING: 'add_building',
    EDIT_BUILDING: 'edit_building',
    DELETE_BUILDING: 'delete_building',

    // Units
    ADD_UNIT: 'add_unit',
    EDIT_UNIT: 'edit_unit',
    DELETE_UNIT: 'delete_unit',
    RESERVE_UNIT: 'reserve_unit',
    BOOK_UNIT: 'book_unit',

    // Documents
    UPLOAD_DOCUMENT: 'upload_document',
    DELETE_DOCUMENT: 'delete_document',

    // Media
    UPLOAD_MEDIA: 'upload_media',
    DELETE_MEDIA: 'delete_media',

    // 3D Renders
    PURCHASE_3D_RENDER: 'purchase_3d_render',

    // Admin
    ADMIN_OVERRIDE: 'admin_override',
} as const;
