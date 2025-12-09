'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function CampaignDashboard() {
    const { id } = useParams();
    const [campaign, setCampaign] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchCampaign = async () => {
        try {
            // In real app, fetch specific campaign by ID
            const res = await fetch('/api/comm/campaigns');
            const data = await res.json();
            // Safety check if API returns wrapped object or array
            const campaigns = Array.isArray(data) ? data : (data.campaigns || []);
            const found = campaigns.find((c: any) => c.id === id);
            setCampaign(found);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaign();
        const interval = setInterval(fetchCampaign, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, [id]);

    const handleStart = async () => {
        await fetch(`/api/comm/campaigns/${id}/start`, { method: 'POST' });
        fetchCampaign();
    };

    if (loading) return <div>Loading...</div>;
    if (!campaign) return <div>Campaign not found</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">{campaign.name}</h1>
                    <span className={`inline-block px-2 py-1 rounded text-sm mt-2 ${campaign.status === 'running' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {campaign.status.toUpperCase()}
                    </span>
                </div>
                {campaign.status === 'draft' && (
                    <button
                        onClick={handleStart}
                        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                    >
                        Start Campaign
                    </button>
                )}
            </div>

            <div className="grid grid-cols-4 gap-6 mb-8">
                <MetricCard label="Total Leads" value={campaign.metrics.total} />
                <MetricCard label="Attempted" value={campaign.metrics.attempted} />
                <MetricCard label="Connected" value={campaign.metrics.connected} />
                <MetricCard label="Qualified" value={campaign.metrics.qualified} />
            </div>

            {/* Placeholder for Job List */}
            <div className="bg-white rounded shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Live Job Feed</h3>
                <div className="text-gray-500 text-center py-8">
                    Job list would appear here...
                </div>
            </div>
        </div>
    );
}

function MetricCard({ label, value }: { label: string, value: number }) {
    return (
        <div className="bg-white p-6 rounded shadow">
            <div className="text-gray-500 text-sm mb-1">{label}</div>
            <div className="text-3xl font-bold">{value}</div>
        </div>
    );
}
