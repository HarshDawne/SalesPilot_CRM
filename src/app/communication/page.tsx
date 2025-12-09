"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Play, Pause, StopCircle, BarChart3, Users, Phone, CheckCircle, ArrowUp } from "lucide-react";

interface Campaign {
    campaignId: string;
    name: string;
    status: 'QUEUED' | 'RUNNING' | 'PAUSED' | 'STOPPED' | 'COMPLETED';
    targetLeadCount: number;
    processed: number;
    metrics: {
        attempts: number;
        connected: number;
        qualified: number;
        visitsBooked: number;
    };
    createdAt: string;
}

export default function CommunicationPage() {
    const router = useRouter();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            const response = await fetch('/api/campaigns');
            const data = await response.json();
            setCampaigns(data.campaigns || []);
        } catch (error) {
            console.error('Failed to fetch campaigns:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors = {
            'QUEUED': 'bg-blue-100 text-blue-700',
            'RUNNING': 'bg-green-100 text-green-700 animate-pulse',
            'PAUSED': 'bg-yellow-100 text-yellow-700',
            'STOPPED': 'bg-red-100 text-red-700',
            'COMPLETED': 'bg-slate-100 text-slate-700'
        };
        return colors[status as keyof typeof colors] || 'bg-slate-100 text-slate-700';
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'RUNNING': return <Play size={14} className="text-green-600" />;
            case 'PAUSED': return <Pause size={14} className="text-yellow-600" />;
            case 'STOPPED': return <StopCircle size={14} className="text-red-600" />;
            case 'COMPLETED': return <CheckCircle size={14} className="text-slate-600" />;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50">
            <div className="max-w-[1600px] mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">
                            Communication Engine
                        </h1>
                        <p className="text-slate-600 mt-2 flex items-center gap-2">
                            <Phone size={16} className="text-blue-600" />
                            System Auto-Call Campaigns
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/communication/create')}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 font-semibold flex items-center gap-2 hover:scale-105"
                    >
                        <Plus size={18} />
                        Create Campaign
                    </button>
                </div>

                {/* Stats Overview - Matching Lead Management Style */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
                                <BarChart3 size={24} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-slate-500 font-medium">Total Campaigns</p>
                                <p className="text-3xl font-bold text-slate-900">{campaigns.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg shadow-green-500/30">
                                <Play size={24} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-slate-500 font-medium">Active</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-3xl font-bold text-slate-900">
                                        {campaigns.filter(c => c.status === 'RUNNING').length}
                                    </p>
                                    {campaigns.filter(c => c.status === 'RUNNING').length > 0 && (
                                        <span className="text-xs text-green-600 font-semibold flex items-center gap-0.5">
                                            <ArrowUp size={12} /> Live
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/30">
                                <Users size={24} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-slate-500 font-medium">Leads Processed</p>
                                <p className="text-3xl font-bold text-slate-900">
                                    {campaigns.reduce((sum, c) => sum + c.processed, 0)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/30">
                                <CheckCircle size={24} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-slate-500 font-medium">Visits Booked</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-3xl font-bold text-slate-900">
                                        {campaigns.reduce((sum, c) => sum + c.metrics.visitsBooked, 0)}
                                    </p>
                                    <span className="text-xs text-emerald-600 font-semibold">
                                        {campaigns.length > 0
                                            ? Math.round((campaigns.reduce((sum, c) => sum + c.metrics.visitsBooked, 0) /
                                                Math.max(campaigns.reduce((sum, c) => sum + c.processed, 0), 1)) * 100)
                                            : 0}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Campaigns List */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-200">
                        <h2 className="text-xl font-bold text-slate-900">All Campaigns</h2>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center text-slate-500">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            Loading campaigns...
                        </div>
                    ) : campaigns.length === 0 ? (
                        <div className="p-12 text-center">
                            <Phone size={48} className="text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">No campaigns yet</h3>
                            <p className="text-slate-500 mb-6">Create your first calling campaign to get started</p>
                            <button
                                onClick={() => router.push('/communication/create')}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Create Campaign
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {campaigns.map((campaign) => (
                                <div
                                    key={campaign.campaignId}
                                    onClick={() => router.push(`/communication/${campaign.campaignId}`)}
                                    className="p-6 hover:bg-slate-50 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-slate-900">{campaign.name}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${getStatusColor(campaign.status)}`}>
                                                    {getStatusIcon(campaign.status)}
                                                    {campaign.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500">
                                                Created {new Date(campaign.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-slate-900">
                                                {campaign.processed}/{campaign.targetLeadCount}
                                            </p>
                                            <p className="text-xs text-slate-500">Leads Processed</p>
                                        </div>
                                    </div>

                                    {/* Metrics */}
                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="text-center p-3 bg-slate-50 rounded-lg">
                                            <p className="text-xs text-slate-500 mb-1">Attempts</p>
                                            <p className="text-lg font-bold text-slate-900">{campaign.metrics.attempts}</p>
                                        </div>
                                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                                            <p className="text-xs text-blue-600 mb-1">Connected</p>
                                            <p className="text-lg font-bold text-blue-900">{campaign.metrics.connected}</p>
                                            <p className="text-xs text-blue-600">
                                                {campaign.metrics.attempts > 0
                                                    ? Math.round((campaign.metrics.connected / campaign.metrics.attempts) * 100)
                                                    : 0}%
                                            </p>
                                        </div>
                                        <div className="text-center p-3 bg-green-50 rounded-lg">
                                            <p className="text-xs text-green-600 mb-1">Qualified</p>
                                            <p className="text-lg font-bold text-green-900">{campaign.metrics.qualified}</p>
                                            <p className="text-xs text-green-600">
                                                {campaign.metrics.connected > 0
                                                    ? Math.round((campaign.metrics.qualified / campaign.metrics.connected) * 100)
                                                    : 0}%
                                            </p>
                                        </div>
                                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                                            <p className="text-xs text-purple-600 mb-1">Visits Booked</p>
                                            <p className="text-lg font-bold text-purple-900">{campaign.metrics.visitsBooked}</p>
                                            <p className="text-xs text-purple-600">
                                                {campaign.metrics.qualified > 0
                                                    ? Math.round((campaign.metrics.visitsBooked / campaign.metrics.qualified) * 100)
                                                    : 0}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
