import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/modules/notifications/notification-service';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');

        const notifications = await NotificationService.getRecentNotifications(limit);
        const unreadCount = (await NotificationService.getUnreadNotifications()).length;

        return NextResponse.json({ notifications, unreadCount });

    } catch (error) {
        console.error('[Notifications API] Error fetching notifications:', error);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { action, notificationId } = await request.json();

        if (action === 'markAsRead' && notificationId) {
            await NotificationService.markAsRead(notificationId);
        } else if (action === 'markAllAsRead') {
            await NotificationService.markAllAsRead();
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[Notifications API] Error:', error);
        return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
    }
}
