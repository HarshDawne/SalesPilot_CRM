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
    Search
} from "lucide-react";
import { Property, Tower, Unit } from "@/types/property";

// Steps for the Wizard
const STEPS = [
    { id: 1, title: "Select Inventory", icon: Building2, desc: "Choose Units/Towers to sell" },
    { id: 2, title: "Target Audience", icon: Users, desc: "Find matching leads" },
    { id: 3, title: "Campaign Config", icon: Megaphone, desc: "Configure message & channel" },
    { id: 4, title: "Review & Launch", icon: CheckCircle2, desc: "Verify and go live" }
];

export default function CampaignWizardPage() {
    const [currentStep, setCurrentStep] = useState(1);

    // Step 1 State: Inventory Selection
    const [properties, setProperties] = useState<Property[]>([]);
    const [towers, setTowers] = useState<Tower[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);

    const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
    const [selectedTowerIds, setSelectedTowerIds] = useState<string[]>([]);
    const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);

    const [viewMode, setViewMode] = useState<"tower" | "unit">("tower");

    // Step 2 State: Audience Matching
    const [matchingLeads, setMatchingLeads] = useState<any[]>([]);
    const [isLoadingMatches, setIsLoadingMatches] = useState(false);

    // Step 3 State: Campaign Config
    const [campaignName, setCampaignName] = useState("");
    const [campaignType, setCampaignType] = useState<"whatsapp" | "email" | "voice">("whatsapp");
    const [campaignMessage, setCampaignMessage] = useState("");

    useEffect(() => {
        // Load initial data via API to avoid server-side fs module issues on client
        async function fetchInventory() {
            try {
                const [propsRes, towersRes, unitsRes] = await Promise.all([
                    fetch('/api/projects'), // Maps to properties
                    fetch('/api/towers'),
                    fetch('/api/units')
                ]);

                if (propsRes.ok) setProperties(await propsRes.json());
                if (towersRes.ok) setTowers(await towersRes.json());
                if (unitsRes.ok) setUnits(await unitsRes.json());
            } catch (e) {
                console.error("Failed to load inventory", e);
            }
        }
        fetchInventory();
    }, []);

    // Fetch matches when entering Step 2
    useEffect(() => {
        if (currentStep === 2) {
            fetchMatches();
        }
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

    // Derived state for filtered inventory
    const filteredTowers = towers.filter(t => !selectedPropertyId || t.propertyId === selectedPropertyId);
    const filteredUnits = units.filter(u =>
        (!selectedPropertyId || u.propertyId === selectedPropertyId) &&
        (selectedTowerIds.length === 0 || selectedTowerIds.includes(u.towerId))
    );

    const handleNext = () => {
        if (currentStep < 4) setCurrentStep(c => c + 1);
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(c => c - 1);
    };

    const handleLaunch = () => {
        alert("Launching Campaign! (Mock)");
        // In real app, POST to /api/campaigns
    };

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 font-heading">New Campaign</h1>
                <p className="text-slate-500 mt-1">Launch a property-first marketing campaign in 4 steps.</p>
            </div>

            {/* Stepper */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex justify-between relative">
                    {STEPS.map((step, idx) => {
                        const isActive = currentStep === step.id;
                        const isCompleted = currentStep > step.id;
                        const Icon = step.icon;

                        return (
                            <div key={step.id} className="flex flex-col items-center relative z-10 w-full">
                                <div className={`
                                    w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors duration-300
                                    ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' :
                                        isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}
                                `}>
                                    {isCompleted ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                                </div>
                                <div className={`text-sm font-semibold ${isActive ? 'text-indigo-900' : 'text-slate-600'}`}>
                                    {step.title}
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5 hidden md:block">{step.desc}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Step Content */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm min-h-[500px] flex flex-col">
                <div className="p-8 flex-1">
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Building2 className="text-indigo-600" /> Select Inventory to Sell
                            </h2>

                            {/* Property Selector */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {properties.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedPropertyId(p.id === selectedPropertyId ? null : p.id)}
                                        className={`p-4 rounded-xl border-2 text-left transition-all
                                            ${selectedPropertyId === p.id
                                                ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200 ring-offset-2'
                                                : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'}
                                        `}
                                    >
                                        <div className="font-bold text-slate-900">{p.name}</div>
                                        <div className="text-xs text-slate-500 mt-1">{p.location?.city || "Unknown Location"}</div>
                                    </button>
                                ))}
                            </div>

                            {/* Selection Grid */}
                            {selectedPropertyId && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setViewMode("tower")}
                                                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${viewMode === 'tower' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                            >Towers</button>
                                            <button
                                                onClick={() => setViewMode("unit")}
                                                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${viewMode === 'unit' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                            >Units ({selectedUnitIds.length} selected)</button>
                                        </div>

                                        <div className="text-sm text-slate-500">
                                            {filteredUnits.length} units available based on selection
                                        </div>
                                    </div>

                                    {viewMode === 'tower' ? (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {filteredTowers.map(t => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => {
                                                        if (selectedTowerIds.includes(t.id)) {
                                                            setSelectedTowerIds(ids => ids.filter(id => id !== t.id));
                                                        } else {
                                                            setSelectedTowerIds(ids => [...ids, t.id]);
                                                        }
                                                    }}
                                                    className={`p-4 rounded-xl border text-left transition-all
                                                        ${selectedTowerIds.includes(t.id)
                                                            ? 'border-indigo-600 bg-indigo-50'
                                                            : 'border-slate-200 hover:border-indigo-200'}
                                                    `}
                                                >
                                                    <div className="font-semibold">{t.name}</div>
                                                    <div className="text-xs text-slate-500">{t.availableUnits} units avail</div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-[400px] overflow-y-auto grid grid-cols-2 md:grid-cols-5 gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
                                            {filteredUnits.map(u => (
                                                <button
                                                    key={u.id}
                                                    onClick={() => {
                                                        if (selectedUnitIds.includes(u.id)) {
                                                            setSelectedUnitIds(ids => ids.filter(id => id !== u.id));
                                                        } else {
                                                            setSelectedUnitIds(ids => [...ids, u.id]);
                                                        }
                                                    }}
                                                    className={`p-2 rounded-lg border text-sm flex flex-col items-center justify-center transition-all h-20
                                                        ${selectedUnitIds.includes(u.id)
                                                            ? 'border-indigo-500 bg-indigo-100 text-indigo-900'
                                                            : u.status === 'AVAILABLE' ? 'bg-white border-slate-200 hover:border-indigo-300' : 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'}
                                                    `}
                                                    disabled={u.status !== 'AVAILABLE'}
                                                >
                                                    <span className="font-bold">{u.unitNumber}</span>
                                                    <span className="text-[10px] uppercase mt-1">{u.type}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Users className="text-indigo-600" /> Target Audience
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Filters */}
                                <div className="space-y-4">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <h3 className="text-sm font-semibold text-slate-700 mb-3">Matching Criteria</h3>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm text-slate-600">
                                                <input type="checkbox" checked className="rounded text-indigo-600" readOnly />
                                                Within Budget Range
                                            </label>
                                            <label className="flex items-center gap-2 text-sm text-slate-600">
                                                <input type="checkbox" checked className="rounded text-indigo-600" readOnly />
                                                Ideally Located
                                            </label>
                                            <label className="flex items-center gap-2 text-sm text-slate-600">
                                                <input type="checkbox" checked className="rounded text-indigo-600" readOnly />
                                                High Intent Score
                                            </label>
                                        </div>
                                        <button onClick={fetchMatches} className="mt-4 w-full py-2 bg-indigo-100 text-indigo-700 font-medium rounded-lg text-sm hover:bg-indigo-200">
                                            Refresh Matches
                                        </button>
                                    </div>
                                </div>

                                {/* Results */}
                                <div className="md:col-span-2">
                                    <div className="bg-slate-50 rounded-t-xl p-3 border border-slate-200 border-b-0 flex justify-between items-center">
                                        <span className="font-semibold text-slate-700">{isLoadingMatches ? 'Searching...' : `${matchingLeads.length} Matches Found`}</span>
                                        <span className="text-xs text-slate-500">Based on Revenue OS AI</span>
                                    </div>
                                    <div className="border border-slate-200 rounded-b-xl max-h-[400px] overflow-y-auto bg-white">
                                        {isLoadingMatches ? (
                                            <div className="p-8 text-center text-slate-400">Loading AI matches...</div>
                                        ) : matchingLeads.length === 0 ? (
                                            <div className="p-8 text-center text-slate-400">No matching leads found. Try relaxing filters.</div>
                                        ) : (
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                                    <tr>
                                                        <th className="p-3">Lead Name</th>
                                                        <th className="p-3">Match Score</th>
                                                        <th className="p-3">AI Reason</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {matchingLeads.map(lead => (
                                                        <tr key={lead.id} className="hover:bg-slate-50">
                                                            <td className="p-3 font-medium text-slate-800">{lead.name}</td>
                                                            <td className="p-3">
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${lead.matches > 90 ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                                                    {lead.matches}%
                                                                </span>
                                                            </td>
                                                            <td className="p-3 text-slate-500">{lead.matchReason}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Megaphone className="text-indigo-600" /> Campaign Configuration
                            </h2>
                            <div className="max-w-xl space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Campaign Name</label>
                                    <input
                                        type="text"
                                        value={campaignName}
                                        onChange={(e) => setCampaignName(e.target.value)}
                                        placeholder="e.g. Summer Villa Sale"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Channel</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {(['whatsapp', 'email', 'voice'] as const).map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setCampaignType(type)}
                                                className={`p-3 border rounded-lg text-sm font-medium capitalize transition-all
                                                    ${campaignType === type ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-300 hover:bg-slate-50'}
                                                `}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Message Template</label>
                                    <textarea
                                        rows={4}
                                        value={campaignMessage}
                                        onChange={(e) => setCampaignMessage(e.target.value)}
                                        placeholder="Hi {name}, we have a unit that matches your preferences..."
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="text-center py-10 space-y-6">
                            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 size={40} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Ready to Launch?</h2>
                                <p className="text-slate-500 max-w-md mx-auto mt-2">
                                    You are about to contact <strong>{matchingLeads.length} leads</strong> regarding <strong>{selectedUnitIds.length > 0 ? selectedUnitIds.length + ' Units' : selectedTowerIds.length + ' Towers'}</strong>.
                                </p>
                            </div>
                            <div className="bg-slate-50 max-w-md mx-auto p-4 rounded-xl border border-slate-200 text-left text-sm space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Campaign:</span>
                                    <span className="font-medium">{campaignName || "Untitled"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Channel:</span>
                                    <span className="font-medium capitalize">{campaignType}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Est. Cost:</span>
                                    <span className="font-medium text-emerald-600">₹{(matchingLeads.length * 1.5).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between rounded-b-2xl">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 1}
                        className="px-6 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Back
                    </button>
                    {currentStep === 4 ? (
                        <button
                            onClick={handleLaunch}
                            className="px-8 py-2.5 rounded-lg font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
                        >
                            <Megaphone size={18} /> Launch Campaign
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            disabled={!selectedPropertyId}
                            className="px-6 py-2.5 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2"
                        >
                            Next Step <ArrowRight size={18} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
