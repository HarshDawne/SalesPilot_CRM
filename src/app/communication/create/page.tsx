"use client";

import { useState, useEffect } from "react";
import {
    Megaphone,
    Users,
    ArrowRight,
    Building2,
    CheckCircle2,
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
                    if (urlTowerId) { setSelectedTowerIds([urlTowerId]); setViewMode("tower"); }
                    if (urlUnitId) { setSelectedUnitIds([urlUnitId]); setViewMode("unit"); }
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
                body: JSON.stringify({ propertyId: selectedPropertyId, towerIds: selectedTowerIds, unitIds: selectedUnitIds, criteria: { intent: 'high' } })
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
                alert("Failed to launch campaign");
            }
        } catch (error) { console.error(error); } finally { setIsLaunching(false); }
    };

    return (
        <div className="max-w-[1440px] mx-auto px-4 py-5 md:px-6 md:py-7 lg:px-10 lg:py-10 space-y-5 md:space-y-6 animate-in fade-in duration-500 overflow-x-hidden">
            
            {/* ── Header ─────────────────────────────────────── */}
            <div className="flex flex-col gap-1">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-primary transition-colors w-fit mb-1">
                    <ArrowLeft size={13} /> Back to Operations
                </button>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-text-main tracking-tighter uppercase">
                    Initialize <span className="text-primary">Strategic Campaign</span>
                </h1>
                <p className="text-xs md:text-sm text-text-secondary font-medium italic">
                    Configure multi-agent outbound sequences for premium inventory velocity.
                </p>
            </div>

            {/* ── Stepper ─────────────────────────────────────── */}
            <div className="card-premium p-3 md:p-4 bg-white overflow-x-auto">
                <div className="flex justify-between items-start relative min-w-[400px]">
                    {/* Connector line */}
                    <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-slate-100 z-0" />
                    {STEPS.map((step) => {
                        const isActive = currentStep === step.id;
                        const isCompleted = currentStep > step.id;
                        const Icon = step.icon;
                        return (
                            <div key={step.id} className="flex flex-col items-center relative z-10 flex-1 group px-1">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-all duration-300 border-2 bg-white",
                                    isActive   ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-110' :
                                    isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' :
                                                  'border-slate-200 text-slate-400'
                                )}>
                                    {isCompleted ? <Check size={16} /> : <Icon size={16} />}
                                </div>
                                <span className={cn(
                                    "text-[9px] font-black uppercase tracking-wider text-center leading-tight max-w-[60px]",
                                    isActive ? 'text-primary' : 'text-slate-400'
                                )}>
                                    {step.title}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Stage Canvas ─────────────────────────────────── */}
            <div className="card-premium p-0 bg-white border-primary/10 overflow-hidden flex flex-col">
                {/* Canvas header */}
                <div className="bg-slate-50 border-b border-border-subtle px-5 py-3 flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">
                        Stage {currentStep} — Awaiting Input
                    </span>
                </div>

                {/* Canvas body — scrollable, capped height */}
                <div className="p-5 md:p-7 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 360px)', minHeight: '380px' }}>

                    {/* ── STEP 1: Command Config ── */}
                    {currentStep === 1 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 max-w-xl">
                            <h2 className="text-base md:text-lg font-black text-text-main uppercase tracking-tight flex items-center gap-2">
                                <Megaphone size={18} className="text-primary" /> Multi-Agent Command Logic
                            </h2>
                            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5 shadow-xs">

                                {/* Agent */}
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold flex items-center gap-2 text-slate-700"><Users size={13} className="text-primary" /> Select Agent</h3>
                                    <button
                                        onClick={() => setSelectedAgent('aisha')}
                                        className={cn("w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all", selectedAgent === 'aisha' ? 'border-primary bg-primary/5' : 'border-slate-100 bg-slate-50 hover:border-primary/30')}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary text-white font-black flex items-center justify-center shadow text-sm">A</div>
                                            <div className="text-left">
                                                <div className="font-bold text-slate-900 text-sm">Aisha</div>
                                                <div className="text-[10px] text-slate-500 font-medium">Only Agent Available</div>
                                            </div>
                                        </div>
                                        <div className={cn("w-5 h-5 rounded-full flex items-center justify-center transition-all", selectedAgent === 'aisha' ? 'bg-primary text-white' : 'bg-slate-200 text-transparent')}>
                                            <Check size={11} />
                                        </div>
                                    </button>
                                </div>

                                {/* Workflow */}
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold flex items-center gap-2 text-slate-700"><Activity size={13} className="text-primary" /> Select Workflow</h3>
                                    <div className="space-y-2">
                                        {[
                                            { id: 1, title: "Call with 1 Retry", desc: "Standard follow-up" },
                                            { id: 2, title: "Call with 2 Retries", desc: "Aggressive follow-up" }
                                        ].map(flow => (
                                            <button
                                                key={flow.id}
                                                onClick={() => setWorkflowRetries(flow.id)}
                                                className={cn("w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left", workflowRetries === flow.id ? 'border-primary bg-white shadow-sm' : 'border-slate-100 bg-slate-50')}
                                            >
                                                <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors shrink-0", workflowRetries === flow.id ? 'border-primary' : 'border-slate-300')}>
                                                    {workflowRetries === flow.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 text-sm">{flow.title}</div>
                                                    <div className="text-[10px] text-slate-500 font-medium">{flow.desc}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Start Date */}
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold flex items-center gap-2 text-slate-700"><Calendar size={13} className="text-primary" /> Start Date</h3>
                                    <input type="date" value={campaignDate} onChange={e => setCampaignDate(e.target.value)}
                                        className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl focus:border-primary transition-all outline-none font-bold text-sm text-slate-700" />
                                </div>

                                {/* Campaign details */}
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold flex items-center gap-2 text-slate-700"><FileText size={13} className="text-primary" /> Campaign Details</h3>
                                    <div className="space-y-2">
                                        <input type="text" value={campaignName} onChange={e => setCampaignName(e.target.value)}
                                            placeholder="Campaign Title (e.g. Q4 Luxury Outreach)"
                                            className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-bold text-sm text-slate-800 placeholder:text-slate-400 shadow-sm" />
                                        <textarea rows={3} value={campaignMessage} onChange={e => setCampaignMessage(e.target.value)}
                                            placeholder="Campaign Description (Primary objective of this sequence?)"
                                            className="w-full p-4 bg-white border border-slate-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium text-sm text-slate-600 placeholder:text-slate-400 shadow-sm resize-none" />
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: Registry Select ── */}
                    {currentStep === 2 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
                            <h2 className="text-base md:text-lg font-black text-text-main uppercase tracking-tight flex items-center gap-2">
                                <Building2 size={18} className="text-primary" /> Target Inventory Matrix
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {properties.map(p => (
                                    <button key={p.id} onClick={() => setSelectedPropertyId(p.id === selectedPropertyId ? null : p.id)}
                                        className={cn("p-4 rounded-2xl border-2 text-left transition-all", selectedPropertyId === p.id ? 'border-primary bg-primary/5 shadow-lg' : 'border-slate-100 hover:border-primary/20 bg-slate-50/50')}>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Asset Node</p>
                                        <div className="font-black text-text-main text-sm uppercase tracking-tight">{p.name}</div>
                                        <div className="text-xs text-text-secondary mt-0.5 font-bold italic">{p.location?.city || "Unknown City"}</div>
                                    </button>
                                ))}
                            </div>

                            {selectedPropertyId && (
                                <div className="space-y-4 pt-5 border-t border-slate-100">
                                    <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                                        <button onClick={() => setViewMode("tower")}
                                            className={cn("px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all", viewMode === 'tower' ? 'bg-white text-primary shadow-sm' : 'text-slate-500')}>
                                            Towers
                                        </button>
                                        <button onClick={() => setViewMode("unit")}
                                            className={cn("px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all", viewMode === 'unit' ? 'bg-white text-primary shadow-sm' : 'text-slate-500')}>
                                            Units ({selectedUnitIds.length})
                                        </button>
                                    </div>

                                    {viewMode === 'tower' ? (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {filteredTowers.map(t => (
                                                <button key={t.id} onClick={() => selectedTowerIds.includes(t.id) ? setSelectedTowerIds(ids => ids.filter(id => id !== t.id)) : setSelectedTowerIds(ids => [...ids, t.id])}
                                                    className={cn("p-4 rounded-xl border transition-all text-left", selectedTowerIds.includes(t.id) ? 'border-primary bg-primary text-white shadow-lg' : 'border-slate-200 bg-white hover:border-primary/50')}>
                                                    <div className="font-black uppercase text-xs">{t.name}</div>
                                                    <div className={cn("text-[9px] font-bold mt-1", selectedTowerIds.includes(t.id) ? "text-white/70" : "text-slate-400")}>{t.availableUnits} Available</div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 max-h-[260px] overflow-y-auto">
                                            {filteredUnits.map(u => (
                                                <button key={u.id} onClick={() => selectedUnitIds.includes(u.id) ? setSelectedUnitIds(ids => ids.filter(id => id !== u.id)) : setSelectedUnitIds(ids => [...ids, u.id])}
                                                    className={cn("p-2 rounded-xl border text-[9px] font-black uppercase flex flex-col items-center justify-center transition-all h-14", selectedUnitIds.includes(u.id) ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white border-slate-200 hover:border-primary/30 text-text-secondary')}
                                                    disabled={u.status !== 'AVAILABLE'}>
                                                    <span>Unit {u.unitNumber}</span>
                                                    <span className="opacity-60 italic text-[8px] mt-0.5">{u.type}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── STEP 3: Audience Pulse ── */}
                    {currentStep === 3 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
                            <h2 className="text-base md:text-lg font-black text-text-main uppercase tracking-tight flex items-center gap-2">
                                <Users size={18} className="text-secondary" /> Audience Pulse & AI Synapse
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                                <div className="md:col-span-4">
                                    <div className="card-premium p-4 bg-slate-50/50 border-none">
                                        <h3 className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-3">Strategic Heuristics</h3>
                                        <div className="space-y-2">
                                            {['Budget Matrix Alignment', 'Preferred Sector Match', 'Intent Score > 75'].map(f => (
                                                <div key={f} className="flex items-center gap-2 text-[10px] font-black text-text-main uppercase tracking-tight">
                                                    <div className="h-4 w-4 rounded-md bg-emerald-500 flex items-center justify-center text-white shrink-0"><Check size={9} /></div>
                                                    {f}
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={fetchMatches} className="btn-primary w-full py-2 mt-4 text-[10px]">Refresh Sync</button>
                                    </div>
                                </div>
                                <div className="md:col-span-8">
                                    <div className="bg-primary/5 rounded-t-2xl px-5 py-3 border border-primary/10 border-b-0 flex justify-between items-center">
                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                                            {isLoadingMatches ? 'Indexing...' : `${matchingLeads.length} Identified Leads`}
                                        </span>
                                        <Sparkles size={13} className="text-ai-accent" />
                                    </div>
                                    <div className="border border-border-subtle rounded-b-2xl max-h-[280px] overflow-y-auto bg-white">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50/50 border-b border-border-subtle sticky top-0">
                                                <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                    <th className="p-3 px-4">Lead</th>
                                                    <th className="p-3 px-4">Score</th>
                                                    <th className="p-3 px-4 hidden md:table-cell">Reason</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {matchingLeads.map(lead => (
                                                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="p-3 px-4 font-bold text-text-main text-sm">{lead.name}</td>
                                                        <td className="p-3 px-4">
                                                            <span className={cn("inline-block px-2 py-0.5 rounded text-[10px] font-black border", lead.matches > 90 ? "bg-ai-accent/10 border-ai-accent/20 text-ai-accent" : "bg-primary/5 border-primary/10 text-primary")}>{lead.matches}%</span>
                                                        </td>
                                                        <td className="p-3 px-4 text-[10px] font-medium text-text-secondary italic hidden md:table-cell">"{lead.matchReason}"</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 4: Verify & Launch ── */}
                    {currentStep === 4 && (
                        <div className="text-center py-8 space-y-5 animate-in zoom-in-95 duration-500 max-w-2xl mx-auto">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-100 animate-pulse">
                                <CheckCircle2 size={34} />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-xl md:text-2xl font-black text-text-main tracking-tighter uppercase">Operational Verification</h2>
                                <p className="text-sm text-text-secondary font-medium">Strategic sequence ready for deployment.</p>
                            </div>
                            <div className="card-premium p-5 bg-slate-50/80 border-none text-left space-y-4">
                                <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-4">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Campaign Title</p>
                                        <p className="text-sm font-bold text-slate-900">{campaignName || 'Unnamed Protocol'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Target Date</p>
                                        <p className="text-sm font-bold text-slate-900">{campaignDate ? new Date(campaignDate).toLocaleDateString() : 'Immediate'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Protocol Type</p>
                                        <p className="text-sm font-black text-primary uppercase">{campaignType} {campaignType === 'voice' && `(AI-${agentMode})`}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Target Leads</p>
                                        <p className="text-sm font-black text-slate-900">{matchingLeads.length} Profiles</p>
                                    </div>
                                </div>
                                <div className="pb-4 border-b border-slate-200">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Message Context</p>
                                    <p className="text-xs font-medium text-slate-600 bg-white p-3 rounded-xl border border-slate-100 italic">
                                        {campaignMessage || 'No specific context provided.'}
                                    </p>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Calculated Budget</span>
                                    <span className="text-xl md:text-2xl font-black text-emerald-600">₹{(matchingLeads.length * 25).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Navigation Bar ── */}
                <div className="px-5 md:px-7 py-4 border-t border-border-subtle bg-slate-50/30 flex justify-between items-center">
                    <button onClick={handleBack} disabled={currentStep === 1}
                        className="btn-primary-outline py-2 px-5 text-xs disabled:opacity-30 uppercase tracking-widest">
                        Back
                    </button>
                    {currentStep === 4 ? (
                        <button onClick={handleLaunch} disabled={isLaunching}
                            className="btn-ai py-2.5 px-7 text-sm flex items-center gap-2 animate-ai-glow">
                            {isLaunching ? 'Launching...' : <><Megaphone size={15} /> Launch Sequence</>}
                        </button>
                    ) : (
                        <button onClick={handleNext}
                            disabled={(currentStep === 2 && !selectedPropertyId) || (currentStep === 1 && !campaignName)}
                            className="btn-primary py-2.5 px-7 text-sm flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-40">
                            Phase {currentStep + 1} <ArrowRight size={15} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
