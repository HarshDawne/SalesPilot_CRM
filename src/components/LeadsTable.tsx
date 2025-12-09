"use client";

import { useState, useEffect } from "react";
import { Lead, LeadStage } from "@/lib/db";
import { useRouter } from "next/navigation";
import { Bot, Loader2, Phone, Calendar, TrendingUp, Filter, ChevronDown, ChevronUp, Eye, CheckSquare, Square } from "lucide-react";

const STAGES: { key: LeadStage; label: string; color: string }[] = [
    { key: "New", label: "New", color: "bg-slate-100 text-slate-700" },
    { key: "AI_Calling", label: "AI Calling", color: "bg-blue-100 text-blue-700" },
    { key: "Qualified", label: "Qualified", color: "bg-green-100 text-green-700" },
    { key: "Visit_Booked", label: "Visit Booked", color: "bg-purple-100 text-purple-700" },
    { key: "Visit_Completed", label: "Visit Completed", color: "bg-indigo-100 text-indigo-700" },
    { key: "Negotiation", label: "Negotiation", color: "bg-orange-100 text-orange-700" },
    { key: "Booking_Done", label: "Booking Done", color: "bg-emerald-100 text-emerald-700" },
    { key: "Disqualified", label: "Disqualified", color: "bg-red-100 text-red-700" }
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

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            const response = await fetch('/api/leads');
            const data = await response.json();
            setLeads(data);
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

    const getSortedAndFilteredLeads = () => {
        let filtered = leads;

        // Apply stage filter
        if (stageFilter !== 'all') {
            filtered = filtered.filter(lead => lead.currentStage === stageFilter);
        }

        // Apply sorting
        const sorted = [...filtered].sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (sortField) {
                case 'name':
                    aValue = a.name || `${a.firstName} ${a.lastName}`;
                    bValue = b.name || `${b.firstName} ${b.lastName}`;
                    break;
                case 'createdAt':
                    aValue = new Date(a.createdAt).getTime();
                    bValue = new Date(b.createdAt).getTime();
                    break;
                case 'aiScore':
                    aValue = a.aiScore || 0;
                    bValue = b.aiScore || 0;
                    break;
                case 'currentStage':
                    aValue = a.currentStage;
                    bValue = b.currentStage;
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    };

    const toggleLeadSelection = (leadId: string) => {
        setSelectedLeads(prev => {
            const newSet = new Set(prev);
            if (newSet.has(leadId)) {
                newSet.delete(leadId);
            } else {
                newSet.add(leadId);
            }
            return newSet;
        });
    };

    const selectAllVisible = () => {
        const visibleLeads = getSortedAndFilteredLeads();
        setSelectedLeads(new Set(visibleLeads.map(l => l.id)));
    };

    const deselectAll = () => {
        setSelectedLeads(new Set());
    };

    const startAICampaign = async () => {
        if (selectedLeads.size === 0) {
            alert('Please select at least one lead to start the campaign');
            return;
        }

        // Store selected leads in sessionStorage for campaign builder
        sessionStorage.setItem('selectedLeads', JSON.stringify(Array.from(selectedLeads)));

        // Redirect to Communication Engine campaign builder
        router.push('/communication/create');
    };

    const handleViewDetails = (leadId: string) => {
        router.push(`/leads/${leadId}`);
    };

    const getStageColor = (stage: LeadStage) => {
        return STAGES.find(s => s.key === stage)?.color || 'bg-slate-100 text-slate-700';
    };

    const getPriorityColor = (score: number) => {
        if (score >= 80) return 'bg-green-500';
        if (score >= 50) return 'bg-yellow-500';
        return 'bg-slate-400';
    };

    const filteredLeads = getSortedAndFilteredLeads();
    const stageCounts = STAGES.map(stage => ({
        ...stage,
        count: leads.filter(l => l.currentStage === stage.key).length
    }));

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="animate-spin text-slate-400" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters Bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Filter size={20} className="text-slate-600" />
                        <h3 className="font-semibold text-slate-900">Filters</h3>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="text-sm text-blue-600 hover:text-blue-700"
                        >
                            {showFilters ? 'Hide' : 'Show'}
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">
                            {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                {showFilters && (
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setStageFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${stageFilter === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                        >
                            All ({leads.length})
                        </button>
                        {stageCounts.map(stage => (
                            <button
                                key={stage.key}
                                onClick={() => setStageFilter(stage.key)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${stageFilter === stage.key
                                    ? 'bg-blue-600 text-white'
                                    : `${stage.color} hover:opacity-80`
                                    }`}
                            >
                                {stage.label} ({stage.count})
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Selection Actions */}
            {selectedLeads.size > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CheckSquare className="text-blue-600" size={20} />
                        <span className="font-medium text-slate-900">
                            {selectedLeads.size} lead{selectedLeads.size !== 1 ? 's' : ''} selected
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={deselectAll}
                            className="px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            Deselect All
                        </button>
                        <button
                            onClick={startAICampaign}
                            className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center gap-2"
                        >
                            <Phone size={16} />
                            Start AI Campaign
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left">
                                    <button
                                        onClick={selectedLeads.size === filteredLeads.length ? deselectAll : selectAllVisible}
                                        className="hover:bg-slate-200 p-1 rounded"
                                    >
                                        {selectedLeads.size === filteredLeads.length && filteredLeads.length > 0 ? (
                                            <CheckSquare size={18} className="text-blue-600" />
                                        ) : (
                                            <Square size={18} className="text-slate-400" />
                                        )}
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <button
                                        onClick={() => handleSort('name')}
                                        className="flex items-center gap-2 font-semibold text-slate-700 hover:text-slate-900"
                                    >
                                        Name
                                        {sortField === 'name' && (
                                            sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                                        )}
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <button
                                        onClick={() => handleSort('currentStage')}
                                        className="flex items-center gap-2 font-semibold text-slate-700 hover:text-slate-900"
                                    >
                                        Stage
                                        {sortField === 'currentStage' && (
                                            sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                                        )}
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <button
                                        onClick={() => handleSort('aiScore')}
                                        className="flex items-center gap-2 font-semibold text-slate-700 hover:text-slate-900"
                                    >
                                        AI Score
                                        {sortField === 'aiScore' && (
                                            sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                                        )}
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700">Contact</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700">Details</th>
                                <th className="px-4 py-3 text-left">
                                    <button
                                        onClick={() => handleSort('createdAt')}
                                        className="flex items-center gap-2 font-semibold text-slate-700 hover:text-slate-900"
                                    >
                                        Created
                                        {sortField === 'createdAt' && (
                                            sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                                        )}
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLeads.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                                        No leads found
                                    </td>
                                </tr>
                            ) : (
                                filteredLeads.map(lead => (
                                    <tr
                                        key={lead.id}
                                        className="hover:bg-slate-50 transition-colors"
                                    >
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedLeads.has(lead.id)}
                                                onChange={() => toggleLeadSelection(lead.id)}
                                                className="w-4 h-4 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${getPriorityColor(lead.aiScore || 0)}`} />
                                                <span className="font-medium text-slate-900">
                                                    {lead.name || `${lead.firstName} ${lead.lastName}`}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {lead.currentStage ? (
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(lead.currentStage)}`}>
                                                    {lead.currentStage.replace(/_/g, ' ')}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-sm">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {lead.aiScore !== undefined && lead.aiScore > 0 ? (
                                                <div className="flex items-center gap-1">
                                                    <Bot size={14} className="text-blue-600" />
                                                    <span className="font-medium text-slate-900">{lead.aiScore}</span>
                                                    <span className="text-slate-500 text-sm">/100</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 text-sm">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm">
                                                <div className="text-slate-900">{lead.primaryPhone}</div>
                                                <div className="text-slate-500 text-xs">{lead.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-slate-600">
                                                {lead.qualification?.propertyType && (
                                                    <div>{lead.qualification.propertyType}</div>
                                                )}
                                                {lead.qualification?.budgetMin && (
                                                    <div className="text-xs text-slate-500">
                                                        ₹{(lead.qualification.budgetMin / 100000).toFixed(0)}L -
                                                        ₹{((lead.qualification.budgetMax || 0) / 100000).toFixed(0)}L
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {new Date(lead.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => handleViewDetails(lead.id)}
                                                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                                            >
                                                <Eye size={14} />
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Floating AI Campaign Button */}
            {selectedLeads.size > 0 && (
                <div className="fixed bottom-8 right-8 z-50">
                    <button
                        onClick={startAICampaign}
                        className="group relative px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300 flex items-center gap-3"
                    >
                        <div className="relative">
                            <Phone size={24} className="animate-pulse" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping" />
                        </div>
                        <div>
                            <div className="font-bold text-lg">Start AI Campaign</div>
                            <div className="text-xs text-blue-100">{selectedLeads.size} leads selected</div>
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
}
