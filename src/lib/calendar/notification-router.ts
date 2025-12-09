// ============================================================================
// NOTIFICATION ROUTER WITH MULTI-CHANNEL FALLBACK
// ============================================================================

import { db, NotificationPreference } from '../db';

export type NotificationChannel = 'whatsapp' | 'sms' | 'email' | 'push';

export interface NotificationResult {
    success: boolean;
    channel?: NotificationChannel;
    error?: string;
    attempts: { channel: NotificationChannel; success: boolean; error?: string }[];
}

/**
 * Send notification via specific channel
 */
async function sendViaChannel(
    channel: NotificationChannel,
    recipient: { phone?: string; email?: string; userId?: string },
    message: string,
    subject?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        switch (channel) {
            case 'whatsapp':
                if (!recipient.phone) {
                    return { success: false, error: 'No phone number' };
                }

                // Use Communication Engine WhatsApp API
                const waResponse = await fetch('http://localhost:3000/api/comm/whatsapp/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        lead_id: recipient.userId,
                        phone: recipient.phone,
                        message,
                        template_id: 'visit_reminder'
                    })
                });

                if (waResponse.ok) {
                    return { success: true };
                }
                return { success: false, error: `WhatsApp API error: ${waResponse.status}` };

            case 'sms':
                if (!recipient.phone) {
                    return { success: false, error: 'No phone number' };
                }

                // TODO: Integrate with SMS provider (Twilio, etc.)
                console.log(`[SMS] To: ${recipient.phone}, Message: ${message}`);
                return { success: true }; // Mock success for now

            case 'email':
                if (!recipient.email) {
                    return { success: false, error: 'No email address' };
                }

                // TODO: Integrate with email provider (SendGrid, etc.)
                console.log(`[EMAIL] To: ${recipient.email}, Subject: ${subject}, Message: ${message}`);
                return { success: true }; // Mock success for now

            case 'push':
                if (!recipient.userId) {
                    return { success: false, error: 'No user ID' };
                }

                // TODO: Integrate with push notification service (FCM, etc.)
                console.log(`[PUSH] To: ${recipient.userId}, Message: ${message}`);
                return { success: true }; // Mock success for now

            default:
                return { success: false, error: 'Unknown channel' };
        }
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get notification preferences for a user
 */
function getNotificationPreferences(userId: string): NotificationChannel[] {
    const prefs = db.notificationPreferences.findByUserId(userId);

    if (prefs && prefs.channel_priority.length > 0) {
        return prefs.channel_priority;
    }

    // Default priority: WhatsApp → SMS → Email → Push
    return ['whatsapp', 'sms', 'email', 'push'];
}

/**
 * Check if we're in quiet hours
 */
function isQuietHours(userId: string): boolean {
    const prefs = db.notificationPreferences.findByUserId(userId);

    if (!prefs || !prefs.quiet_hours) {
        return false;
    }

    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5); // "HH:MM"

    return currentTime >= prefs.quiet_hours.start && currentTime < prefs.quiet_hours.end;
}

/**
 * Send notification with automatic fallback across channels
 */
export async function sendNotification(
    recipient: {
        userId: string;
        phone?: string;
        email?: string;
    },
    message: string,
    subject?: string,
    options?: {
        respectQuietHours?: boolean;
        maxAttempts?: number;
    }
): Promise<NotificationResult> {
    const { respectQuietHours = true, maxAttempts = 4 } = options || {};

    // Check quiet hours
    if (respectQuietHours && isQuietHours(recipient.userId)) {
        return {
            success: false,
            error: 'In quiet hours',
            attempts: []
        };
    }

    const channelPriority = getNotificationPreferences(recipient.userId);
    const attempts: { channel: NotificationChannel; success: boolean; error?: string }[] = [];

    // Try each channel in priority order
    for (let i = 0; i < Math.min(channelPriority.length, maxAttempts); i++) {
        const channel = channelPriority[i];

        const result = await sendViaChannel(channel, recipient, message, subject);
        attempts.push({ channel, ...result });

        if (result.success) {
            return {
                success: true,
                channel,
                attempts
            };
        }

        // Log failure and continue to next channel
        console.warn(`Failed to send via ${channel}: ${result.error}`);
    }

    // All channels failed
    return {
        success: false,
        error: 'All notification channels failed',
        attempts
    };
}

/**
 * Send bulk notifications (for campaigns)
 */
export async function sendBulkNotifications(
    recipients: Array<{
        userId: string;
        phone?: string;
        email?: string;
    }>,
    message: string,
    subject?: string
): Promise<{
    total: number;
    successful: number;
    failed: number;
    results: Array<{ userId: string; result: NotificationResult }>;
}> {
    const results: Array<{ userId: string; result: NotificationResult }> = [];
    let successful = 0;
    let failed = 0;

    for (const recipient of recipients) {
        const result = await sendNotification(recipient, message, subject);
        results.push({ userId: recipient.userId, result });

        if (result.success) {
            successful++;
        } else {
            failed++;
        }

        // Rate limiting: wait 100ms between sends
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
        total: recipients.length,
        successful,
        failed,
        results
    };
}
