"use client";

import { useState, useEffect } from "react";
import { Loader2, Sparkles, Building2, X, CheckSquare, Square, Users, Calendar, FileText, Activity } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

interface CreateCampaignModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (config: CampaignConfig) => Promise<void>;
    selectedLeadCount: number;
}

export interface CampaignConfig {
    name: string;
    description: string;
    propertyIds: string[];
    agentId: string;
    workflowId: string;
    startDate: string;
}

interface Property {
    id: string;
    name: string;
    location?: {
        locality?: string;
        city?: string;
    };
}

export function CreateCampaignModal({ isOpen, onClose, onStart, selectedLeadCount }: CreateCampaignModalProps) {
    const { showToast } = useToast();
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [properties, setProperties] = useState<Property[]>([]);
    const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
    const [agentId, setAgentId] = useState('agent_aisha');
    const [workflowId, setWorkflowId] = useState('workflow_default');
    const [startDate, setStartDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingProperties, setFetchingProperties] = useState(false);

    // Reset step on open
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            fetchProperties();
        }
    }, [isOpen]);

    const fetchProperties = async () => {
        setFetchingProperties(true);
        try {
            const response = await fetch('/api/properties');
            const data = await response.json();
            setProperties(data.data || []);
        } catch (error) {
            console.error('Failed to fetch properties:', error);
        } finally {
            setFetchingProperties(false);
        }
    };

    const toggleProperty = (propertyId: string) => {
        setSelectedProperties(prev => {
            const newSet = new Set(prev);
            if (newSet.has(propertyId)) {
                newSet.delete(propertyId);
            } else {
                newSet.add(propertyId);
            }
            return newSet;
        });
    };

    const toggleSelectAll = () => {
        if (selectedProperties.size === properties.length) {
            setSelectedProperties(new Set());
        } else {
            setSelectedProperties(new Set(properties.map(p => p.id)));
        }
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            showToast('Please enter a campaign name', "warning");
            return;
        }

        setLoading(true);
        try {
            await onStart({
                name: name.trim(),
                description: description.trim(),
                propertyIds: Array.from(selectedProperties),
                agentId,
                workflowId,
                startDate: startDate || new Date().toISOString()
            });
            // Reset form
            setName('');
            setDescription('');
            setSelectedProperties(new Set());
            setAgentId('agent_aisha');
            setWorkflowId('workflow_default');
            setStartDate('');
            setStep(1);
            onClose();
        } catch (error) {
            console.error('Failed to create campaign:', error);
            showToast('Failed to create campaign', "error");
        } finally {
            setLoading(false);
        }
    };

    const handleStart = handleSubmit; // Used by the "Launch Campaign" button

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl animate-in zoom-in-95 duration-200 overflow-hidden max-h-[95vh] flex flex-col">
                {/* Header */}
                <div className="bg-slate-50 p-6 border-b border-slate-100 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-slate-900">Create New Campaign</h2>
                    </div>

                    <div className="flex items-center gap-8 text-sm">
                        {/* Step 1 Indicator */}
                        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors ${step > 1 ? 'bg-blue-600 text-white' : step === 1 ? 'bg-blue-600 text-white' : 'border-2 border-slate-200'}`}>
                                {step > 1 ? '✓' : '1'}
                            </div>
                            <div>
                                <div className="font-bold">Campaign Configuration</div>
                                <div className="text-slate-500 text-xs text-nowrap">Details, workflow and agent</div>
                            </div>
                        </div>
                        <div className={`h-px flex-1 transition-colors ${step > 1 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                        {/* Step 2 Indicator */}
                        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs transition-colors ${step === 2 ? 'border-blue-600 text-blue-600' : 'border-slate-200'}`}>2</div>
                            <div>
                                <div className="font-bold">Review</div>
                                <div className="text-xs text-nowrap">Review and create campaign</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-8 space-y-8 overflow-y-auto flex-1 bg-white">
                    {step === 1 ? (
                        <>
                            <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                                <div className="flex items-center gap-2 mb-6 text-blue-600">
                                    <FileText size={20} />
                                    <h3 className="font-bold">Campaign Details</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Campaign Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Description</label>
                                        <input
                                            type="text"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                {/* Selector Section Left */}
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                            <Users size={18} className="text-slate-500" />
                                            Select Agent
                                        </label>
                                        <div className="p-4 border-2 border-blue-500 bg-blue-50 rounded-xl flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">A</div>
                                            <div>
                                                <div className="font-bold text-slate-900">Aisha</div>
                                                <div className="text-xs text-slate-500">Only Agent Available</div>
                                            </div>
                                            <div className="ml-auto w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">✓</div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                            <Activity size={18} className="text-slate-500" />
                                            Select Workflow
                                        </label>
                                        <div className="space-y-3">
                                            {[
                                                { id: 'call-1-retry', label: 'Call with 1 Retry', desc: 'Standard follow-up' },
                                                { id: 'call-2-retries', label: 'Call with 2 Retries', desc: 'Aggressive follow-up' }
                                            ].map(wf => (
                                                <button
                                                    key={wf.id}
                                                    onClick={() => setWorkflowId(wf.id)}
                                                    className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${workflowId === wf.id ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}
                                                >
                                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${workflowId === wf.id ? 'border-blue-500' : 'border-slate-300'}`}>
                                                        {workflowId === wf.id && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 text-sm">{wf.label}</div>
                                                        <div className="text-xs text-slate-500">{wf.desc}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                            <Calendar size={18} className="text-slate-500" />
                                            Start Date
                                        </label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium"
                                        />
                                    </div>
                                </div>

                                {/* Selector Section Right - Properties */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                            <Building2 size={18} className="text-slate-500" />
                                            Targeted Properties
                                        </label>
                                        {properties.length > 0 && (
                                            <button
                                                onClick={toggleSelectAll}
                                                className="text-xs text-blue-600 font-bold hover:underline"
                                            >
                                                {selectedProperties.size === properties.length ? 'Deselect All' : 'Select All'}
                                            </button>
                                        )}
                                    </div>

                                    {fetchingProperties ? (
                                        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400">
                                            <Loader2 className="animate-spin mb-2" />
                                            <span className="text-sm">Fetching inventory...</span>
                                        </div>
                                    ) : properties.length === 0 ? (
                                        <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-nowrap">
                                            No properties found.
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-h-[440px] overflow-y-auto pr-2 custom-scrollbar">
                                            {properties.map(property => {
                                                const isSelected = selectedProperties.has(property.id);
                                                return (
                                                    <button
                                                        key={property.id}
                                                        onClick={() => toggleProperty(property.id)}
                                                        className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-start gap-4 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}
                                                    >
                                                        <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>
                                                            {isSelected && <span className="text-[10px] font-bold">✓</span>}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-bold text-slate-900 text-sm truncate">{property.name}</div>
                                                            {property.location && (
                                                                <div className="text-[10px] text-slate-500 mt-0.5 truncate uppercase tracking-wider font-semibold">
                                                                    {property.location.locality}, {property.location.city}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        // Step 2: Review
                        <div className="space-y-8 animate-in slide-in-from-right duration-300">
                            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex gap-4">
                                <div className="p-3 bg-indigo-100 rounded-xl h-fit">
                                    <Sparkles className="text-indigo-600" size={24} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-indigo-900">Ready to Launch?</h3>
                                    <p className="text-sm text-indigo-700 leading-relaxed">
                                        Review your campaign configuration below. The orchestrator will begin processing leads immediately upon launch.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <ReviewCard label="Campaign Name" value={name} icon={<FileText size={16} />} />
                                <ReviewCard label="Selected Agent" value="Aisha (Voice AI)" icon={<Users size={16} />} />
                                <ReviewCard label="Workflow Strategy" value={workflowId === 'call-1-retry' ? 'Standard (1 Retry)' : 'Aggressive (2 Retries)'} icon={<Activity size={16} />} />
                                <ReviewCard label="Start Date" value={startDate} icon={<Calendar size={16} />} />
                            </div>

                            <div className="border-t border-slate-100 pt-6">
                                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Building2 size={18} className="text-slate-500" />
                                    Targeted Properties ({selectedProperties.size})
                                </h4>
                                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                                    {properties.filter(p => selectedProperties.has(p.id)).map(p => (
                                        <div key={p.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm font-medium text-slate-700 truncate">
                                            {p.name}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-sm font-medium">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                System Health: Optimal. Queue ready for {selectedLeadCount} leads (estimated).
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
                    <button
                        onClick={step === 1 ? onClose : () => setStep(1)}
                        className="flex-1 px-4 py-4 text-slate-600 font-bold hover:bg-slate-200 rounded-2xl transition-all"
                    >
                        {step === 1 ? 'Cancel' : 'Back to Edit'}
                    </button>
                    <button
                        onClick={step === 1 ? () => setStep(2) : handleStart}
                        disabled={loading || !name || selectedProperties.size === 0}
                        className="flex-[1.5] px-4 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Launching...
                            </>
                        ) : step === 1 ? (
                            <>
                                Review Configuration
                                <Square size={10} className="fill-current opacity-50" />
                            </>
                        ) : (
                            <>
                                <CheckSquare size={20} />
                                Launch Campaign
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ReviewCard({ label, value, icon }: any) {
    return (
        <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 text-slate-400 mb-1 text-xs font-bold uppercase tracking-wider">
                {icon} {label}
            </div>
            <div className="font-bold text-slate-900 text-lg truncate" title={value}>
                {value}
            </div>
        </div>
    );
}


