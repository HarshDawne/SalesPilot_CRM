import { NextRequest, NextResponse } from 'next/server';
import { db } from './db';

// Mock function to get current user from request
// In real app, this would parse JWT or session cookie
export async function getCurrentUser(req: NextRequest) {
    // For demo, we'll assume a header 'x-user-id' is passed, or default to a system admin
    const userId = req.headers.get('x-user-id') || 'user-1'; // Default to first user
    const user = db.users.findById(userId);
    return user || null;
}

export function hasRole(user: any, requiredRole: string | string[]) {
    if (!user) return false;
    if (Array.isArray(requiredRole)) {
        return requiredRole.includes(user.role);
    }
    return user.role === requiredRole;
}

export async function requireRole(req: NextRequest, role: string | string[]) {
    const user = await getCurrentUser(req);
    if (!user || !hasRole(user, role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    return null; // Authorized
}
