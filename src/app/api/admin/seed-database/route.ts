import { NextRequest, NextResponse } from 'next/server';
import { seedAllData } from '@/lib/seed-database';

/**
 * API Route to seed the database with demo data
 * GET /api/admin/seed-database
 */
export async function GET(request: NextRequest) {
    try {
        // In production, add authentication check here
        // const session = await getServerSession();
        // if (!session || session.user.role !== 'admin') {
        //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

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
