import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/modules/communication/analytics-service';

export async function GET(request: NextRequest) {
    try {
        const stats = AnalyticsService.getGlobalStats();
        const recentActivity = await AnalyticsService.getRecentActivity(20);

        return NextResponse.json({
            stats,
            recentActivity
        });
    } catch (error) {
        console.error("Analytics API Error:", error);
        return NextResponse.json({
            error: "Failed to fetch analytics",
            details: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}
