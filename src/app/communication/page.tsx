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
    MessageSquare,
    Trash2
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
        try {
            // 1. Fetch real campaigns
            const campRes = await fetch('/api/campaigns');
            const campData = await campRes.json();
            
            // Map API data to UI structure if needed
            const realCampaigns = (campData.campaigns || []).map((c: any) => ({
                ...c,
                status: c.status.toUpperCase(),
                // Use existing metrics or fallback to 0
                metrics: c.metrics || { 
                    attempts: c.completedCalls || 0, 
                    connected: c.successfulCalls || 0, 
                    qualified: c.qualifiedLeads || 0, 
                    visitsBooked: c.visitsBooked || 0 
                }
            }));

            // 2. Fetch real pulse activity
            const pulseRes = await fetch('/api/communication/pulse');
            const pulseData = await pulseRes.json();

            const mockStats = {
                totalCalls: realCampaigns.reduce((sum: number, c: any) => sum + (c.metrics?.attempts || 0), 0),
                activeCalls: realCampaigns.filter((c: any) => c.status === 'RUNNING').length * 4, // Simulated load
                successRate: realCampaigns.length > 0 ? Math.round((realCampaigns.reduce((sum: number, c: any) => sum + (c.metrics?.qualified || 0), 0) / (realCampaigns.reduce((sum: number, c: any) => sum + (c.metrics?.attempts || 1), 0))) * 100) : 0,
                completedCalls: pulseData.activity?.length || 0
            };

            setCampaigns(realCampaigns);
            setStats(mockStats);
            setRecentActivity(pulseData.activity || []);
        } catch (error) {
            console.error('Error fetching real campaign data:', error);
        } finally {
            setLoading(false);
        }
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
                        Campaign Logistics
                    </div>
                    <h1 className="text-3xl font-black text-text-main tracking-tighter">
                        Sales <span className="text-secondary">Operations</span>
                    </h1>
                    <p className="text-sm text-text-secondary font-medium italic">High-intent outreach orchestration and human-agent synchronization.</p>
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
                        Create Campaign
                    </button>
                </div>
            </div>

            {/* 2. Global Strategy KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <CommStatCard
                    label="Volume Today"
                    value={stats?.totalCalls || 0}
                    icon={<Phone size={18} />}
                    delta="+12%"
                    color="primary"
                />
                <CommStatCard
                    label="Active Line Load"
                    value={stats?.activeCalls || 0}
                    icon={<Activity size={18} className="text-secondary animate-pulse" />}
                    delta="Real-time"
                    color="ai"
                />
                <CommStatCard
                    label="Qualification Rate"
                    value={`${stats?.successRate || 0}%`}
                    icon={<CheckCircle size={18} />}
                    delta="Exemplary"
                    color="secondary"
                />
                <CommStatCard
                    label="Closures / Visits"
                    value={stats?.completedCalls || 0}
                    icon={<BarChart3 size={18} />}
                    delta="Target Met"
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
                            <h3 className="text-xl font-black text-text-main tracking-tight">No Campaigns Found</h3>
                            <p className="text-sm text-text-secondary font-medium mt-2 max-w-sm mx-auto">
                                There are no {activeTab} campaigns at the moment. Start a new campaign to begin outreach.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {currentTabCampaigns.map((campaign) => (
                                <CampaignNode
                                    key={campaign.id}
                                    campaign={campaign}
                                    onRename={async (newName: string) => {
                                        try {
                                            await fetch(`/api/campaigns/${campaign.id}`, {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ name: newName })
                                            });
                                            fetchData(); // Sync all containers
                                        } catch (error) {
                                            console.error('Rename failed:', error);
                                        }
                                    }}
                                    onDelete={async () => {
                                        if (confirm(`Are you sure you want to delete "${campaign.name}"? This action is permanent.`)) {
                                            try {
                                                const res = await fetch(`/api/campaigns/${campaign.id}`, { method: 'DELETE' });
                                                if (res.ok) {
                                                    await fetchData();
                                                }
                                            } catch (error) {
                                                console.error('Delete failed:', error);
                                            }
                                        }
                                    }}
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
                            Recent Activity
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
                            View All Activity
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
        <div className="bg-white rounded-3xl p-6 border border-border-subtle shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:scale-125 transition-all text-primary">
                {icon}
            </div>
            <div className="flex items-start justify-between mb-4">
                <div className={cn(
                    "p-3 rounded-2xl border border-border-subtle group-hover:bg-primary/5 transition-colors",
                    color === 'ai' && "border-secondary/20 bg-secondary/5",
                    color === 'primary' && "border-primary/20",
                    color === 'secondary' && "border-secondary/20"
                )}>
                    {icon}
                </div>
                <div className={cn(
                    "px-2.5 py-0.5 text-[9px] font-black uppercase tracking-tighter rounded-full border shadow-xs",
                    delta === 'Active' || delta === 'Real-time' ? "bg-secondary/10 text-secondary border-secondary/20" :
                    delta.includes('+') ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-blue-50 text-primary border-blue-100"
                )}>
                    {delta}
                </div>
            </div>
            <div>
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1 opacity-70">{label}</p>
                <div className="text-4xl font-black text-text-main tracking-tighter leading-none">{value}</div>
            </div>
        </div>
    );
}

function CampaignNode({ campaign, onClick, onRename, onDelete, styles }: any) {
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(campaign.name);
    const progress = Math.round((campaign.processed / campaign.targetLeadCount) * 100) || 0;

    const handleSave = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        if (newName.trim() && newName !== campaign.name) {
            onRename(newName);
        }
        setIsEditing(false);
    };

    return (
        <div
            onClick={isEditing ? undefined : onClick}
            className={cn(
                "bg-white rounded-[2.5rem] p-8 border border-border-subtle shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] group cursor-pointer transition-all duration-500",
                isEditing && "ring-2 ring-primary border-transparent shadow-2xl"
            )}
        >
            <div className="flex justify-between items-start mb-6">
                <div className="space-y-1 flex-1 mr-4 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                        {isEditing ? (
                            <div className="flex items-center gap-2 w-full" onClick={e => e.stopPropagation()}>
                                <input
                                    autoFocus
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSave(e);
                                        if (e.key === 'Escape') {
                                            setIsEditing(false);
                                            setNewName(campaign.name);
                                        }
                                    }}
                                    className="text-lg font-black text-text-main border-b-2 border-primary outline-none bg-transparent w-full uppercase"
                                />
                                <button 
                                    onClick={handleSave}
                                    className="p-1 hover:text-primary transition-colors shrink-0"
                                >
                                    <CheckCircle size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 group/title w-full min-w-0">
                                <h3 className="font-black text-text-main text-lg group-hover:text-primary transition-colors tracking-tight uppercase truncate">
                                    {campaign.name}
                                </h3>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsEditing(true);
                                    }}
                                    className="opacity-0 group-hover/title:opacity-100 p-1 text-slate-400 hover:text-primary transition-all shrink-0"
                                >
                                    <Plus size={14} className="rotate-45" /> {/* Using Plus rotated as a small x/pencil cross */}
                                </button>
                            </div>
                        )}
                    </div>
                    <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest flex items-center gap-2">
                        <Clock size={12} /> Started: {new Date(campaign.createdAt).toLocaleDateString()}
                    </p>
                </div>
                <div className={cn("px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shrink-0", styles)}>
                    {campaign.status}
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all shrink-0 ml-1"
                    title="Delete Campaign"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50/50 rounded-xl p-3 border border-border-subtle">
                    <p className="text-[9px] text-text-secondary font-black uppercase mb-1 tracking-tighter">Calls Made</p>
                    <p className="text-lg font-black text-text-main leading-none">{campaign.metrics?.attempts || 0}</p>
                </div>
                <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
                    <p className="text-[9px] text-primary font-black uppercase mb-1 tracking-tighter">Leads Qualified</p>
                    <p className="text-lg font-black text-primary leading-none">{campaign.metrics?.qualified || 0}</p>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Progress</span>
                    <span className="text-xs font-black text-text-main tracking-tighter">{progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(2,58,143,0.3)]"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-[9px] font-bold text-slate-400">
                    <span>{campaign.processed} Contacted</span>
                    <span className="flex items-center gap-1 group-hover:text-primary transition-colors uppercase">View Details <ChevronRight size={10} /></span>
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
                <p className="text-[11px] text-text-secondary font-medium truncate italic">{job.outcome || (isRunning ? 'On call...' : 'Starting call...')}</p>
            </div>

            <ChevronRight size={14} className="text-slate-200 group-hover:text-primary transition-colors" />
        </div>
    );
}
