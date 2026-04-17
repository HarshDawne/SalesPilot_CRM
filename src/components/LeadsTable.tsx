"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lead, LeadStage } from "@/lib/db";
import {
    Loader2,
    Filter,
    ChevronDown,
    Search,
    X,
    Sparkles,
    Users,
    Target,
    ArrowUpDown,
    MoreHorizontal,
    Phone,
    Mail,
    CheckSquare,
    Zap,
    ChevronRight,
    LucideIcon,
    Activity
} from "lucide-react";
import { LiveCallStatusModal } from "@/components/communication/LiveCallStatusModal";
import { CreateCampaignModal, CampaignConfig } from "@/components/campaign/CreateCampaignModal";
import { cn } from "@/lib/utils";

const STAGES: { key: LeadStage; label: string; color: string; bgColor: string; icon: LucideIcon }[] = [
    { key: "New", label: "New", color: "text-slate-600", bgColor: "bg-slate-100", icon: Users },
    { key: "AI_Calling", label: "AI Calling", color: "text-primary", bgColor: "bg-primary/5", icon: Zap },
    { key: "Qualified", label: "Qualified", color: "text-emerald-600", bgColor: "bg-emerald-50", icon: Target },
    { key: "Visit_Booked", label: "Visit Booked", color: "text-secondary", bgColor: "bg-secondary/5", icon: ChevronRight },
    { key: "Visit_Completed", label: "Visit Completed", color: "text-indigo-600", bgColor: "bg-indigo-50", icon: CheckSquare },
    { key: "Booking_Done", label: "Booking Done", color: "text-emerald-700", bgColor: "bg-emerald-100", icon: Target },
    { key: "Disqualified", label: "Disqualified", color: "text-rose-600", bgColor: "bg-rose-50", icon: X },
    { key: "Negotiation", label: "Negotiation", color: "text-amber-600", bgColor: "bg-amber-50", icon: Activity }
];

type SortField = 'name' | 'createdAt' | 'aiScore' | 'currentStage';
type SortDirection = 'asc' | 'desc';

