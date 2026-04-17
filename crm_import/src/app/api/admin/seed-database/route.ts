import { NextRequest, NextResponse } from 'next/server';
import { seedAllData } from '@/lib/seed-database';
import { requireRole } from '@/lib/auth';

/**
 * API Route to seed the database with demo data
 * GET /api/admin/seed-database
 */
export async function GET(request: NextRequest) {
    try {
        const authError = await requireRole(request, 'admin');
        if (authError) return authError;

        const result = await seedAllData();

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: 'Database seeded successfully',
                data: result.counts,
            });
        } else {
            return NextResponse.json({
                success: false,
                error: result.error,
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Error in seed-database API:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    // Same as GET, but allows for custom seed data in the future
    return GET(request);
}
