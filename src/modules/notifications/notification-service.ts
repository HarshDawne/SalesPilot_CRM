import fs from 'fs/promises';
import path from 'path';

export interface Notification {
    id: string;
    type: 'VISIT_BOOKED' | 'VISIT_REMINDER' | 'CALL_COMPLETED' | 'LEAD_UPDATED' | 'CAMPAIGN_MILESTONE';
    title: string;
    message: string;
    link?: string; // Where to navigate when clicked
    read: boolean;
    createdAt: string;

    // Context data
    leadId?: string;
    visitId?: string;
    campaignId?: string;
    jobId?: string;
}

export class NotificationService {
    private static NOTIFICATIONS_FILE = path.join(process.cwd(), 'data', 'notifications.json');

    /**
     * Create a new notification
     */
    static async createNotification(notification: Omit<Notification, 'id' | 'read' | 'createdAt'>): Promise<Notification> {
        const notifications = await this.loadNotifications();

        const newNotification: Notification = {
            ...notification,
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            read: false,
            createdAt: new Date().toISOString()
        };

        notifications.unshift(newNotification); // Add to beginning

        // Keep only last 100 notifications
        if (notifications.length > 100) {
            notifications.splice(100);
        }

        await this.saveNotifications(notifications);

        console.log(`[NotificationService] ✅ Created notification: ${notification.title}`);

        return newNotification;
    }

    /**
     * Get all unread notifications
     */
    static async getUnreadNotifications(): Promise<Notification[]> {
        const notifications = await this.loadNotifications();
        return notifications.filter(n => !n.read);
    }

    /**
     * Get recent notifications (last 20)
     */
    static async getRecentNotifications(limit: number = 20): Promise<Notification[]> {
        const notifications = await this.loadNotifications();
        return notifications.slice(0, limit);
    }

    /**
     * Mark notification as read
     */
    static async markAsRead(id: string): Promise<void> {
        const notifications = await this.loadNotifications();
        const notification = notifications.find(n => n.id === id);

        if (notification) {
            notification.read = true;
            await this.saveNotifications(notifications);
        }
    }

    /**
     * Mark all as read
     */
    static async markAllAsRead(): Promise<void> {
        const notifications = await this.loadNotifications();
        notifications.forEach(n => n.read = true);
        await this.saveNotifications(notifications);
    }

    /**
     * Helper: Notify visit booked
     */
    static async notifyVisitBooked(visit: {
        id: string;
        leadName: string;
        propertyName: string;
        scheduledDate: string;
        scheduledTime: string;
    }): Promise<void> {
        await this.createNotification({
            type: 'VISIT_BOOKED',
            title: '🏠 New Site Visit Booked',
            message: `${visit.leadName} scheduled visit to ${visit.propertyName} on ${this.formatDate(visit.scheduledDate)} at ${visit.scheduledTime}`,
            link: `/calendar?visit=${visit.id}`,
            visitId: visit.id
        });
    }

    /**
     * Helper: Notify call completed
     */
    static async notifyCallCompleted(call: {
        id: string;
        leadName: string;
        outcome: string;
        sentiment?: string;
    }): Promise<void> {
        const emoji = call.sentiment === 'POSITIVE' ? '✅' : call.sentiment === 'NEGATIVE' ? '❌' : '📞';

        await this.createNotification({
            type: 'CALL_COMPLETED',
            title: `${emoji} Call Completed`,
            message: `Call with ${call.leadName} completed (${call.outcome})`,
            link: `/communication?job=${call.id}`,
            jobId: call.id
        });
    }

    /**
     * Format date for display
     */
    private static formatDate(dateStr: string): string {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }

    /**
     * Load notifications from file
     */
    private static async loadNotifications(): Promise<Notification[]> {
        try {
            const content = await fs.readFile(this.NOTIFICATIONS_FILE, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            return [];
        }
    }

    /**
     * Save notifications to file
     */
    private static async saveNotifications(notifications: Notification[]): Promise<void> {
        await fs.writeFile(this.NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2));
    }
}
