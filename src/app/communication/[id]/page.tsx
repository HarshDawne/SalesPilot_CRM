"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Plus, Play, Pause, StopCircle, BarChart3, Users, Phone, CheckCircle,
    ArrowUp, PhoneOutgoing, Loader2, ArrowLeft, Activity, Clock,
    DollarSign, ExternalLink, FileText, Zap, TrendingUp, Info, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CallDetailsModal } from "@/components/communication/CallDetailsModal";

export default function CampaignDashboard() {
    const { id } = useParams();
    const router = useRouter();
    const [campaign, setCampaign] = useState<any>(null);
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [syncing, setSyncing] = useState(false);

    const fetchCampaign = async () => {
        try {
            const res = await fetch('/api/comm/campaigns');
            const data = await res.json();
            const campaigns = Array.isArray(data) ? data : (data.campaigns || []);
            const found = campaigns.find((c: any) => c.id === id);
            setCampaign(found);

            const jobsRes = await fetch(`/api/campaigns/${id}/jobs`);
            const jobsData = await jobsRes.json();
            if (jobsData.jobs) {
                setJobs(jobsData.jobs);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaign();
        const interval = setInterval(fetchCampaign, 5000);
        return () => clearInterval(interval);
    }, [id]);

    useEffect(() => {
        const interval = setInterval(() => {
            const hasLiveJobs = jobs.some(j => j.status === 'IN_PROGRESS' || j.status === 'running' || j.status === 'initiated' || j.status === 'CALLING');
            if (hasLiveJobs && !syncing) {
                handleSync(); 
            } else {
                fetchCampaign();
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [jobs, syncing]);

    const handleStart = async () => {
        await fetch(`/api/comm/campaigns/${id}/start`, { method: 'POST' });
        fetchCampaign();
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            await fetch(`/api/comm/campaigns/${id}/sync`, { method: 'POST' });
            await fetchCampaign();
        } catch (err) {
            console.error('[Sync] Error:', err);
        } finally {
            setSyncing(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-bg-base space-y-4">
            <Zap className="text-primary animate-pulse" size={40} />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronizing Operational Data...</p>
        </div>
    );

    if (!campaign) return (
        <div className="min-h-screen flex items-center justify-center bg-bg-base">
            <div className="text-center">
                <h2 className="text-xl font-black text-text-main uppercase tracking-tight">Campaign Node Offline</h2>
                <button onClick={() => router.back()} className="mt-4 btn-primary">Return to Registry</button>
            </div>
        </div>
    );

    const liveJobs = jobs.filter(j => j.status === 'IN_PROGRESS' || j.status === 'running' || j.status === 'CALLING');

    return (
        <div className="min-h-screen bg-bg-base">
            {/* Strategy Header */}
            <div className="bg-white border-b border-border-subtle sticky top-0 z-30 backdrop-blur-md bg-white/80">
                <div className="max-w-[1440px] mx-auto px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => router.push('/communication')}
                            className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 transition-all border border-transparent hover:border-slate-100"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div className="h-8 w-px bg-slate-100" />
                        <div className="flex flex-col">
                            <h1 className="text-xl font-black text-text-main leading-tight uppercase tracking-tighter">
                                {campaign.name}
                            </h1>
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "h-2 w-2 rounded-full",
                                    campaign.status === 'RUNNING' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                                )} />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{campaign.status} // OPS_CORE_SYNC</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {campaign.status === 'DRAFT' && (
                            <button
                                onClick={handleStart}
                                className="btn-ai py-2.5 px-6 text-xs flex items-center gap-2 animate-ai-glow"
                            >
                                <Play size={14} className="fill-current" />
                                Initiate Deployment
                            </button>
                        )}
                        <button className="p-2.5 bg-slate-50 hover:bg-white rounded-xl text-slate-400 border border-slate-100 transition-all">
                            <Plus size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1440px] mx-auto p-8 lg:p-10 space-y-10">
                {/* Strategic Analytics Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <AnalyticsCard
                        label="Conversion Funnel"
                        value={(() => {
                            const connected = campaign.metrics?.connected || 0;
                            const qualified = campaign.metrics?.qualified || 0;
                            if (connected === 0) return "0.0%";
                            return `${((qualified / connected) * 100).toFixed(1)}%`;
                        })()}
                        subtext="Strategic Yield Ratio"
                        trend="+4.2%"
                        icon={<TrendingUp size={18} />}
                        color="blue"
                    />
                    <AnalyticsCard
                        label="Engagement Rate"
                        value={(() => {
                            const attempted = campaign.metrics?.attempted || campaign.metrics?.attempts || 0;
                            const connected = campaign.metrics?.connected || 0;
                            if (attempted === 0) return "0.0%";
                            return `${((connected / attempted) * 100).toFixed(1)}%`;
                        })()}
                        subtext="Signal Transmission Success"
                        trend="+2.1%"
                        icon={<Zap size={18} />}
                        color="cyan"
                    />
                    <AnalyticsCard
                        label="Operational Cost"
                        value={(() => {
                            const cost = campaign.metrics?.cost || 0;
                            const connected = campaign.metrics?.connected || 0;
                            if (connected === 0) return `₹${(cost).toFixed(0)}`;
                            return `₹${(cost / connected).toFixed(1)}`;
                        })()}
                        subtext="Cost per Successful Connection"
                        icon={<DollarSign size={18} />}
                        color="indigo"
                    />
                    <AnalyticsCard
                        label="Assigned Agent"
                        value={campaign.agentName || "AISHA_V3"}
                        subtext={(() => {
                            const successful = campaign.metrics?.successfulCalls || 0;
                            const completed = campaign.metrics?.completedCalls || 0;
                            const rate = completed > 0 ? Math.round((successful / completed) * 100) : 0;
                            return `Success Rate: ${rate}%`;
                        })()}
                        icon={<Users size={18} />}
                        color="purple"
                    />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                    {/* Left Panel: Deep Dive */}
                    <div className="xl:col-span-4 lg:col-span-12 space-y-8">
                        <div className="card-premium p-8 bg-white border-primary/5 space-y-8">
                            <h3 className="text-[10px] font-black text-text-main uppercase tracking-[0.2em] flex items-center gap-2">
                                <Activity size={14} className="text-primary" /> Performance Deep Dive
                            </h3>

                            <div className="space-y-8">
                                <ProgressMetric label="Total Leads Dialed" current={campaign.metrics?.attempted || 0} target={campaign.targetLeadCount || 0} />
                                <ProgressMetric label="Successful Connections" current={campaign.metrics?.connected || 0} target={campaign.metrics?.attempted || 0} color="cyan" />
                                <ProgressMetric label="Qualified Opportunities" current={campaign.metrics?.qualified || 0} target={campaign.metrics?.connected || 0} color="emerald" />
                            </div>

                            <div className="pt-8 border-t border-slate-50 space-y-5">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Concurrency</span>
                                    <span className="font-black text-text-main">{campaign.concurrency || 1} Sessions</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg. Talk Time</span>
                                    <span className="font-black text-text-main">2m 45s</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Retry Cycle</span>
                                    <span className="font-black text-primary">Tomorrow, 10 AM</span>
                                </div>
                            </div>
                        </div>

                        {/* Live Tracking Layer */}
                        {liveJobs.length > 0 && (
                            <div className="card-premium p-8 bg-primary relative overflow-hidden group border-none">
                                <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 transition-transform duration-700 group-hover:scale-150">
                                    <Activity size={120} className="text-ai-accent" />
                                </div>
                                <div className="relative z-10 space-y-6">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-ai-accent animate-ping" />
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Live Transmission Active</h3>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-white uppercase tracking-tight">{liveJobs[0].leadName}</p>
                                        <p className="text-[10px] text-ai-accent font-black uppercase tracking-widest mt-1">Status: Dialing // AI Orchestrating</p>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-ai-accent animate-progress-fast shadow-[0_0_15px_rgba(0,220,245,0.5)]" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Execution Feed */}
                    <div className="xl:col-span-8 lg:col-span-12 space-y-8">
                        <div className="card-premium p-0 bg-white border-primary/5 overflow-hidden flex flex-col min-h-[600px]">
                            <div className="p-8 border-b border-border-subtle flex justify-between items-center bg-slate-50/30">
                                <div>
                                    <h2 className="text-xl font-black text-text-main uppercase tracking-tight">Execution Logs</h2>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Real-time telemetry from Voice AI orchestration</p>
                                </div>
                                <div className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border border-emerald-100/50">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    Live Sync Node Active
                                </div>
                            </div>

                            <div className="flex-1 overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50 border-b border-border-subtle">
                                        <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                            <th className="px-8 py-5">Execution ID</th>
                                            <th className="px-8 py-5">Identified Lead</th>
                                            <th className="px-8 py-5">Duration</th>
                                            <th className="px-8 py-5">Status</th>
                                            <th className="px-8 py-5">Operational Cost</th>
                                            <th className="px-8 py-5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {jobs.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-8 py-32 text-center">
                                                    <div className="flex flex-col items-center justify-center space-y-4 opacity-40">
                                                        <Zap className="w-10 h-10 text-primary animate-pulse" />
                                                        <p className="font-black text-[10px] uppercase tracking-widest text-slate-500">Initializing Strategic Feed...</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            jobs.map((job) => (
                                                <tr
                                                    key={job.id}
                                                    className="group hover:bg-slate-50 transition-all cursor-pointer"
                                                    onClick={() => setSelectedJob(job)}
                                                >
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-mono text-slate-400">#{(job.executionId || job.id || 'exec').slice(-8).toUpperCase()}</span>
                                                            <ExternalLink size={12} className="text-slate-300 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-black text-text-main group-hover:text-primary transition-colors uppercase tracking-tight">{job.leadName}</span>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{job.phoneNumber}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className="text-[11px] font-black text-slate-600 tabular-nums uppercase">
                                                            {job.durationSeconds ? `${job.durationSeconds}s` : '--'}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className={cn(
                                                            "inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest gap-2 border",
                                                            job.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                            job.status === 'IN_PROGRESS' || job.status === 'CALLING' ? 'bg-primary/5 text-primary border-primary/20 animate-pulse' :
                                                            job.status === 'FAILED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                            'bg-slate-50 text-slate-400 border-slate-200'
                                                        )}>
                                                            {(job.status === 'IN_PROGRESS' || job.status === 'CALLING') && (
                                                                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                                                            )}
                                                            {job.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className="text-sm font-black text-text-main tabular-nums">₹{job.cost || '0.00'}</span>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <div className="flex justify-end gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all">
                                                            <button className="p-2 hover:bg-white rounded-lg text-primary border border-transparent hover:border-slate-100 transition-all" title="Transcript">
                                                                <FileText size={16} />
                                                            </button>
                                                            <button className="p-2 hover:bg-white rounded-lg text-ai-accent border border-transparent hover:border-slate-100 transition-all" title="AI Insight">
                                                                <Sparkles size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <CallDetailsModal
                isOpen={!!selectedJob}
                onClose={() => setSelectedJob(null)}
                job={selectedJob}
            />

            <style jsx global>{`
                @keyframes progress-fast {
                    0% { width: 0%; }
                    100% { width: 100%; }
                }
                .animate-progress-fast {
                    animation: progress-fast 10s linear infinite;
                }
            `}</style>
        </div>
    );
}

function AnalyticsCard({ label, value, subtext, trend, icon, color }: any) {
    const colorStyles: any = {
        blue: "text-primary bg-primary/5",
        cyan: "text-ai-accent bg-ai-accent/5",
        indigo: "text-indigo-600 bg-indigo-50",
        purple: "text-purple-600 bg-purple-50",
    };

    return (
        <div className="card-premium p-8 bg-white group hover:border-primary/20 transition-all duration-500">
            <div className={cn("p-3 rounded-2xl w-fit mb-6 transition-transform group-hover:scale-110 duration-500", colorStyles[color])}>
                {icon}
            </div>
            <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
                <div className="flex items-baseline gap-3">
                    <h3 className="text-4xl font-black text-text-main tracking-tighter tabular-nums">{value}</h3>
                    {trend && <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">{trend}</span>}
                </div>
                <p className="text-[10px] text-slate-500 font-bold flex items-center gap-2 italic">
                    <Info size={12} className="opacity-50" /> {subtext}
                </p>
            </div>
        </div>
    );
}

function ProgressMetric({ label, current, target, color }: any) {
    const percentage = target > 0 ? Math.round((current / target) * 100) : 0;
    
    const colors: any = {
        blue: "bg-primary shadow-[0_0_10px_rgba(2,58,143,0.3)]",
        cyan: "bg-ai-accent shadow-[0_0_10px_rgba(0,220,245,0.3)]",
        emerald: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]",
    };

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
                <span className="text-[11px] font-black text-text-main tabular-nums">{current || 0}{target > 0 ? ` / ${target}` : ''}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={cn("h-full rounded-full transition-all duration-1000", colors[color || 'blue'])}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
