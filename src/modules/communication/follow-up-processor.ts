import fs from 'fs/promises';
import path from 'path';
import { CommunicationRuleEngine } from './rule-engine';

interface FollowUpQueueItem {
    id: string;
    campaignId: string;
    leadId: string;
    jobId: string;
    action: {
        type: string;
        templateId: string;
        scheduledFor: string;
    };
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    retries: number;
    lastError: string | null;
    createdAt: string;
    processedAt: string | null;
}

export class FollowUpProcessor {
    /**
     * Process all pending follow-ups that are due
     */
    static async processPendingFollowUps() {
        try {
            const queuePath = path.join(process.cwd(), 'data', 'follow-up-queue.json');
            const queue: FollowUpQueueItem[] = JSON.parse(await fs.readFile(queuePath, 'utf-8'));

            const now = new Date();
            const due = queue.filter(item =>
                item.status === 'PENDING' &&
                new Date(item.action.scheduledFor) <= now
            );

            console.log(`[FollowUpProcessor] Processing ${due.length} pending follow-ups`);

            for (const item of due) {
                await this.processItem(item, queue);
            }

            // Save updated queue
            await fs.writeFile(queuePath, JSON.stringify(queue, null, 2));

        } catch (error) {
            console.error('[FollowUpProcessor] Error processing queue:', error);
        }
    }

    /**
     * Process a single follow-up item
     */
    private static async processItem(item: FollowUpQueueItem, queue: FollowUpQueueItem[]) {
        const index = queue.findIndex(q => q.id === item.id);
        if (index === -1) return;

        // Mark as processing
        queue[index].status = 'PROCESSING';

        try {
            await CommunicationRuleEngine.executeFollowUp(item);

            // Mark as completed
            queue[index].status = 'COMPLETED';
            queue[index].processedAt = new Date().toISOString();

            console.log(`[FollowUpProcessor] ✅ Completed ${item.action.type} for lead ${item.leadId}`);

        } catch (error: any) {
            console.error(`[FollowUpProcessor] ❌ Failed ${item.action.type} for lead ${item.leadId}:`, error.message);

            // Mark as failed or retry
            queue[index].retries++;
            queue[index].lastError = error.message || String(error);

            if (queue[index].retries >= 3) {
                queue[index].status = 'FAILED';
                queue[index].processedAt = new Date().toISOString();
            } else {
                // Retry after 5 minutes
                queue[index].status = 'PENDING';
                const retryTime = new Date(Date.now() + 5 * 60000);
                queue[index].action.scheduledFor = retryTime.toISOString();
                console.log(`[FollowUpProcessor] 🔄 Retrying in 5 minutes (attempt ${queue[index].retries}/3)`);
            }
        }
    }

    /**
     * Clean up old completed/failed items (older than 7 days)
     */
    static async cleanupOldItems() {
        try {
            const queuePath = path.join(process.cwd(), 'data', 'follow-up-queue.json');
            const queue: FollowUpQueueItem[] = JSON.parse(await fs.readFile(queuePath, 'utf-8'));

            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

            const filtered = queue.filter(item => {
                if (item.status === 'PENDING') return true; // Keep all pending

                const processedDate = item.processedAt ? new Date(item.processedAt) : new Date(0);
                return processedDate > sevenDaysAgo;
            });

            const removed = queue.length - filtered.length;
            if (removed > 0) {
                await fs.writeFile(queuePath, JSON.stringify(filtered, null, 2));
                console.log(`[FollowUpProcessor] Cleaned up ${removed} old items`);
            }

        } catch (error) {
            console.error('[FollowUpProcessor] Error during cleanup:', error);
        }
    }
}
