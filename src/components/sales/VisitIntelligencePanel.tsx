"use client";

import React, { useState } from 'react';
import { 
    User, Phone, Calendar, Target, DollarSign, Clock, MessageSquare, 
    ChevronRight, CheckCircle2, AlertCircle, RefreshCw, Send,
    Download, Shield, ExternalLink, Activity, Sparkles, Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface VisitIntelligencePanelProps {
    lead: any;
    visit: any;
    onFeedbackSubmit: (outcome: 'interested' | 'nurture' | 'no_show', notes?: string) => Promise<void>;
    onClose?: () => void;
}

export function VisitIntelligencePanel({ lead, visit, onFeedbackSubmit, onClose }: VisitIntelligencePanelProps) {
    const [submitting, setSubmitting] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'prep' | 'transcript' | 'timeline'>('prep');

    const handleFeedback = async (outcome: 'interested' | 'nurture' | 'no_show') => {
        setSubmitting(outcome);
        try {
            await onFeedbackSubmit(outcome);
        } finally {
            setSubmitting(null);
        }
    };

    if (!lead) return null;

    const callRecords = lead.aiCalling?.callRecords || [];
    const latestCall = callRecords.length > 0 ? callRecords[callRecords.length - 1] : null;

    return (
        <div className="flex flex-col h-full bg-white font-sans">
            {/* 1. Profile Header: Royal Blue Theme */}
            <div className="p-8 bg-primary text-white relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-ai-accent/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl font-black shadow-2xl border border-white/20">
                                {lead.name?.[0] || 'L'}
                            </div>
                            <div>
                                <h2 className="text-xl font-black tracking-tighter uppercase">{lead.name}</h2>
                                <div className="flex items-center gap-2 text-white/50 text-[10px] mt-1 font-black uppercase tracking-widest">
                                    <span className="px-2 py-0.5 bg-ai-accent text-primary rounded-md">
                                        {lead.currentStage?.replace('_', ' ')}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1"><Phone size={10} /> {lead.primaryPhone}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mb-1">Intent Score</p>
                            <div className="text-3xl font-black text-ai-accent animate-ai-glow">
                                {lead.aiScore || 0}%
                            </div>
                        </div>
                    </div>

                    {/* Quick Matrix Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        <MatrixKPI icon={<DollarSign size={12} />} label="Budget" value={`₹${(lead.qualification?.budgetMin / 100000).toFixed(1)}L+`} />
                        <MatrixKPI icon={<Target size={12} />} label="Config" value={lead.qualification?.configurations?.[0] || '3BHK'} />
                        <MatrixKPI icon={<Activity size={12} />} label="Pulse" value={lead.aiScore > 80 ? 'HIGH' : 'WARM'} />
                    </div>
                </div>
            </div>

            {/* 3. Operational Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Prep Summary */}
                    <div className="bg-primary/[0.02] border border-primary/10 rounded-2xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-125 transition-all text-primary">
                            <Shield size={48} />
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-primary/5 rounded-lg text-primary border border-primary/10">
                                <Sparkles size={16} />
                            </div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-text-main">AI Agent Intelligence</h3>
                        </div>
                        <p className="text-sm text-text-secondary leading-relaxed font-medium italic border-l-2 border-ai-accent pl-4">
                            "{latestCall?.summary || "Lead Expressed urgency for 3BHK high-floor units. Low sensitivity to pricing (₹1.8Cr+). Key concerns: Possession date (Dec 2026)."}"
                        </p>
                    </div>

                    {/* Tactical Metadata */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Engagement Nodes</h3>
                        <div className="grid grid-cols-1 gap-2">
                            <MetadataRow label="Project Priority" value={visit.projectName || "Nexus Peak"} />
                            <MetadataRow label="Decision Dynamic" value={lead.qualification?.decisionMaker || "Primary"} />
                            <MetadataRow label="Intent Type" value={lead.qualification?.purpose || "Ownership"} />
                        </div>
                    </div>

                    {/* Predictive Pulse */}
                    <div className="bg-emerald-50/30 border border-emerald-100 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em]">Predictive Conversion</span>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 rounded-full text-[9px] font-black text-emerald-600">
                                <TrendingUp size={10} /> OPTIMAL
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="h-1.5 w-full bg-emerald-100/50 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[92%] shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                            </div>
                            <p className="text-[10px] text-emerald-600 font-bold leading-relaxed uppercase tracking-tight">
                                High session duration (5m+). Recursive amenity tracking detected.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Executive Actions (Footer) */}
            <div className="p-8 border-t border-border-subtle bg-white shrink-0">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 text-center">Log Operation Outcome</p>
                
                <div className="grid grid-cols-3 gap-4">
                    <OutcomeBtn 
                        label="Interested" 
                        icon={<CheckCircle2 size={18} />} 
                        color="success" 
                        loading={submitting === 'interested'} 
                        onClick={() => handleFeedback('interested')} 
                    />
                    <OutcomeBtn 
                        label="Nurture" 
                        icon={<Clock size={18} />} 
                        color="primary" 
                        loading={submitting === 'nurture'} 
                        onClick={() => handleFeedback('nurture')} 
                    />
                    <OutcomeBtn 
                        label="No-Show" 
                        icon={<AlertCircle size={18} />} 
                        color="danger" 
                        loading={submitting === 'no_show'} 
                        onClick={() => handleFeedback('no_show')} 
                    />
                </div>

                <div className="mt-8 flex items-center justify-center gap-3 py-3 px-4 bg-primary/[0.03] rounded-xl border border-primary/5 border-dashed">
                    <Send size={14} className="text-secondary" />
                    <span className="text-[10px] font-black uppercase tracking-tight text-text-secondary">Next Sequence: <span className="text-primary">WhatsApp + Virtual Tour</span></span>
                </div>
            </div>
        </div>
    );
}

function MatrixKPI({ icon, label, value }: any) {
    return (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 flex flex-col justify-between h-16">
            <div className="flex items-center gap-2 text-white/40">
                {icon}
                <span className="text-[9px] uppercase font-black tracking-widest">{label}</span>
            </div>
            <p className="text-xs font-black text-ai-accent truncate leading-none">{value}</p>
        </div>
    );
}

function MetadataRow({ label, value }: any) {
    return (
        <div className="flex justify-between items-center p-4 bg-slate-50/50 border border-slate-100 rounded-xl group hover:border-primary/20 transition-colors">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{label}</span>
            <span className="text-xs font-black text-text-main group-hover:text-primary transition-colors">{value}</span>
        </div>
    );
}

function OutcomeBtn({ label, icon, color, loading, onClick }: any) {
    const colors = {
        success: "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100",
        primary: "bg-primary/5 text-primary border-primary/10 hover:bg-primary/10",
        danger: "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100"
    };

    return (
        <button
            onClick={onClick}
            disabled={loading}
            className={cn(
                "flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all active:scale-95",
                colors[color as keyof typeof colors]
            )}
        >
            <div className="transition-transform group-hover:scale-110">
                {loading ? <RefreshCw className="animate-spin" size={18} /> : icon}
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
        </button>
    );
}

const TrendingUp = ({ size, className }: { size: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
);
