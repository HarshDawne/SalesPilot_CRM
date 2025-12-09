'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateCampaignPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        lead_query: 'all', // Simplified
        script_id: 'script_1',
        mode: 'ai_call',
        concurrency: 5
    });
    const [dryRunResult, setDryRunResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleDryRun = async () => {
        // Mock dry run call
        setDryRunResult({
            total_leads: 100,
            estimated_cost: 20.00,
            warnings: []
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/comm/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                const campaign = await res.json();
                router.push(`/communication/${campaign.id}`);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Create New Campaign</h1>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
                <div>
                    <label className="block text-sm font-medium mb-1">Campaign Name</label>
                    <input
                        type="text"
                        className="w-full border rounded p-2"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Mode</label>
                        <select
                            className="w-full border rounded p-2"
                            value={formData.mode}
                            onChange={e => setFormData({ ...formData, mode: e.target.value })}
                        >
                            <option value="ai_call">AI Voice Call</option>
                            <option value="human_call">Human Power Dialer</option>
                            <option value="whatsapp_blast">WhatsApp Blast</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Concurrency</label>
                        <input
                            type="number"
                            className="w-full border rounded p-2"
                            value={formData.concurrency}
                            onChange={e => setFormData({ ...formData, concurrency: parseInt(e.target.value) })}
                        />
                    </div>
                </div>

                <div className="flex justify-between items-center pt-4">
                    <button
                        type="button"
                        onClick={handleDryRun}
                        className="text-blue-600 hover:underline"
                    >
                        Run Dry Run & Cost Estimate
                    </button>

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Campaign'}
                    </button>
                </div>

                {dryRunResult && (
                    <div className="mt-4 p-4 bg-gray-50 rounded border">
                        <h3 className="font-semibold">Dry Run Results</h3>
                        <p>Total Leads: {dryRunResult.total_leads}</p>
                        <p>Est. Cost: ${dryRunResult.estimated_cost}</p>
                    </div>
                )}
            </form>
        </div>
    );
}