export default function LeadsTable() {
    const router = useRouter();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
    const [stageFilter, setStageFilter] = useState<LeadStage | 'all'>('all');
    const [sortField, setSortField] = useState<SortField>('createdAt');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/leads');
            if (response.ok) {
                const data = await response.json();
                setLeads(data);
            }
        } catch (error) {
            console.error('Failed to fetch leads:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const filteredAndSortedLeads = leads
        .filter(lead => {
            if (stageFilter !== 'all' && lead.currentStage !== stageFilter) return false;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    (lead.name || '').toLowerCase().includes(query) ||
                    (lead.email || '').toLowerCase().includes(query) ||
                    (lead.primaryPhone || '').includes(query)
                );
            }
            return true;
        })
        .sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
                case 'name':
                    comparison = (a.name || '').localeCompare(b.name || '');
                    break;
                case 'createdAt':
                    comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    break;
                case 'aiScore':
                    comparison = (a.aiScore || 0) - (b.aiScore || 0);
                    break;
                case 'currentStage':
                    comparison = a.currentStage.localeCompare(b.currentStage);
                    break;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });

    const toggleSelectAll = () => {
        if (selectedLeads.size === filteredAndSortedLeads.length) {
            setSelectedLeads(new Set());
        } else {
            setSelectedLeads(new Set(filteredAndSortedLeads.map(l => l.id)));
        }
    };

    const toggleSelectLead = (leadId: string) => {
        const newSelected = new Set(selectedLeads);
        if (newSelected.has(leadId)) {
            newSelected.delete(leadId);
        } else {
            newSelected.add(leadId);
        }
        setSelectedLeads(newSelected);
    };

    const handleStartCampaign = async (config: CampaignConfig) => {
        try {
            const leadIds = Array.from(selectedLeads);
            const campaignResponse = await fetch('/api/comm/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: config.name,
                    description: config.description,
                    leadIds,
                    rules: { maxRetries: config.workflowId === 'call-2-retries' ? 2 : 1 },
                    propertyIds: config.propertyIds,
                    agentId: config.agentId,
                    startDate: config.startDate
                })
            });

            const campaignData = await campaignResponse.json();
            await fetch(`/api/campaigns/${campaignData.campaign.id}/start`, { method: 'POST' });

            setActiveCampaignId(campaignData.campaign.id);
            setShowCampaignModal(true);
            setSelectedLeads(new Set());

        } catch (error) {
            console.error('Campaign Error:', error);
            alert('Failed to start campaign.');
        } finally {
            setShowConfigModal(false);
        }
    };

    const getScoreStyles = (score?: number) => {
        if (!score) return 'text-slate-400 bg-slate-100 border-transparent';
        if (score >= 80) return 'text-ai-accent bg-ai-accent/10 border-ai-accent/20 animate-ai-glow';
        if (score >= 60) return 'text-primary bg-primary/5 border-primary/20';
        if (score >= 40) return 'text-secondary bg-secondary/5 border-secondary/20';
        return 'text-slate-500 bg-slate-50 border-slate-100';
    };

    return (
        <div className="flex flex-col h-full bg-white font-sans">
            
            {/* Selection Toolbar (Floating) */}
            {selectedLeads.size > 0 && (
                <div className="px-6 py-3 bg-primary text-white flex items-center justify-between animate-in slide-in-from-top-4 duration-300 z-20">
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-black uppercase tracking-widest leading-none">
                           Node Selection: <span className="text-ai-accent">{selectedLeads.size}</span> Active
                        </span>
                        <button onClick={() => setSelectedLeads(new Set())} className="text-[10px] font-bold text-white/60 hover:text-white underline uppercase">Cancel</button>
                    </div>
                    <button
                        onClick={() => setShowConfigModal(true)}
                        className="btn-ai py-2 text-xs flex items-center gap-2"
                    >
                        <Zap size={14} />
                        Trigger Strategic Campaign
                    </button>
                </div>
            )}

            {/* Tactical Filter Bar - Redesigned */}
            <div className="p-4 border-b border-border-subtle bg-white flex flex-row items-center justify-between gap-4 z-20">
                <div className="flex items-center gap-3 relative">
                    {/* Filter Dropdown Trigger */}
                    <button 
                        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 bg-white border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            stageFilter !== 'all' 
                                ? "border-primary text-primary bg-primary/5 shadow-sm shadow-primary/10" 
                                : "border-border-subtle text-text-secondary hover:border-slate-400"
                        )}
                    >
                        <Filter size={14} className={stageFilter !== 'all' ? "text-primary" : "text-slate-400"} />
                        <span>Filter: {stageFilter === 'all' ? 'All Channels' : STAGES.find(s => s.key === stageFilter)?.label}</span>
                        <ChevronDown size={14} className={cn("transition-transform duration-300", showFilterDropdown && "rotate-180")} />
                    </button>

                    {/* Active Filter Pill (if any) */}
                    {stageFilter !== 'all' && (
                        <button 
                            onClick={() => setStageFilter('all')}
                            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    )}

                    {/* Premium Dropdown Popover */}
                    {showFilterDropdown && (
                        <>
                            <div className="fixed inset-0 z-30" onClick={() => setShowFilterDropdown(false)}></div>
                            <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-border-subtle overflow-hidden z-40 animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-3 border-b border-slate-50 bg-slate-50/50">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Operational Stages</p>
                                </div>
                                <div className="p-2 space-y-1">
                                    <button
                                        onClick={() => { setStageFilter('all'); setShowFilterDropdown(false); }}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-xs font-bold",
                                            stageFilter === 'all' ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:bg-slate-50 text-text-main"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Users size={16} className={stageFilter === 'all' ? "text-white" : "text-slate-400"} />
                                            <span>Full Pipeline (All Nodes)</span>
                                        </div>
                                        {stageFilter === 'all' && <Zap size={12} className="text-ai-accent" />}
                                    </button>
                                    
                                    <div className="h-[1px] bg-slate-100 my-1 mx-2"></div>

                                    {STAGES.map((s) => (
                                        <button
                                            key={s.key}
                                            onClick={() => { setStageFilter(s.key); setShowFilterDropdown(false); }}
                                            className={cn(
                                                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-xs font-black uppercase tracking-tight",
                                                stageFilter === s.key ? cn("bg-white ring-2", s.color, "border-current/30 shadow-md transform scale-[1.02]") : "hover:bg-slate-50 text-text-secondary"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <s.icon size={16} className={stageFilter === s.key ? s.color : "text-slate-300"} />
                                                <span>{s.label}</span>
                                            </div>
                                            {stageFilter === s.key && <Sparkles size={12} className="text-ai-accent animate-pulse" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Right-Aligned Search Bar */}
                <div className="relative w-full max-w-sm ml-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={14} />
                    <input 
                        type="text"
                        placeholder="Scan identities..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold text-text-main placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Table Content */}
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-slate-50/50 sticky top-0 z-10 text-[10px] font-black text-text-secondary uppercase tracking-[0.15em] border-b border-border-subtle">
                        <tr>
                            <th className="p-4 w-[60px]">
                                <div className="flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                                        checked={selectedLeads.size === filteredAndSortedLeads.length && filteredAndSortedLeads.length > 0}
                                        onChange={toggleSelectAll}
                                    />
                                </div>
                            </th>
                            <th className="p-4 cursor-pointer group" onClick={() => handleSort('name')}>
                                <div className="flex items-center gap-2">
                                    Lead Identity
                                    <ArrowUpDown size={10} className={cn("transition-colors", sortField === 'name' ? 'text-primary' : 'text-slate-300 group-hover:text-slate-400')} />
                                </div>
                            </th>
                            <th className="p-4 cursor-pointer group" onClick={() => handleSort('aiScore')}>
                                <div className="flex items-center gap-2">
                                    Intent Score
                                    <ArrowUpDown size={10} className={cn("transition-colors", sortField === 'aiScore' ? 'text-primary' : 'text-slate-300 group-hover:text-slate-400')} />
                                </div>
                            </th>
                            <th className="p-4 cursor-pointer group" onClick={() => handleSort('currentStage')}>
                                <div className="flex items-center gap-2">
                                    Pipeline Stage
                                    <ArrowUpDown size={10} className={cn("transition-colors", sortField === 'currentStage' ? 'text-primary' : 'text-slate-300 group-hover:text-slate-400')} />
                                </div>
                            </th>
                            <th className="p-4">Contact Logic</th>
                            <th className="p-4 cursor-pointer group" onClick={() => handleSort('createdAt')}>
                                <div className="flex items-center gap-2">
                                    Ingested
                                    <ArrowUpDown size={10} className={cn("transition-colors", sortField === 'createdAt' ? 'text-primary' : 'text-slate-300 group-hover:text-slate-400')} />
                                </div>
                            </th>
                            <th className="p-4 w-[60px]"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="p-24 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <Loader2 className="animate-spin text-primary" size={32} />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Synchronizing Delta Feed...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredAndSortedLeads.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-24 text-center">
                                    <div className="flex flex-col items-center gap-4 opacity-70">
                                        <Target className="text-slate-200" size={64} strokeWidth={1} />
                                        <div className="space-y-1">
                                            <p className="font-black text-text-main uppercase text-sm tracking-tight">No Leads Projected</p>
                                            <p className="text-xs text-text-secondary font-medium">Adjust frequency filters or search parameters.</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredAndSortedLeads.map((lead) => {
                                const isSelected = selectedLeads.has(lead.id);
                                const stage = STAGES.find(s => s.key === lead.currentStage);

                                return (
                                    <tr
                                        key={lead.id}
                                        className={cn(
                                            "group transition-all cursor-pointer",
                                            isSelected ? "bg-primary/[0.03]" : "hover:bg-slate-50/80"
                                        )}
                                        onClick={() => toggleSelectLead(lead.id)}
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                                                    checked={isSelected}
                                                    onChange={() => {}} // Controlled by row click
                                                />
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black transition-all border",
                                                    isSelected ? "bg-primary text-white border-primary" : "bg-slate-50 text-text-secondary border-slate-100 group-hover:bg-white group-hover:shadow-sm"
                                                )}>
                                                    {(lead.name && lead.name.length > 0) ? lead.name[0].toUpperCase() : '?'}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-text-main text-base uppercase tracking-tight leading-loose mb-1">{lead.name || 'Anonymous Node'}</div>
                                                    {lead.qualification?.budgetMin ? (
                                                        <div className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter bg-emerald-50 px-1.5 py-0.5 inline-block rounded-xs">
                                                            Cap: ₹{(lead.qualification.budgetMin / 100000).toFixed(1)}L+
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {lead.aiScore !== undefined && (
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black border tabular-nums",
                                                        getScoreStyles(lead.aiScore)
                                                    )}>
                                                        {lead.aiScore}
                                                    </span>
                                                    {lead.aiScore >= 80 && <Sparkles size={12} className="text-ai-accent animate-pulse" />}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {stage && (
                                                <span className={cn(
                                                    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all",
                                                    stage.bgColor, stage.color, "border-transparent group-hover:border-current/20"
                                                )}>
                                                    <stage.icon size={10} />
                                                    {stage.label}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2 text-sm font-bold text-text-main">
                                                    <Phone size={14} className="text-slate-400" />
                                                    {lead.primaryPhone}
                                                </div>
                                                {lead.email && (
                                                    <div className="flex items-center gap-2 text-xs text-text-secondary font-semibold">
                                                        <Mail size={14} className="text-slate-300" />
                                                        {lead.email}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-slate-400 tabular-nums uppercase">
                                            {new Date(lead.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                className="p-2 rounded-lg hover:bg-white hover:shadow-sm text-slate-300 hover:text-primary transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/leads/${lead.id}`);
                                                }}
                                            >
                                                <ChevronRight size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modals preserved */}
            <CreateCampaignModal
                isOpen={showConfigModal}
                onClose={() => setShowConfigModal(false)}
                onStart={handleStartCampaign}
                selectedLeadCount={selectedLeads.size}
            />

            {activeCampaignId && (
                <LiveCallStatusModal
                    campaignId={activeCampaignId}
                    isOpen={showCampaignModal}
                    onClose={() => {
                        setShowCampaignModal(false);
                        setActiveCampaignId(null);
                        fetchLeads();
                    }}
                />
            )}
        </div>
    );
}
