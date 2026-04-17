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
            'QUEUED': 'badge-info',
            'RUNNING': 'badge-success animate-pulse',
            'PAUSED': 'badge-warning',
            'STOPPED': 'badge-danger',
            'COMPLETED': 'badge-neutral'
        };
        return colors[status as keyof typeof colors] || 'badge-neutral';
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'RUNNING': return <Play size={14} className="text-emerald-600" />;
            case 'PAUSED': return <Pause size={14} className="text-amber-600" />;
            case 'STOPPED': return <StopCircle size={14} className="text-red-600" />;
            case 'COMPLETED': return <CheckCircle size={14} className="text-slate-600" />;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-[1600px] mx-auto p-6 lg:p-8 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                        <h1 className="text-4xl lg:text-5xl font-bold font-heading text-gradient-emerald">
                            Communication Engine
                        </h1>
                        <p className="text-slate-600 mt-2 text-lg flex items-center gap-2">
                            <Phone size={16} className="text-emerald-600" />
                            AI-Powered Auto-Call Campaigns
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/communication/create')}
                        className="btn-primary flex items-center gap-2 shadow-xl hover-glow-emerald"
                    >
                        <Plus size={18} />
                        Create Campaign
                    </button>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="premium-card-emerald p-7 micro-lift hover-glow-emerald">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/30">
                                <BarChart3 size={24} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Campaigns</p>
                                <p className="text-4xl font-bold font-heading text-slate-900">{campaigns.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="premium-card-emerald p-7 micro-lift hover-glow-emerald">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/30">
                                <Play size={24} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Active Now</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-4xl font-bold font-heading text-slate-900">
                                        {campaigns.filter(c => c.status === 'RUNNING').length}
                                    </p>
                                    {campaigns.filter(c => c.status === 'RUNNING').length > 0 && (
                                        <span className="badge-success text-[10px] font-bold">
                                            <ArrowUp size={10} /> Live
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="premium-card-emerald p-7 micro-lift hover-glow-emerald">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl shadow-lg shadow-teal-500/30">
                                <Users size={24} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Leads Processed</p>
                                <p className="text-4xl font-bold font-heading text-slate-900">
                                    {campaigns.reduce((sum, c) => sum + c.processed, 0)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="premium-card p-7 border-t-4 border-t-amber-500 micro-lift hover-glow-emerald">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg shadow-amber-500/30">
                                <CheckCircle size={24} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Visits Booked</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-4xl font-bold font-heading text-slate-900">
                                        {campaigns.reduce((sum, c) => sum + c.metrics.visitsBooked, 0)}
                                    </p>
                                    <span className="badge-gold text-[10px] font-bold">
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
                <div className="premium-card overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50/50 to-transparent">
                        <h2 className="text-xl font-bold font-heading text-slate-900">All Campaigns</h2>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center text-slate-500">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-4"></div>
                            Loading campaigns...
                        </div>
                    ) : campaigns.length === 0 ? (
                        <div className="p-12 text-center">
                            <Phone size={48} className="text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold font-heading text-slate-900 mb-2">No campaigns yet</h3>
                            <p className="text-slate-500 mb-6">Create your first calling campaign to get started</p>
                            <button
                                onClick={() => router.push('/communication/create')}
                                className="btn-primary"
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
                                    className="p-6 hover:bg-emerald-50/30 cursor-pointer transition-all micro-lift"
                                >
                                    <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                <h3 className="text-lg font-bold font-heading text-slate-900">{campaign.name}</h3>
                                                <span className={`badge-pill ${getStatusColor(campaign.status)}`}>
                                                    {getStatusIcon(campaign.status)}
                                                    {campaign.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500">
                                                Created {new Date(campaign.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold font-heading text-slate-900">
                                                {campaign.processed}/{campaign.targetLeadCount}
                                            </p>
                                            <p className="text-xs text-slate-500 font-semibold">Leads Processed</p>
                                        </div>
                                    </div>

                                    {/* Metrics */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <p className="text-xs text-slate-500 font-semibold mb-1">Attempts</p>
                                            <p className="text-lg font-bold font-heading text-slate-900">{campaign.metrics.attempts}</p>
                                        </div>
                                        <div className="text-center p-3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                                            <p className="text-xs text-emerald-600 font-bold mb-1">Connected</p>
                                            <p className="text-lg font-bold font-heading text-emerald-900">{campaign.metrics.connected}</p>
                                            <p className="text-xs text-emerald-600 font-semibold">
                                                {campaign.metrics.attempts > 0
                                                    ? Math.round((campaign.metrics.connected / campaign.metrics.attempts) * 100)
                                                    : 0}%
                                            </p>
                                        </div>
                                        <div className="text-center p-3 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl border border-teal-100">
                                            <p className="text-xs text-teal-600 font-bold mb-1">Qualified</p>
                                            <p className="text-lg font-bold font-heading text-teal-900">{campaign.metrics.qualified}</p>
                                            <p className="text-xs text-teal-600 font-semibold">
                                                {campaign.metrics.connected > 0
                                                    ? Math.round((campaign.metrics.qualified / campaign.metrics.connected) * 100)
                                                    : 0}%
                                            </p>
                                        </div>
                                        <div className="text-center p-3 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl border border-amber-200">
                                            <p className="text-xs text-amber-600 font-bold mb-1">Visits Booked</p>
                                            <p className="text-lg font-bold font-heading text-amber-900">{campaign.metrics.visitsBooked}</p>
                                            <p className="text-xs text-amber-600 font-semibold">
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
