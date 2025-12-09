import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const authError = await requireRole(request, ['admin', 'manager']);
    if (authError) return authError;

    try {
        const { id } = await params;
        const campaign = db.campaigns.findById(id);
        if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

        // Calculate detailed metrics
        const jobs = db.campaignJobs.findByCampaignId(id);

        const metrics = {
            total_leads: jobs.length,
            status_breakdown: {
                pending: jobs.filter(j => j.status === 'pending').length,
                processing: jobs.filter(j => j.status === 'processing').length,
                completed: jobs.filter(j => j.status === 'completed').length,
                failed: jobs.filter(j => j.status === 'failed').length,
                retrying: jobs.filter(j => j.status === 'retrying').length
            },
            // In real app, we'd aggregate call durations and costs from CallActivities
            estimated_cost: campaign.metrics.attempted * 0.10, // Mock cost
            conversion_rate: campaign.metrics.connected > 0
                ? (campaign.metrics.qualified / campaign.metrics.connected) * 100
                : 0
        };

        return NextResponse.json({
            campaign_id: id,
            name: campaign.name,
            metrics: { ...campaign.metrics, ...metrics }
        });

    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
