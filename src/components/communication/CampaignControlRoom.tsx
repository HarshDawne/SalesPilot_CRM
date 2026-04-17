'use client';

import { useState, useEffect } from 'react';
import { Campaign } from '@/modules/communication/types/campaign.types';
import { Play, Pause, Square, RefreshCw, Users, Phone, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

interface CampaignControlRoomProps {
    campaignId: string;
}

export function CampaignControlRoom({ campaignId }: CampaignControlRoomProps) {
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    // Fetch campaign stats
    const fetchStats = async () => {
        try {
            const res = await fetch(`/api/campaigns/${campaignId}/stats`);
            if (res.ok) {
                const data = await res.json();
                setCampaign(data.campaign);
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();

        // Lightning-fast polling: update every 1 second
        const interval = setInterval(fetchStats, 1000);
        return () => clearInterval(interval);
    }, [campaignId]);

    // Campaign actions
    const handleAction = async (action: string) => {
        try {
            const res = await fetch(`/api/campaigns/${campaignId}/${action}`, {
                method: 'POST',
            });

            if (res.ok) {
                showToast(`Campaign ${action}ed successfully`, 'success');
                fetchStats();
            } else {
                showToast(`Failed to ${action} campaign`, 'error');
            }
        } catch (error) {
            showToast(`Error: ${error}`, 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <RefreshCw className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    if (!campaign || !stats) {
        return <div className="text-center text-slate-500 py-12">Campaign not found</div>;
    }

    const { stateDistribution, callStats, progress } = stats;

    return (
        <div className="space-y-6">
            {/* Header with Controls */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{campaign.name}</h1>
                        <div className="flex items-center gap-3 mt-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${campaign.status === 'running' ? 'bg-green-100 text-green-700' :
                                campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                                    campaign.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                        'bg-slate-100 text-slate-700'
                                }`}>
                                {campaign.status.toUpperCase()}
                            </span>
                            <span className="text-sm text-slate-500">
                                {campaign.type} • {campaign.totalLeads} leads
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {campaign.status === 'draft' && (
                            <button
                                onClick={() => handleAction('start')}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                            >
                                <Play size={16} /> Start
                            </button>
                        )}

                        {campaign.status === 'running' && (
                            <>
                                <button
                                    onClick={() => handleAction('pause')}
                                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    <Pause size={16} /> Pause
                                </button>
                                <button
                                    onClick={() => handleAction('stop')}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    <Square size={16} /> Stop
                                </button>
                            </>
                        )}

                        {campaign.status === 'paused' && (
                            <button
                                onClick={() => handleAction('resume')}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                            >
                                <Play size={16} /> Resume
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                    <div className="flex justify-between text-sm text-slate-600 mb-2">
                        <span>Progress</span>
                        <span className="font-semibold">{progress}%</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    icon={<Users className="text-blue-600" size={24} />}
                    label="Total Leads"
                    value={campaign.totalLeads}
                    color="blue"
                />
                <MetricCard
                    icon={<Phone className="text-indigo-600" size={24} />}
                    label="Calls Made"
                    value={callStats.total}
                    color="indigo"
                />
                <MetricCard
                    icon={<CheckCircle className="text-green-600" size={24} />}
                    label="Successful"
                    value={callStats.completed}
                    color="green"
                />
                <MetricCard
                    icon={<XCircle className="text-red-600" size={24} />}
                    label="Failed"
                    value={callStats.failed}
                    color="red"
                />
            </div>

            {/* State Distribution */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Lead States</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <StateCard label="Queued" count={stateDistribution.queued} color="slate" />
                    <StateCard label="Calling" count={stateDistribution.calling} color="indigo" icon={<Phone size={16} className="animate-pulse" />} />
                    <StateCard label="Completed" count={stateDistribution.completed} color="green" />
                    <StateCard label="Failed" count={stateDistribution.failed} color="red" />
                    <StateCard label="Retry" count={stateDistribution.retry_scheduled} color="yellow" icon={<Clock size={16} />} />
                    <StateCard label="Stopped" count={stateDistribution.stopped} color="slate" />
                </div>
            </div>

            {/* Intent Distribution */}
            {callStats.intents && Object.keys(callStats.intents).length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Call Outcomes</h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {Object.entries(callStats.intents).map(([intent, count]) => (
                            <div key={intent} className="text-center p-4 bg-slate-50 rounded-lg">
                                <div className="text-2xl font-bold text-slate-900">{count as number}</div>
                                <div className="text-sm text-slate-600 capitalize mt-1">{intent.replace('_', ' ')}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Calls */}
            {stats.recentCalls && stats.recentCalls.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Calls</h2>
                    <div className="space-y-2">
                        {stats.recentCalls.map((call: any) => (
                            <div key={call.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${call.status === 'completed' ? 'bg-green-500' :
                                        call.status === 'failed' ? 'bg-red-500' :
                                            'bg-yellow-500'
                                        }`} />
                                    <div>
                                        <div className="font-medium text-slate-900">{call.phoneNumber}</div>
                                        <div className="text-sm text-slate-500">
                                            {call.duration ? `${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')}` : 'N/A'}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {call.intent && (
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${call.intent === 'interested' ? 'bg-green-100 text-green-700' :
                                            call.intent === 'site_visit' ? 'bg-blue-100 text-blue-700' :
                                                call.intent === 'callback' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-slate-100 text-slate-700'
                                            }`}>
                                            {call.intent}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function MetricCard({ icon, label, value, color }: any) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
                {icon}
            </div>
            <div className="text-3xl font-bold text-slate-900">{value}</div>
            <div className="text-sm text-slate-600 mt-1">{label}</div>
        </div>
    );
}

function StateCard({ label, count, color, icon }: any) {
    return (
        <div className={`p-4 rounded-lg border-2 ${color === 'indigo' ? 'border-indigo-200 bg-indigo-50' :
            color === 'green' ? 'border-green-200 bg-green-50' :
                color === 'red' ? 'border-red-200 bg-red-50' :
                    color === 'yellow' ? 'border-yellow-200 bg-yellow-50' :
                        'border-slate-200 bg-slate-50'
            }`}>
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</span>
                {icon}
            </div>
            <div className={`text-2xl font-bold ${color === 'indigo' ? 'text-indigo-700' :
                color === 'green' ? 'text-green-700' :
                    color === 'red' ? 'text-red-700' :
                        color === 'yellow' ? 'text-yellow-700' :
                            'text-slate-700'
                }`}>{count}</div>
        </div>
    );
}
