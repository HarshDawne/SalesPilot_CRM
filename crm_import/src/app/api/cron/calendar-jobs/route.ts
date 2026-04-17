import { NextRequest, NextResponse } from 'next/server';
import { processReminders } from '@/lib/calendar/reminder-processor';
import { detectNoShows } from '@/lib/calendar/no-show-detector';

/**
 * POST /api/cron/calendar-jobs
 * Background job endpoint for calendar automation
 * Should be called every 5 minutes by a cron service (Vercel Cron, etc.)
 */
export async function POST(request: NextRequest) {
    // Verify cron secret
    const secret = request.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET || 'dev-secret-change-in-production';

    if (secret !== expectedSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startTime = Date.now();
    const results: any = {
        timestamp: new Date().toISOString(),
        jobs: []
    };

    try {
        // 1. Process due reminders
        console.log('[CRON] Processing reminders...');
        const reminderResults = await processReminders();
        results.jobs.push({
            name: 'process_reminders',
            ...reminderResults,
            duration_ms: Date.now() - startTime
        });

        // 2. Detect no-shows
        console.log('[CRON] Detecting no-shows...');
        const noShowResults = await detectNoShows();
        results.jobs.push({
            name: 'detect_no_shows',
            ...noShowResults,
            duration_ms: Date.now() - startTime
        });

        // 3. TODO: Token refresh (Sprint 3)
        // 4. TODO: Full Google Calendar sync (Sprint 3)

        results.total_duration_ms = Date.now() - startTime;
        results.success = true;

        console.log('[CRON] Calendar jobs completed:', results);

        return NextResponse.json(results);

    } catch (error: any) {
        console.error('[CRON] Calendar jobs failed:', error);

        return NextResponse.json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime
        }, { status: 500 });
    }
}

/**
 * GET /api/cron/calendar-jobs
 * Get cron job status and stats
 */
export async function GET(request: NextRequest) {
    const { getReminderStats } = await import('@/lib/calendar/reminder-processor');
    const { getNoShowStats } = await import('@/lib/calendar/no-show-detector');

    const reminderStats = getReminderStats();
    const noShowStats = getNoShowStats(30);

    return NextResponse.json({
        reminder_stats: reminderStats,
        no_show_stats: noShowStats,
        next_run: 'Every 5 minutes',
        status: 'active'
    });
}
