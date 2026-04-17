
import fs from 'fs';
import path from 'path';

const RECORDS_FILE = path.join(process.cwd(), 'data', 'call-records.json');

export class AnalyticsService {
    private static getRecords() {
        if (!fs.existsSync(RECORDS_FILE)) return [];
        try {
            const data = JSON.parse(fs.readFileSync(RECORDS_FILE, 'utf-8'));
            return data.records || [];
        } catch (e) {
            console.error("Error reading records file:", e);
            return [];
        }
    }

    static getGlobalStats() {
        const records = this.getRecords();
        const totalCalls = records.length;

        const completed = records.filter((r: any) => r.status === 'completed').length;
        const failed = records.filter((r: any) => r.status === 'failed').length;
        const inProgress = records.filter((r: any) => r.status === 'initiated' || r.status === 'in_progress').length;

        const successRate = totalCalls > 0 ? Math.round((completed / totalCalls) * 100) : 0;

        return {
            totalCalls,
            activeCalls: inProgress,
            completedCalls: completed,
            failedCalls: failed,
            successRate,
            totalDurationMinutes: Math.floor(records.reduce((acc: number, r: any) => {
                return acc + (r.duration || 0);
            }, 0) / 60)
        };
    }

    static async getRecentActivity(limit = 20) {
        const records = this.getRecords();
        // Dynamic import to avoid circular dependencies if any, though Lead is safe
        const { Lead } = await import('@/modules/leads/db');

        const sorted = records
            .sort((a: any, b: any) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            })
            .slice(0, limit);

        const enriched = await Promise.all(sorted.map(async (r: any) => {
            let name = r.metadata?.leadName;
            if (!name || name.startsWith('Lead ')) {
                const lead = await Lead.getById(r.leadId);
                if (lead) name = lead.name;
            }

            return {
                id: r.id,
                status: r.status,
                leadName: name || `Lead ${r.leadId?.slice(0, 8)}`,
                outcome: r.outcome || r.status,
                createdAt: r.createdAt
            };
        }));

        return enriched;
    }
}
