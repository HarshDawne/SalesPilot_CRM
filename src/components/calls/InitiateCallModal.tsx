"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    Phone, X, Building2, User, Wallet, MapPin,
    Sparkles, CheckCircle, AlertCircle, Loader2,
    ChevronDown, Home, Eye, Users, ListOrdered
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeadSnapshot {
    id: string;
    name: string;
    primaryPhone?: string;
    phone?: string;
    currentStage?: string;
    qualification?: {
        budgetMin?: number;
        budgetMax?: number;
        preferredLocations?: string[];
        configurations?: string[];
        intentLevel?: string;
    };
    budgetMin?: number;
    budgetMax?: number;
}

interface PropertyOption {
    id: string;
    name: string;
    location: { locality: string; city: string };
    startingPrice?: number | null;
    minBedrooms?: number | null;
    maxBedrooms?: number | null;
    highlights: string[];
    developerName: string;
    isActive: boolean;
}

interface QueueResult {
    leadId: string;
    leadName: string;
    phone: string;
    success: boolean;
    callId?: string;
    error?: string;
    position: number;
}

interface InitiateCallModalProps {
    lead?: LeadSnapshot;            // single lead mode
    leads?: LeadSnapshot[];         // queue mode (multiple leads)
    onClose: () => void;
    onSuccess?: (callId: string) => void;
    onQueueComplete?: (results: QueueResult[]) => void;
}

type CallState = "idle" | "loading" | "calling" | "success" | "error" | "queue_running" | "queue_done";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBudget(min?: number | null, max?: number | null): string {
    const fmt = (n: number) => {
        if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
        if (n >= 100000) return `₹${(n / 100000).toFixed(0)} L`;
        return `₹${n.toLocaleString("en-IN")}`;
    };
    if (min && max) return `${fmt(min)} – ${fmt(max)}`;
    if (min) return `${fmt(min)}+`;
    if (max) return `up to ${fmt(max)}`;
    return "Not specified";
}

