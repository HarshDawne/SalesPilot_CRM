"use client";

import { useState, useEffect } from "react";
import {
    Megaphone,
    Target,
    Users,
    ArrowRight,
    Building2,
    CheckCircle2,
    AlertCircle,
    LayoutGrid,
    Search,
    Zap,
    ArrowLeft,
    Check,
    Sparkles,
    Activity,
    Calendar,
    FileText
} from "lucide-react";
import { Property, Tower, Unit } from "@/types/property";
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from "@/lib/utils";

const STEPS = [
    { id: 1, title: "Command Config", icon: Megaphone, desc: "Logic & Flow" },
    { id: 2, title: "Registry Select", icon: Building2, desc: "Units/Towers" },
    { id: 3, title: "Audience Pulse", icon: Users, desc: "AI Matching" },
    { id: 4, title: "Verify & Launch", icon: CheckCircle2, desc: "Final Transmission" }
];

export default function CampaignWizardPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [currentStep, setCurrentStep] = useState(1);

    const urlPropertyId = searchParams.get('propertyId');
    const urlTowerId = searchParams.get('towerId');
    const urlUnitId = searchParams.get('unitId');

    const [properties, setProperties] = useState<Property[]>([]);
    const [towers, setTowers] = useState<Tower[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);

    const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
    const [selectedTowerIds, setSelectedTowerIds] = useState<string[]>([]);
    const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);

    const [viewMode, setViewMode] = useState<"tower" | "unit">("tower");
    const [matchingLeads, setMatchingLeads] = useState<any[]>([]);
    const [isLoadingMatches, setIsLoadingMatches] = useState(false);
    const [campaignName, setCampaignName] = useState("");
    const [campaignDate, setCampaignDate] = useState("");
    const [campaignType, setCampaignType] = useState<"whatsapp" | "email" | "voice">("voice");
    const [campaignMessage, setCampaignMessage] = useState("");
    const [selectedAgent, setSelectedAgent] = useState("aisha");
    const [workflowRetries, setWorkflowRetries] = useState(1);
    const [isLaunching, setIsLaunching] = useState(false);
    const [agentMode, setAgentMode] = useState<'SINGLE_AGENT' | 'DUAL_AGENT'>('SINGLE_AGENT');
    const [maxTotalCost, setMaxTotalCost] = useState(5000);
    const [qualificationThresholds, setQualificationThresholds] = useState({
        minIntentLevel: 'medium' as 'low' | 'medium' | 'high',
        maxTimelineMonths: 6,
    });

    useEffect(() => {
        async function fetchInventory() {
            try {
                const [propsRes, towersRes, unitsRes] = await Promise.all([
                    fetch('/api/projects'),
                    fetch('/api/towers'),
                    fetch('/api/units')
                ]);
                if (propsRes.ok) setProperties(await propsRes.json());
                if (towersRes.ok) setTowers(await towersRes.json());
                if (unitsRes.ok) setUnits(await unitsRes.json());

                if (urlPropertyId) {
                    setSelectedPropertyId(urlPropertyId);
                    if (urlTowerId) {
                        setSelectedTowerIds([urlTowerId]);
                        setViewMode("tower");
                    }
                    if (urlUnitId) {
                        setSelectedUnitIds([urlUnitId]);
                        setViewMode("unit");
                    }
                    if (urlPropertyId || urlTowerId || urlUnitId) {
                        setTimeout(() => setCurrentStep(3), 500);
                    }
                }
            } catch (e) {
                console.error("Failed to load inventory", e);
            }
        }
        fetchInventory();
    }, [urlPropertyId, urlTowerId, urlUnitId]);

    useEffect(() => {
        if (currentStep === 3) fetchMatches();
    }, [currentStep]);

    const fetchMatches = async () => {
        setIsLoadingMatches(true);
        try {
            const res = await fetch('/api/campaigns/match-audience', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    propertyId: selectedPropertyId,
                    towerIds: selectedTowerIds,
                    unitIds: selectedUnitIds,
                    criteria: { intent: 'high' }
                })
            });
            const data = await res.json();
            setMatchingLeads(data.leads || []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingMatches(false);
        }
    };

    const filteredTowers = towers.filter(t => !selectedPropertyId || t.propertyId === selectedPropertyId);
    const filteredUnits = units.filter(u =>
        (!selectedPropertyId || u.propertyId === selectedPropertyId) &&
        (selectedTowerIds.length === 0 || selectedTowerIds.includes(u.towerId))
    );

    const handleNext = () => { if (currentStep < 4) setCurrentStep(c => c + 1); };
    const handleBack = () => { if (currentStep > 1) setCurrentStep(c => c - 1); };

    const handleLaunch = async () => {
        setIsLaunching(true);
        try {
            const sourceType = urlTowerId ? 'TOWER' : urlUnitId ? 'UNIT' : selectedPropertyId ? 'PROJECT' : 'MULTI';
            const contextRes = await fetch('/api/comm/campaigns/context', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceType, propertyId: selectedPropertyId || undefined, towerIds: selectedTowerIds.length > 0 ? selectedTowerIds : undefined, unitIds: selectedUnitIds.length > 0 ? selectedUnitIds : undefined })
            });
            if (!contextRes.ok) throw new Error("Failed context");
            const context = await contextRes.json();
            const payload = {
                name: campaignName,
                leadIds: matchingLeads.map(l => l.id),
                propertyIds: selectedPropertyId ? [selectedPropertyId] : [],
                rules: { maxRetries: 2, retryDelayMinutes: 30, followUpEnabled: true, followUpDelayMinutes: 60, workingHoursOnly: false },
                context: { ...context, aiConfig: { agentMode, qualificationThresholds }, costLimits: { maxTotalCost } }
            };
            const res = await fetch('/api/comm/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const data = await res.json();
                router.push(`/communication/${data.campaign.id}`);
            } else {
                alert("Failed launch");
            }
        } catch (error) { console.error(error); } finally { setIsLaunching(false); }
    };

    return (
        <div className="max-w-[1440px] mx-auto p-6 lg:p-10 space-y-10 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-1">
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-primary transition-colors mb-2">
                        <ArrowLeft size={14} /> Global Registry
                    </button>
                    <h1 className="text-3xl font-black text-text-main tracking-tighter uppercase">Initialize <span className="text-primary">Strategic Campaign</span></h1>
                    <p className="text-sm text-text-secondary font-medium italic">Configure multi-agent outbound sequences for premium inventory velocity.</p>
                </div>
            </div>

            {/* Stepper Matrix */}
            <div className="card-premium p-6 bg-white overflow-hidden">
                <div className="flex justify-between items-center relative">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2"></div>
                    {STEPS.map((step, idx) => {
                        const isActive = currentStep === step.id;
                        const isCompleted = currentStep > step.id;
                        const Icon = step.icon;
                        return (
                            <div key={step.id} className="flex flex-col items-center relative z-10 w-full group">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300 border-2",
                                    isActive ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-110' :
                                        isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-400 group-hover:border-primary/50'
                                )}>
                                    {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                                </div>
                                <div className={cn("text-[10px] font-black uppercase tracking-widest", isActive ? 'text-primary' : 'text-slate-400')}>
                                    {step.title}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Stage Canvas */}
            <div className="card-premium p-0 bg-white border-primary/10 overflow-hidden flex flex-col min-h-[600px]">
                <div className="bg-slate-50 border-b border-border-subtle p-4 px-8 flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Operational Stage: {currentStep} // Context: Awaiting Parameters</span>
                </div>
                
                <div className="p-8 lg:p-10 flex-1 overflow-y-auto">
                    {currentStep === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <h2 className="text-xl font-black text-text-main uppercase tracking-tight flex items-center gap-3">
                                <Building2 size={24} className="text-primary" /> Target Inventory Matrix
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {properties.map(p => (
                                    <button key={p.id} onClick={() => setSelectedPropertyId(p.id === selectedPropertyId ? null : p.id)}
                                        className={cn("p-6 rounded-3xl border-2 text-left transition-all h-full", selectedPropertyId === p.id ? 'border-primary bg-primary/5 shadow-lg' : 'border-slate-100 hover:border-primary/20 bg-slate-50/50')}>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Asset Node</p>
                                        <div className="font-black text-text-main text-lg uppercase tracking-tight">{p.name}</div>
                                        <div className="text-xs text-text-secondary mt-1 font-bold italic">{p.location?.city || "Agnostic Location"}</div>
                                    </button>
                                ))}
                            </div>

                            {selectedPropertyId && (
                                <div className="space-y-6 pt-8 border-t border-slate-100">
                                    <div className="flex justify-between items-center">
                                        <div className="flex bg-slate-100 p-1 rounded-xl">
                                            <button onClick={() => setViewMode("tower")}
                                                className={cn("px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all", viewMode === 'tower' ? 'bg-white text-primary shadow-sm' : 'text-slate-500')}>Towers</button>
                                            <button onClick={() => setViewMode("unit")}
                                                className={cn("px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all", viewMode === 'unit' ? 'bg-white text-primary shadow-sm' : 'text-slate-500')}>Individual Nodes ({selectedUnitIds.length})</button>
                                        </div>
                                    </div>

                                    {viewMode === 'tower' ? (
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            {filteredTowers.map(t => (
                                                <button key={t.id} onClick={() => selectedTowerIds.includes(t.id) ? setSelectedTowerIds(ids => ids.filter(id => id !== t.id)) : setSelectedTowerIds(ids => [...ids, t.id])}
                                                    className={cn("p-5 rounded-2xl border transition-all text-left", selectedTowerIds.includes(t.id) ? 'border-primary bg-primary text-white shadow-lg' : 'border-slate-200 bg-white hover:border-primary/50')}>
                                                    <div className="font-black uppercase text-xs">{t.name}</div>
                                                    <div className={cn("text-[9px] font-bold mt-1", selectedTowerIds.includes(t.id) ? "text-white/70" : "text-slate-400")}>{t.availableUnits} Nodes Available</div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 p-4 bg-slate-50 rounded-3xl border border-slate-100 max-h-[400px] overflow-y-auto">
                                            {filteredUnits.map(u => (
                                                <button key={u.id} onClick={() => selectedUnitIds.includes(u.id) ? setSelectedUnitIds(ids => ids.filter(id => id !== u.id)) : setSelectedUnitIds(ids => [...ids, u.id])}
                                                    className={cn("p-3 rounded-xl border text-[10px] font-black uppercase flex flex-col items-center justify-center transition-all h-20", selectedUnitIds.includes(u.id) ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white border-slate-200 hover:border-primary/30 text-text-secondary')} disabled={u.status !== 'AVAILABLE'}>
                                                    <span>Node {u.unitNumber}</span>
                                                    <span className="text-[10px] mt-1 opacity-70 italic">{u.type}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <h2 className="text-xl font-black text-text-main uppercase tracking-tight flex items-center gap-3">
                                <Users size={24} className="text-secondary" /> Audience Pulse & AI Synapse
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                <div className="md:col-span-4 space-y-4">
                                    <div className="card-premium p-6 bg-slate-50/50 border-none">
                                        <h3 className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-4">Strategic Heuristics</h3>
                                        <div className="space-y-3">
                                            {['Budget Matrix Alignment', 'Preferred Sector Match', 'Intent Score > 75'].map(filter => (
                                                <div key={filter} className="flex items-center gap-3 text-[10px] font-black text-text-main uppercase tracking-tight">
                                                    <div className="h-4 w-4 rounded-md bg-emerald-500 flex items-center justify-center text-white"><Check size={10} /></div>
                                                    {filter}
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={fetchMatches} className="btn-primary w-full py-2.5 mt-6 text-[10px]">Refresh Delta Sync</button>
                                    </div>
                                </div>
                                <div className="md:col-span-8">
                                    <div className="bg-primary/5 rounded-t-3xl p-4 px-6 border border-primary/10 border-b-0 flex justify-between items-center">
                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">{isLoadingMatches ? 'Indexing Transmissions...' : `${matchingLeads.length} Identified Potential Nodes`}</span>
                                        <Sparkles size={16} className="text-ai-accent" />
                                    </div>
                                    <div className="border border-border-subtle rounded-b-3xl max-h-[400px] overflow-y-auto bg-white">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50/50 border-b border-border-subtle">
                                                <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                    <th className="p-4 px-6">Identified Lead</th>
                                                    <th className="p-4 px-6">Synapse Score</th>
                                                    <th className="p-4 px-6">Strategic Reason</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 font-sans">
                                                {matchingLeads.map(lead => (
                                                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="p-4 px-6 font-bold text-text-main text-sm">{lead.name}</td>
                                                        <td className="p-4 px-6">
                                                            <span className={cn("inline-block px-2 py-0.5 rounded text-[10px] font-black tabular-nums border", lead.matches > 90 ? "bg-ai-accent/10 border-ai-accent/20 text-ai-accent" : "bg-primary/5 border-primary/10 text-primary")}>{lead.matches}%</span>
                                                        </td>
                                                        <td className="p-4 px-6 text-[11px] font-medium text-text-secondary italic">"{lead.matchReason}"</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 max-w-2xl">
                            <h2 className="text-xl font-black text-text-main uppercase tracking-tight flex items-center gap-3">
                                <Megaphone size={24} className="text-primary" /> Multi-Agent Command Logic
                            </h2>
                            <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-8 shadow-xs">
                                
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold flex items-center gap-2 text-slate-800"><Users size={16} className="text-primary"/> Select Agent</h3>
                                    <button 
                                        onClick={() => setSelectedAgent('aisha')}
                                        className={cn("w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all", selectedAgent === 'aisha' ? 'border-primary bg-primary/5' : 'border-slate-100 bg-slate-50 hover:border-primary/30')}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-primary text-white font-black flex items-center justify-center shadow-md">A</div>
                                            <div className="text-left">
                                                <div className="font-bold text-slate-900 text-sm">Aisha</div>
                                                <div className="text-[11px] text-slate-500 font-medium leading-none mt-1">Only Agent Available</div>
                                            </div>
                                        </div>
                                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center transition-all", selectedAgent === 'aisha' ? 'bg-primary text-white' : 'bg-slate-200 text-transparent')}>
                                            <Check size={14} />
                                        </div>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold flex items-center gap-2 text-slate-800"><Activity size={16} className="text-primary"/> Select Workflow</h3>
                                    <div className="space-y-3">
                                        {[
                                            { id: 1, title: "Call with 1 Retry", desc: "Standard follow-up" },
                                            { id: 2, title: "Call with 2 Retries", desc: "Aggressive follow-up" }
                                        ].map(flow => (
                                            <button 
                                                key={flow.id}
                                                onClick={() => setWorkflowRetries(flow.id)}
                                                className={cn("w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left", workflowRetries === flow.id ? 'border-primary bg-white shadow-sm' : 'border-slate-100 bg-slate-50')}
                                            >
                                                <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors", workflowRetries === flow.id ? 'border-primary' : 'border-slate-300')}>
                                                    {workflowRetries === flow.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 text-sm">{flow.title}</div>
                                                    <div className="text-[11px] text-slate-500 font-medium leading-none mt-1">{flow.desc}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold flex items-center gap-2 text-slate-800"><Calendar size={16} className="text-primary"/> Start Date</h3>
                                    <input type="date" value={campaignDate} onChange={(e) => setCampaignDate(e.target.value)} 
                                        className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl focus:border-primary transition-all outline-none font-bold text-sm text-slate-700" />
                                </div>

                                <div className="pt-2 space-y-4">
                                    <h3 className="text-sm font-bold flex items-center gap-2 text-slate-800"><FileText size={16} className="text-primary"/> Campaign Details</h3>
                                    <div className="space-y-4">
                                        <input type="text" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="Campaign Title (e.g. Q4 Luxury Outreach)"
                                            className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-bold text-sm text-slate-800 placeholder:text-slate-400 shadow-sm" />
                                        
                                        <textarea rows={4} value={campaignMessage} onChange={(e) => setCampaignMessage(e.target.value)} placeholder="Campaign Description (What is the primary objective of this sequence?)"
                                            className="w-full p-5 bg-white border border-slate-200 rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium text-sm text-slate-600 placeholder:text-slate-400 shadow-sm resize-none" />
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="text-center py-20 space-y-8 animate-in zoom-in-95 duration-500 max-w-2xl mx-auto">
                            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-100 animate-pulse">
                                <CheckCircle2 size={48} />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black text-text-main tracking-tighter uppercase">Operational Verification</h2>
                                <p className="text-sm text-text-secondary font-medium">Strategic sequence ready for deployment.</p>
                            </div>
                            <div className="card-premium p-8 bg-slate-50/80 border-none text-left space-y-6">
                                <div className="grid grid-cols-2 gap-8 border-b border-slate-200 pb-6">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Campaign Title</p>
                                        <p className="text-sm font-bold text-slate-900">{campaignName || 'Unnamed Protocol'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Date</p>
                                        <p className="text-sm font-bold text-slate-900">{campaignDate ? new Date(campaignDate).toLocaleDateString() : 'Immediate'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Protocol Type</p>
                                        <p className="text-sm font-black text-primary uppercase">{campaignType} {campaignType === 'voice' && `(AI-${agentMode})`}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Nodes</p>
                                        <p className="text-sm font-black text-slate-900">{matchingLeads.length} Profiles</p>
                                    </div>
                                </div>
                                <div className="pb-6 border-b border-slate-200">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Message Context</p>
                                    <p className="text-xs font-medium text-slate-600 bg-white p-4 rounded-xl border border-slate-100 italic">
                                        {campaignMessage || 'No specific context provided.'}
                                    </p>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculated Budget</span>
                                    <span className="text-2xl font-black text-emerald-600">₹{(matchingLeads.length * 25).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-8 border-t border-border-subtle bg-slate-50/20 flex justify-between items-center px-12">
                    <button onClick={handleBack} disabled={currentStep === 1}
                        className="btn-primary-outline py-2.5 px-8 text-xs disabled:opacity-30 uppercase tracking-widest">Initiate Correction</button>
                    {currentStep === 4 ? (
                        <button onClick={handleLaunch} disabled={isLaunching}
                            className="btn-ai py-3 px-12 text-sm flex items-center gap-3 animate-ai-glow">
                            {isLaunching ? 'COMMITTING...' : <><Megaphone size={18} /> Launch Strategic Sequence</>}
                        </button>
                    ) : (
                        <button onClick={handleNext} disabled={(currentStep === 2 && !selectedPropertyId) || (currentStep === 1 && !campaignName)}
                            className="btn-primary py-3 px-10 text-sm flex items-center gap-3 shadow-xl shadow-primary/20">
                            Proceed to Phase {currentStep + 1} <ArrowRight size={18} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
