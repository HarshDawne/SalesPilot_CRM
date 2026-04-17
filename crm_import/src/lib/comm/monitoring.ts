import { db } from '@/lib/db';

export function checkSystemHealth() {
    const alerts = [];

    // 1. Check Queue Backlog
    const pendingJobs = db.campaignJobs.findPending();
    if (pendingJobs.length > 1000) {
        alerts.push({
            severity: 'high',
            message: `High queue backlog: ${pendingJobs.length} jobs pending`
        });
    }

    // 2. Check Webhook Failures (Mock check)
    // In real app, query recent failed webhooks from DB/Logs

    // 3. Check Campaign Failure Rates
    const runningCampaigns = db.campaigns.findAll().filter(c => c.status === 'running');
    for (const camp of runningCampaigns) {
        const failureRate = camp.metrics.attempted > 0
            ? (camp.metrics.failed / camp.metrics.attempted)
            : 0;

        if (failureRate > 0.2) { // > 20% failure
            alerts.push({
                severity: 'critical',
                message: `Campaign ${camp.name} has high failure rate: ${(failureRate * 100).toFixed(1)}%`
            });
        }
    }

    return alerts;
}
