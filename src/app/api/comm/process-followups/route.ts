import { NextRequest, NextResponse } from 'next/server';
import { FollowUpProcessor } from '@/modules/communication/follow-up-processor';

/**
 * Cron endpoint to process pending follow-ups
 * Call this every minute: GET /api/comm/process-followups
 * You can use Vercel Cron Jobs or external cron service
 */
export async function GET(request: NextRequest) {
    try {
        console.log('[FollowUpCron] Starting follow-up processing...');

        // Process pending follow-ups
        await FollowUpProcessor.processPendingFollowUps();

        // Clean up old items (run less frequently, e.g. once daily)
        const url = new URL(request.url);
        if (url.searchParams.get('cleanup') === 'true') {
            await FollowUpProcessor.cleanupOldItems();
        }

        console.log('[FollowUpCron] ✅ Processing complete');

        return NextResponse.json({
            success: true,
            message: 'Follow-ups processed successfully',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[FollowUpCron] Error processing follow-ups:', error);
        return NextResponse.json({
            success: false,
            error: String(error)
        }, { status: 500 });
    }
}
