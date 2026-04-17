/**
 * Role-Based Access Control (RBAC) System
 */

import { ROLES, PERMISSIONS } from '../constants';

export type Role = typeof ROLES[keyof typeof ROLES];
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    createdAt: Date;
}

/**
 * Role-Permission mapping
 */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    [ROLES.ADMIN]: [
        // All permissions
        PERMISSIONS.ADD_PROJECT,
        PERMISSIONS.EDIT_PROJECT,
        PERMISSIONS.DELETE_PROJECT,
        PERMISSIONS.ADD_BUILDING,
        PERMISSIONS.EDIT_BUILDING,
        PERMISSIONS.DELETE_BUILDING,
        PERMISSIONS.ADD_UNIT,
        PERMISSIONS.EDIT_UNIT,
        PERMISSIONS.DELETE_UNIT,
        PERMISSIONS.RESERVE_UNIT,
        PERMISSIONS.BOOK_UNIT,
        PERMISSIONS.UPLOAD_DOCUMENT,
        PERMISSIONS.DELETE_DOCUMENT,
        PERMISSIONS.UPLOAD_MEDIA,
        PERMISSIONS.DELETE_MEDIA,
        PERMISSIONS.PURCHASE_3D_RENDER,
        PERMISSIONS.ADMIN_OVERRIDE,
    ],
    [ROLES.AGENT]: [
        // Agent permissions (can manage but not delete)
        PERMISSIONS.ADD_PROJECT,
        PERMISSIONS.EDIT_PROJECT,
        PERMISSIONS.ADD_BUILDING,
        PERMISSIONS.EDIT_BUILDING,
        PERMISSIONS.ADD_UNIT,
        PERMISSIONS.EDIT_UNIT,
        PERMISSIONS.RESERVE_UNIT,
        PERMISSIONS.BOOK_UNIT,
        PERMISSIONS.UPLOAD_DOCUMENT,
        PERMISSIONS.UPLOAD_MEDIA,
        PERMISSIONS.PURCHASE_3D_RENDER,
    ],
    [ROLES.VIEWER]: [
        // Viewer permissions (read-only plus purchase)
        PERMISSIONS.PURCHASE_3D_RENDER,
    ],
};

/**
 * Check if user has a specific permission
 */
export function hasPermission(userRole: Role, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[userRole] || [];
    return permissions.includes(permission);
}

/**
 * Check if user can add project
 */
export function canAddProject(userRole: Role): boolean {
    return hasPermission(userRole, PERMISSIONS.ADD_PROJECT);
}

/**
 * Check if user can edit project
 */
export function canEditProject(userRole: Role): boolean {
    return hasPermission(userRole, PERMISSIONS.EDIT_PROJECT);
}

/**
 * Check if user can delete project
 */
export function canDeleteProject(userRole: Role): boolean {
    return hasPermission(userRole, PERMISSIONS.DELETE_PROJECT);
}

/**
 * Check if user can add building
 */
export function canAddBuilding(userRole: Role): boolean {
    return hasPermission(userRole, PERMISSIONS.ADD_BUILDING);
}

/**
 * Check if user can edit unit
 */
export function canEditUnit(userRole: Role): boolean {
    return hasPermission(userRole, PERMISSIONS.EDIT_UNIT);
}

/**
 * Check if user can delete unit
 */
export function canDeleteUnit(userRole: Role): boolean {
    return hasPermission(userRole, PERMISSIONS.DELETE_UNIT);
}

/**
 * Check if user can reserve unit
 */
export function canReserveUnit(userRole: Role): boolean {
    return hasPermission(userRole, PERMISSIONS.RESERVE_UNIT);
}

/**
 * Check if user can book unit
 */
export function canBookUnit(userRole: Role): boolean {
    return hasPermission(userRole, PERMISSIONS.BOOK_UNIT);
}

/**
 * Check if user can delete document
 */
export function canDeleteDocument(userRole: Role): boolean {
    return hasPermission(userRole, PERMISSIONS.DELETE_DOCUMENT);
}

/**
 * Check if user can delete media
 */
export function canDeleteMedia(userRole: Role): boolean {
    return hasPermission(userRole, PERMISSIONS.DELETE_MEDIA);
}

/**
 * Check if user can purchase 3D render
 */
export function canPurchase3DRender(userRole: Role): boolean {
    return hasPermission(userRole, PERMISSIONS.PURCHASE_3D_RENDER);
}

/**
 * Check if user has admin override permission
 */
export function hasAdminOverride(userRole: Role): boolean {
    return hasPermission(userRole, PERMISSIONS.ADMIN_OVERRIDE);
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
}
