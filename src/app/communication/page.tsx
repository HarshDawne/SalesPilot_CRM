"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    Play,
    Pause,
    StopCircle,
    BarChart3,
    Users,
    Phone,
    CheckCircle,
    ArrowUp,
    Search,
    Filter,
    MoreVertical,
    Zap,
    Activity,
    Clock,
    Sparkles,
    ChevronRight,
    MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CallDetailsModal } from "@/components/communication/CallDetailsModal";

interface Campaign {
    id: string;
    name: string;
    status: 'QUEUED' | 'RUNNING' | 'PAUSED' | 'STOPPED' | 'COMPLETED' | 'draft' | 'running' | 'paused' | 'stopped' | 'completed';
    targetLeadCount: number;
    processed: number;
    metrics?: {
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
    const [stats, setStats] = useState<any>(null);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'live' | 'completed' | 'upcoming'>('live');
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 8000); // Polling simulation
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        // High-velocity mock data for presentation
        const mockCampaigns: Campaign[] = [
            {
                id: "c1",
                name: "Q4 Luxury Outreach",
                status: "RUNNING",
                targetLeadCount: 1250,
                processed: 980,
                metrics: { attempts: 980, connected: 750, qualified: 420, visitsBooked: 85 },
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: "c2",
                name: "NRI Follow-up Sequence",
                status: "RUNNING",
                targetLeadCount: 400,
                processed: 145,
                metrics: { attempts: 145, connected: 90, qualified: 35, visitsBooked: 8 },
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: "c3",
                name: "Weekend Site Visit Drops",
                status: "COMPLETED",
                targetLeadCount: 180,
                processed: 180,
                metrics: { attempts: 180, connected: 145, qualified: 60, visitsBooked: 45 },
                createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        const mockStats = {
            totalCalls: 1305,
            activeCalls: 24,
            successRate: 58,
            completedCalls: 138
        };

        const mockActivity = [
            { id: "a1", leadName: "Rahul Desai", status: "COMPLETED", outcome: "High Intent - Seeking 3BHK", createdAt: new Date(Date.now() - 32000).toISOString() },
            { id: "a2", leadName: "Priya Verma", status: "IN_PROGRESS", outcome: "Engaging context...", createdAt: new Date(Date.now() - 115000).toISOString() },
            { id: "a3", leadName: "Amit Singh", status: "COMPLETED", outcome: "Budget mismatch - Archived", createdAt: new Date(Date.now() - 145000).toISOString() },
            { id: "a4", leadName: "Sneha Patil", status: "COMPLETED", outcome: "Site Visit Scheduled Tomorrow", createdAt: new Date(Date.now() - 320000).toISOString() },
            { id: "a5", leadName: "Vikram Malhotra", status: "IN_PROGRESS", outcome: "Initiating node...", createdAt: new Date(Date.now() - 400000).toISOString() },
            { id: "a6", leadName: "Neha Sharma", status: "COMPLETED", outcome: "Callback requested in 2 hours", createdAt: new Date(Date.now() - 600000).toISOString() }
        ];

        setCampaigns(mockCampaigns);
        setStats(mockStats);
        setRecentActivity(mockActivity);
        setLoading(false);
    };

    const getStatusStyles = (status: string) => {
        const s = status.toUpperCase();
        const styles = {
            'QUEUED': 'bg-blue-50 text-blue-700 border-blue-100',
            'RUNNING': 'bg-primary/5 text-primary border-primary/20',
            'PAUSED': 'bg-amber-50 text-amber-700 border-amber-100',
            'STOPPED': 'bg-rose-50 text-rose-700 border-rose-100',
            'COMPLETED': 'bg-secondary/10 text-secondary border-secondary/20'
        };
        return styles[s as keyof typeof styles] || 'bg-slate-50 text-slate-700 border-slate-100';
    };

    const filteredCampaigns = campaigns.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const liveCampaigns = filteredCampaigns.filter(c => ['RUNNING', 'running', 'QUEUED', 'queued'].includes(c.status));
    const completedCampaigns = filteredCampaigns.filter(c => ['COMPLETED', 'completed'].includes(c.status));
    const upcomingCampaigns = filteredCampaigns.filter(c => !['RUNNING', 'running', 'COMPLETED', 'completed', 'QUEUED', 'queued'].includes(c.status));

    const getActiveCampaigns = () => {
        switch (activeTab) {
            case 'live': return liveCampaigns;
            case 'completed': return completedCampaigns;
            case 'upcoming': return upcomingCampaigns;
            default: return liveCampaigns;
        }
    };

    const currentTabCampaigns = getActiveCampaigns();

    return (
        <div className="p-6 lg:p-10 space-y-10 max-w-[1440px] mx-auto">
            
            {/* 1. Header & Quick Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em]">
                        <MessageSquare size={12} className="text-secondary" />
                        Strategic Comm Hub // Multi-Agent
                    </div>
                    <h1 className="text-3xl font-black text-text-main tracking-tighter">
                        Communication <span className="text-secondary">Engine</span>
                    </h1>
                    <p className="text-sm text-text-secondary font-medium">AI-driven outbound sequences and lead nurturing orchestration.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative group flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={14} />
                        <input
                            type="text"
                            placeholder="Find campaign node..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white border border-border-subtle rounded-lg text-xs font-bold text-text-main focus:border-primary transition-all w-full outline-none"
                        />
                    </div>
                    <button
                        onClick={() => router.push('/communication/create')}
                        className="btn-primary flex items-center gap-2 text-xs py-2"
                    >
                        <Plus size={16} />
                        Launch Strategy
                    </button>
                </div>
            </div>

            {/* 2. Global Strategy KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <CommStatCard
                    label="Total Daily Sessions"
                    value={stats?.totalCalls || 0}
                    icon={<Phone size={18} />}
                    delta="+12%"
                    color="primary"
                />
                <CommStatCard
                    label="AI Agent Load"
                    value={stats?.activeCalls || 0}
                    icon={<Activity size={18} className="text-ai-accent animate-pulse" />}
                    delta="Active"
                    color="ai"
                />
                <CommStatCard
                    label="Qualification Yield"
                    value={`${stats?.successRate || 0}%`}
                    icon={<CheckCircle size={18} />}
                    delta="Exemplary"
                    color="secondary"
                />
                <CommStatCard
                    label="Visits Synchronized"
                    value={stats?.completedCalls || 0}
                    icon={<BarChart3 size={18} />}
                    delta="High Velocity"
                    color="success"
                />
            </div>

            {/* 3. Operational Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                
                {/* Left: Campaign Matrix */}
                <div className="xl:col-span-8 flex flex-col gap-6">
                    <div className="flex items-center gap-6 border-b border-border-subtle pb-px">
                        {['live', 'completed', 'upcoming'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={cn(
                                    "pb-3 text-[11px] font-black uppercase tracking-widest transition-all relative px-1",
                                    activeTab === tab ? "text-primary border-b-2 border-primary" : "text-text-secondary/60 hover:text-text-main"
                                )}
                            >
                                {tab}
                                {tab === 'live' && liveCampaigns.length > 0 && (
                                    <span className="ml-2 px-1.5 py-0.5 bg-primary/10 text-primary text-[9px] rounded-md font-bold">{liveCampaigns.length}</span>
                                )}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-slate-50 animate-pulse rounded-[2rem] border border-border-subtle"></div>)}
                        </div>
                    ) : currentTabCampaigns.length === 0 ? (
                        <div className="card-premium p-24 text-center">
                            <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-border-subtle">
                                <Activity size={32} className="text-slate-300" />
                            </div>
                            <h3 className="text-xl font-black text-text-main tracking-tight">Strategy Void</h3>
                            <p className="text-sm text-text-secondary font-medium mt-2 max-w-sm mx-auto">
                                No {activeTab} campaigns are globally active in the current quadrant. Initialize a new strategy to begin data harvesting.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {currentTabCampaigns.map((campaign) => (
                                <CampaignNode
                                    key={campaign.id}
                                    campaign={campaign}
                                    onClick={() => router.push(`/communication/${campaign.id}`)}
                                    styles={getStatusStyles(campaign.status)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Live Pulse Feed */}
                <div className="xl:col-span-4 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-black text-text-main uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ai-accent opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-ai-accent"></span>
                            </span>
                            Live Intelligence Pulse
                        </h2>
                        <Filter size={14} className="text-slate-400 hover:text-primary cursor-pointer transition-colors" />
                    </div>

                    <div className="card-premium p-0 flex flex-col h-[700px] overflow-hidden bg-white">
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {recentActivity.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-300 space-y-4 opacity-70">
                                    <Activity size={40} strokeWidth={1} />
                                    <p className="text-[10px] uppercase font-black tracking-widest">Awaiting engagement signals...</p>
                                </div>
                            ) : (
                                recentActivity.map((job) => (
                                    <PulseActivityItem
                                        key={job.id}
                                        job={job}
                                        onClick={() => setSelectedJob(job)}
                                    />
                                ))
                            )}
                        </div>
                        <button className="p-4 bg-slate-50 border-t border-border-subtle text-center text-[10px] font-black text-text-secondary hover:text-primary hover:bg-white transition-all uppercase tracking-widest">
                            Access Global Transmission Log
                        </button>
                    </div>
                </div>
            </div>

            <CallDetailsModal
                isOpen={!!selectedJob}
                onClose={() => setSelectedJob(null)}
                job={selectedJob}
            />

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #E2E8F0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #CBD5E1;
                }
            `}</style>
        </div>
    );
}

function CommStatCard({ label, value, icon, delta, color }: any) {
    return (
        <div className="card-premium p-6 group hover:border-primary/30 bg-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-125 transition-all text-primary">
                {icon}
            </div>
            <div className="flex items-start justify-between mb-4">
                <div className={cn(
                    "p-2.5 rounded-xl border border-border-subtle group-hover:bg-primary/5 transition-colors",
                    color === 'ai' && "border-ai-accent/20 bg-ai-accent/5",
                    color === 'primary' && "border-primary/20",
                    color === 'secondary' && "border-secondary/20"
                )}>
                    {icon}
                </div>
                <div className={cn(
                    "px-2 py-0.5 text-[10px] font-bold rounded-full border",
                    delta === 'Active' ? "bg-ai-accent/10 text-ai-accent border-ai-accent/20" :
                    delta.includes('+') ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-blue-50 text-primary border-blue-100"
                )}>
                    {delta}
                </div>
            </div>
            <div>
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">{label}</p>
                <div className="text-3xl font-black text-text-main tracking-tighter leading-none">{value}</div>
            </div>
        </div>
    );
}

function CampaignNode({ campaign, onClick, styles }: any) {
    const progress = Math.round((campaign.processed / campaign.targetLeadCount) * 100) || 0;

    return (
        <div
            onClick={onClick}
            className="card-premium p-6 group cursor-pointer bg-white"
        >
            <div className="flex justify-between items-start mb-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-black text-text-main text-lg group-hover:text-primary transition-colors tracking-tight uppercase">
                            {campaign.name}
                        </h3>
                    </div>
                    <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest flex items-center gap-2">
                        <Clock size={12} /> Init: {new Date(campaign.createdAt).toLocaleDateString()}
                    </p>
                </div>
                <div className={cn("px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border", styles)}>
                    {campaign.status}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50/50 rounded-xl p-3 border border-border-subtle">
                    <p className="text-[9px] text-text-secondary font-black uppercase mb-1 tracking-tighter">Transmission</p>
                    <p className="text-lg font-black text-text-main leading-none">{campaign.metrics?.attempts || 0}</p>
                </div>
                <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
                    <p className="text-[9px] text-primary font-black uppercase mb-1 tracking-tighter">Harvest</p>
                    <p className="text-lg font-black text-primary leading-none">{campaign.metrics?.qualified || 0}</p>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Strategy Reach</span>
                    <span className="text-xs font-black text-text-main tracking-tighter">{progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(2,58,143,0.3)]"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-[9px] font-bold text-slate-400">
                    <span>{campaign.processed} Processed</span>
                    <span className="flex items-center gap-1 group-hover:text-primary transition-colors uppercase">Drill Down <ChevronRight size={10} /></span>
                </div>
            </div>
        </div>
    );
}

function PulseActivityItem({ job, onClick }: any) {
    const isSuccess = job.status === 'COMPLETED' || job.status === 'completed';
    const isRunning = job.status === 'IN_PROGRESS' || job.status === 'running';

    return (
        <div
            onClick={onClick}
            className="flex items-center gap-4 p-4 rounded-xl border border-transparent hover:border-border-subtle hover:bg-slate-50 transition-all cursor-pointer group bg-white"
        >
            <div className={`h-10 w-10 flex-shrink-0 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 shadow-xs border
                ${isSuccess ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    isRunning ? 'bg-ai-accent/10 text-ai-accent border-ai-accent/20' : 'bg-slate-50 text-slate-500 border-slate-100'}
            `}>
                {isSuccess ? <CheckCircle size={18} /> :
                    isRunning ? <Zap size={18} className="animate-pulse" /> : <Phone size={18} />}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                    <p className="text-xs font-black text-text-main truncate uppercase tracking-tight">{job.leadName || 'System Process'}</p>
                    <span className="text-[10px] font-bold text-slate-400">{new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-[11px] text-text-secondary font-medium truncate italic">{job.outcome || (isRunning ? 'Engaging context...' : 'Initiating node...')}</p>
            </div>

            <ChevronRight size={14} className="text-slate-200 group-hover:text-primary transition-colors" />
        </div>
    );
}
