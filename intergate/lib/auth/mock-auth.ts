/**
 * Mock Authentication System
 * For development and testing purposes
 * Replace with real authentication (NextAuth.js, Clerk, etc.) in production
 */

import { ROLES } from '../constants';
import type { User, Role } from './rbac';

// Mock current user (in real app, this would come from session/JWT)
let currentMockUser: User = {
    id: 'user-admin-001',
    name: 'Admin User',
    email: 'admin@hypersell.com',
    role: ROLES.ADMIN,
    createdAt: new Date(),
};

/**
 * Get current user (mock)
 */
export function getCurrentUser(): User {
    return currentMockUser;
}

/**
 * Set current user (for testing role switching)
 */
export function setCurrentUser(user: User): void {
    currentMockUser = user;
}

/**
 * Switch role (for testing)
 */
export function switchRole(role: Role): void {
    currentMockUser = {
        ...currentMockUser,
        role,
    };
}

/**
 * Mock user data
 */
export const MOCK_USERS: User[] = [
    {
        id: 'user-admin-001',
        name: 'Admin User',
        email: 'admin@hypersell.com',
        role: ROLES.ADMIN,
        createdAt: new Date('2024-01-01'),
    },
    {
        id: 'user-agent-001',
        name: 'Sales Agent',
        email: 'agent@hypersell.com',
        role: ROLES.AGENT,
        createdAt: new Date('2024-01-15'),
    },
    {
        id: 'user-viewer-001',
        name: 'Property Viewer',
        email: 'viewer@hypersell.com',
        role: ROLES.VIEWER,
        createdAt: new Date('2024-02-01'),
    },
];

/**
 * Check if user is authenticated (mock always returns true)
 */
export function isAuthenticated(): boolean {
    return true;
}

/**
 * Login (mock)
 */
export async function login(email: string): Promise<User> {
    const user = MOCK_USERS.find(u => u.email === email);
    if (!user) {
        throw new Error('User not found');
    }

    currentMockUser = user;
    return user;
}

/**
 * Logout (mock)
 */
export async function logout(): Promise<void> {
    // Reset to default admin user
    currentMockUser = MOCK_USERS[0];
}