function stageColor(stage?: string): string {
    const map: Record<string, string> = {
        New: "bg-sky-100 text-sky-700",
        AI_Calling: "bg-violet-100 text-violet-700",
        Qualified: "bg-emerald-100 text-emerald-700",
        Visit_Booked: "bg-amber-100 text-amber-700",
        Hot: "bg-rose-100 text-rose-700",
    };
    return map[stage || ""] || "bg-slate-100 text-slate-600";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function InitiateCallModal({
    lead,
    leads,
    onClose,
    onSuccess,
    onQueueComplete,
}: InitiateCallModalProps) {
    // Determine mode
    const allLeads = leads && leads.length > 0 ? leads : lead ? [lead] : [];
    const isQueueMode = allLeads.length > 1;
    const singleLead = allLeads.length === 1 ? allLeads[0] : null;

    const [properties, setProperties] = useState<PropertyOption[]>([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [callState, setCallState] = useState<CallState>("idle");
    const [callId, setCallId] = useState<string>("");
    const [errorMsg, setErrorMsg] = useState<string>("");
    const [propertiesLoading, setPropertiesLoading] = useState(true);

    // Queue progress state
    const [queueResults, setQueueResults] = useState<QueueResult[]>([]);
    const [queueCurrent, setQueueCurrent] = useState<number>(0);
    const [queueTotal, setQueueTotal] = useState<number>(0);
    const abortRef = useRef(false);

    const phone = singleLead?.primaryPhone || singleLead?.phone || "";

    // ── Load properties ───────────────────────────────────────────────────────
    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const res = await fetch("/api/properties");
                if (!res.ok) throw new Error("Failed to load");
                const data = await res.json();
                const active = (data.properties || data || []).filter(
                    (p: PropertyOption) => p.isActive !== false
                );
                setProperties(active);
                if (active.length === 1) setSelectedPropertyId(active[0].id);
            } catch {
                setProperties([]);
            } finally {
                setPropertiesLoading(false);
            }
        };
        fetchProperties();
    }, []);

    const selectedProperty = properties.find((p) => p.id === selectedPropertyId);

    // ── Launch single call ────────────────────────────────────────────────────
    const handleLaunchCall = useCallback(async () => {
        if (!selectedPropertyId || !singleLead) return;
        setCallState("calling");
        setErrorMsg("");

        try {
            const res = await fetch("/api/calls/initiate-call", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    leadId: singleLead.id,
                    propertyId: selectedPropertyId,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Call failed to initiate");
            }

            setCallId(data.callId || "");
            setCallState("success");
            onSuccess?.(data.callId || "");
        } catch (err: any) {
            setErrorMsg(err.message || "Something went wrong");
            setCallState("error");
        }
    }, [selectedPropertyId, singleLead, onSuccess]);

    // ── Launch queue (sequential) ─────────────────────────────────────────────
    const handleLaunchQueue = useCallback(async () => {
        if (!selectedPropertyId || allLeads.length === 0) return;
        setCallState("queue_running");
        setErrorMsg("");
        setQueueResults([]);
        setQueueCurrent(0);
        setQueueTotal(allLeads.length);
        abortRef.current = false;

        try {
            const res = await fetch("/api/calls/queue-call", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    leadIds: allLeads.map((l) => l.id),
                    propertyId: selectedPropertyId,
                    delayMs: 2000,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Queue failed");
            }

            setQueueResults(data.results || []);
            setQueueCurrent(data.total);
            setCallState("queue_done");
            onQueueComplete?.(data.results || []);
        } catch (err: any) {
            setErrorMsg(err.message || "Queue failed");
            setCallState("error");
        }
    }, [selectedPropertyId, allLeads, onQueueComplete]);

    const budget = singleLead
        ? formatBudget(
              singleLead.qualification?.budgetMin ?? singleLead.budgetMin,
              singleLead.qualification?.budgetMax ?? singleLead.budgetMax
          )
        : "";

    const config = singleLead?.qualification?.configurations?.join(", ") || "—";
    const area = singleLead?.qualification?.preferredLocations?.join(", ") || "—";

    const successResults = queueResults.filter((r) => r.success);
    const failedResults = queueResults.filter((r) => !r.success);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-border-subtle animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Header ── */}
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 text-white relative overflow-hidden flex-shrink-0">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                {isQueueMode ? (
                                    <ListOrdered size={20} className="text-white" />
                                ) : (
                                    <Sparkles size={20} className="text-white" />
                                )}
                            </div>
                            <div>
                                <h2 className="font-black text-base tracking-tight">
                                    {isQueueMode
                                        ? `Queue AI Calls (${allLeads.length} leads)`
                                        : "Initiate AI Call"}
                                </h2>
                                <p className="text-violet-200 text-xs font-medium">
                                    Aarini · Citizen Properties
                                    {isQueueMode && " · Sequential Mode"}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto flex-1">
                    {/* ── Single Lead Summary ── */}
                    {singleLead && !isQueueMode && (
                        <div className="bg-slate-50 rounded-xl p-4 border border-border-subtle">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                Lead Profile
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                                    <User size={18} className="text-violet-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-black text-sm text-text-main">
                                            {singleLead.name}
                                        </span>
                                        <span
                                            className={cn(
                                                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                                stageColor(singleLead.currentStage)
                                            )}
                                        >
                                            {singleLead.currentStage || "New"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 mt-1">
                                        <Phone size={11} className="text-slate-400" />
                                        <span className="text-xs text-slate-500 font-medium">
                                            {phone || "No phone"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mt-4">
                                <div className="bg-white rounded-lg px-3 py-2 border border-border-subtle">
                                    <div className="flex items-center gap-1 mb-0.5">
                                        <Wallet size={10} className="text-slate-400" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                                            Budget
                                        </span>
                                    </div>
                                    <div className="text-xs font-bold text-text-main truncate">
                                        {budget}
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg px-3 py-2 border border-border-subtle">
                                    <div className="flex items-center gap-1 mb-0.5">
                                        <Home size={10} className="text-slate-400" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                                            Config
                                        </span>
                                    </div>
                                    <div className="text-xs font-bold text-text-main truncate">
                                        {config}
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg px-3 py-2 border border-border-subtle">
                                    <div className="flex items-center gap-1 mb-0.5">
                                        <MapPin size={10} className="text-slate-400" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                                            Area
                                        </span>
                                    </div>
                                    <div className="text-xs font-bold text-text-main truncate">
                                        {area}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Queue Lead List ── */}
                    {isQueueMode && callState !== "queue_running" && callState !== "queue_done" && (
                        <div className="bg-slate-50 rounded-xl p-4 border border-border-subtle">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Users size={12} />
                                {allLeads.length} Leads in Queue
                            </div>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {allLeads.map((l, i) => (
                                    <div
                                        key={l.id}
                                        className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-border-subtle"
                                    >
                                        <span className="text-[10px] font-bold text-slate-400 w-5 text-center">
                                            {i + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-xs font-bold text-text-main truncate block">
                                                {l.name}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-medium">
                                                {l.primaryPhone || l.phone || "No phone"}
                                            </span>
                                        </div>
                                        <span
                                            className={cn(
                                                "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                                                stageColor(l.currentStage)
                                            )}
                                        >
                                            {l.currentStage || "New"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Queue Progress ── */}
                    {callState === "queue_running" && (
                        <div className="bg-violet-50 rounded-xl p-4 border border-violet-200">
                            <div className="flex items-center gap-3 mb-3">
                                <Loader2 size={18} className="animate-spin text-violet-600" />
                                <div>
                                    <div className="text-xs font-black text-violet-700">
                                        Processing Call Queue…
                                    </div>
                                    <div className="text-[10px] text-violet-500 mt-0.5">
                                        Calling leads sequentially, one after another
                                    </div>
                                </div>
                            </div>
                            <div className="w-full bg-violet-200 rounded-full h-2 mt-2">
                                <div
                                    className="bg-gradient-to-r from-violet-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${queueTotal > 0 ? (queueCurrent / queueTotal) * 100 : 0}%` }}
                                />
                            </div>
                            <div className="text-[10px] text-violet-500 font-medium mt-1 text-right">
                                {queueCurrent} / {queueTotal}
                            </div>
                        </div>
                    )}

                    {/* ── Queue Results ── */}
                    {callState === "queue_done" && (
                        <div className="space-y-3">
                            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                                <div className="flex items-center gap-3">
                                    <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
                                    <div>
                                        <div className="text-xs font-black text-emerald-700">
                                            Queue Complete!
                                        </div>
                                        <div className="text-[10px] text-emerald-600 mt-0.5">
                                            {successResults.length} successful · {failedResults.length} failed
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                {queueResults.map((r) => (
                                    <div
                                        key={r.leadId}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2 text-xs border",
                                            r.success
                                                ? "bg-emerald-50/50 border-emerald-100"
                                                : "bg-rose-50/50 border-rose-100"
                                        )}
                                    >
                                        <span className="text-[10px] font-bold text-slate-400 w-5 text-center">
                                            {r.position}
                                        </span>
                                        {r.success ? (
                                            <CheckCircle size={12} className="text-emerald-500 flex-shrink-0" />
                                        ) : (
                                            <AlertCircle size={12} className="text-rose-500 flex-shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <span className="font-bold text-text-main truncate block">
                                                {r.leadName}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                {r.phone}
                                            </span>
                                        </div>
                                        <span
                                            className={cn(
                                                "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                                                r.success
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : "bg-rose-100 text-rose-700"
                                            )}
                                        >
                                            {r.success ? "Called" : r.error || "Failed"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Property Selector ── */}
                    {callState !== "queue_running" && callState !== "queue_done" && (
                        <div>
                            <label className="block text-xs font-black text-text-main mb-2 flex items-center gap-1.5">
                                <Building2 size={13} className="text-violet-500" />
                                Select Property to Pitch
                            </label>

                            {propertiesLoading ? (
                                <div className="flex items-center gap-2 h-11 px-4 bg-slate-50 rounded-xl border border-border-subtle">
                                    <Loader2 size={14} className="animate-spin text-slate-400" />
                                    <span className="text-xs text-slate-400">Loading properties…</span>
                                </div>
                            ) : (
                                <div className="relative">
                                    <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all",
                                            selectedPropertyId
                                                ? "bg-violet-50 border-violet-200 text-text-main"
                                                : "bg-slate-50 border-border-subtle text-slate-400",
                                            isDropdownOpen && "ring-2 ring-violet-300"
                                        )}
                                    >
                                        <span className="truncate">
                                            {selectedProperty
                                                ? `${selectedProperty.name} · ${selectedProperty.location.locality}`
                                                : "Choose a property…"}
                                        </span>
                                        <ChevronDown
                                            size={16}
                                            className={cn(
                                                "transition-transform flex-shrink-0 ml-2",
                                                isDropdownOpen && "rotate-180"
                                            )}
                                        />
                                    </button>

                                    {isDropdownOpen && (
                                        <div className="absolute z-20 top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-border-subtle shadow-xl overflow-hidden max-h-52 overflow-y-auto">
                                            {properties.length === 0 ? (
                                                <div className="px-4 py-3 text-xs text-slate-400 text-center">
                                                    No active properties found
                                                </div>
                                            ) : (
                                                properties.map((p) => (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => {
                                                            setSelectedPropertyId(p.id);
                                                            setIsDropdownOpen(false);
                                                        }}
                                                        className={cn(
                                                            "w-full text-left px-4 py-3 hover:bg-violet-50 transition-colors border-b border-border-subtle last:border-0",
                                                            selectedPropertyId === p.id && "bg-violet-50"
                                                        )}
                                                    >
                                                        <div className="font-bold text-xs text-text-main">
                                                            {p.name}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                                                            {p.location.locality}, {p.location.city}
                                                            {p.startingPrice
                                                                ? ` · from ₹${(p.startingPrice / 100000).toFixed(0)}L`
                                                                : ""}
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                    {isDropdownOpen && (
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setIsDropdownOpen(false)}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Context Preview (single lead) ── */}
                    {selectedProperty && !isQueueMode && callState !== "queue_running" && callState !== "queue_done" && singleLead && (
                        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl p-4 border border-indigo-100">
                            <div className="flex items-center gap-2 mb-3">
                                <Eye size={12} className="text-indigo-500" />
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                                    Aarini will know
                                </span>
                            </div>
                            <div className="space-y-1.5 text-[11px]">
                                {[
                                    [`Lead name`, singleLead.name],
                                    [`Phone`, phone],
                                    [`Budget`, budget],
                                    [`Area interest`, area],
                                    [`Config interest`, config],
                                    [`Property to pitch`, selectedProperty.name],
                                    [`Location`, `${selectedProperty.location.locality}, ${selectedProperty.location.city}`],
                                    [`Developer`, selectedProperty.developerName],
                                ].map(([label, value]) => (
                                    <div key={label} className="flex gap-2">
                                        <span className="text-indigo-400 font-semibold w-28 flex-shrink-0">
                                            {label}
                                        </span>
                                        <span className="text-indigo-800 font-bold truncate">
                                            {value || "—"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Status States (single call) ── */}
                    {callState === "success" && (
                        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                            <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
                            <div>
                                <div className="text-xs font-black text-emerald-700">
                                    Call Initiated Successfully!
                                </div>
                                <div className="text-[10px] text-emerald-600 mt-0.5">
                                    Aarini is connecting to {singleLead?.name} · Call ID: {callId}
                                </div>
                            </div>
                        </div>
                    )}

                    {callState === "error" && (
                        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                            <AlertCircle size={18} className="text-rose-500 flex-shrink-0" />
                            <div>
                                <div className="text-xs font-black text-rose-700">
                                    {isQueueMode ? "Queue Failed" : "Call Failed"}
                                </div>
                                <div className="text-[10px] text-rose-600 mt-0.5">
                                    {errorMsg}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Actions ── */}
                    <div className="flex items-center gap-3 pt-1">
                        <button
                            onClick={onClose}
                            className="flex-1 btn-ghost text-sm py-2.5"
                        >
                            {callState === "success" || callState === "queue_done"
                                ? "Close"
                                : "Cancel"}
                        </button>

                        {callState !== "success" &&
                            callState !== "queue_done" &&
                            callState !== "queue_running" && (
                                <button
                                    onClick={isQueueMode ? handleLaunchQueue : handleLaunchCall}
                                    disabled={
                                        !selectedPropertyId ||
                                        (!isQueueMode && !phone) ||
                                        callState === "calling"
                                    }
                                    className={cn(
                                        "flex-[2] flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black transition-all",
                                        selectedPropertyId &&
                                            (isQueueMode || phone) &&
                                            callState !== "calling"
                                            ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-violet-200 hover:-translate-y-0.5 active:translate-y-0"
                                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    )}
                                >
                                    {callState === "calling" ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Connecting…
                                        </>
                                    ) : callState === "error" ? (
                                        <>
                                            <Phone size={16} />
                                            Retry {isQueueMode ? "Queue" : "Call"}
                                        </>
                                    ) : isQueueMode ? (
                                        <>
                                            <ListOrdered size={16} />
                                            Start Queue ({allLeads.length} leads)
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={16} />
                                            Launch Aarini Call
                                        </>
                                    )}
                                </button>
                            )}
                    </div>

                    {!isQueueMode && !phone && (
                        <p className="text-[10px] text-rose-500 text-center font-medium -mt-2">
                            ⚠ No phone number on this lead — cannot initiate call
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
