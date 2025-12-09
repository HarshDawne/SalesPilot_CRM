"use client";

import { useState, useEffect } from "react";
import { Lead, LeadStage } from "@/lib/db";
import LeadCard from "./LeadCard";
import { useRouter } from "next/navigation";
import { Bot, Loader2, Phone, ChevronLeft, ChevronRight } from "lucide-react";

const STAGES: { key: LeadStage; label: string; icon: string; color: string }[] = [
    { key: "New", label: "New", icon: "✨", color: "bg-slate-50 border-slate-200" },
    { key: "AI_Calling", label: "AI Calling", icon: "🤖", color: "bg-blue-50 border-blue-200" },
    { key: "Qualified", label: "Qualified", icon: "✅", color: "bg-green-50 border-green-200" },
    { key: "Visit_Booked", label: "Visit Booked", icon: "📅", color: "bg-purple-50 border-purple-200" },
    { key: "Visit_Completed", label: "Visit Completed", icon: "🏠", color: "bg-indigo-50 border-indigo-200" },
    { key: "Negotiation", label: "Negotiation", icon: "💼", color: "bg-orange-50 border-orange-200" },
    { key: "Booking_Done", label: "Booking Done", icon: "🎉", color: "bg-emerald-50 border-emerald-200" },
    { key: "Disqualified", label: "Disqualified", icon: "❌", color: "bg-red-50 border-red-200" }
];

const LEADS_PER_PAGE = 10;

export default function AIKanbanBoard() {
    const router = useRouter();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
    const [selectedNewLeads, setSelectedNewLeads] = useState<Set<string>>(new Set());
    const [startingCampaign, setStartingCampaign] = useState(false);
    const [currentPages, setCurrentPages] = useState<Record<LeadStage, number>>({
        New: 0,
        AI_Calling: 0,
        Qualified: 0,
        Visit_Booked: 0,
        Visit_Completed: 0,
        Negotiation: 0,
        Booking_Done: 0,
        Disqualified: 0
    });

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

    const getLeadsByStage = (stage: LeadStage) => {
        return leads.filter(lead => lead.currentStage === stage);
    };

    const getPaginatedLeads = (stage: LeadStage) => {
        const stageLeads = getLeadsByStage(stage);
        const page = currentPages[stage];
        const start = page * LEADS_PER_PAGE;
        const end = start + LEADS_PER_PAGE;
        return {
            leads: stageLeads.slice(start, end),
            total: stageLeads.length,
            hasMore: end < stageLeads.length,
            hasPrev: page > 0
        };
    };

    const handlePageChange = (stage: LeadStage, direction: 'next' | 'prev') => {
        setCurrentPages(prev => ({
            ...prev,
            [stage]: direction === 'next' ? prev[stage] + 1 : prev[stage] - 1
        }));
    };

    const handleDragStart = (lead: Lead) => {
        setDraggedLead(lead);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (targetStage: LeadStage) => {
        if (!draggedLead || draggedLead.currentStage === targetStage) {
            setDraggedLead(null);
            return;
        }

        try {
            await fetch('/api/leads', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leadId: draggedLead.id,
                    updates: { currentStage: targetStage },
                    actor: 'manual'
                })
            });

            await fetchLeads();
        } catch (error) {
            console.error('Failed to update lead stage:', error);
        } finally {
            setDraggedLead(null);
        }
    };

    const handleViewDetails = (leadId: string) => {
        router.push(`/leads/${leadId}`);
    };

    const handleBookVisit = (leadId: string) => {
        console.log('Book visit for lead:', leadId);
    };

    const toggleLeadSelection = (leadId: string) => {
        setSelectedNewLeads(prev => {
            const newSet = new Set(prev);
            if (newSet.has(leadId)) {
                newSet.delete(leadId);
            } else {
                newSet.add(leadId);
            }
            return newSet;
        });
    };

    const selectAllNewLeads = () => {
        const newLeads = getLeadsByStage('New');
        setSelectedNewLeads(new Set(newLeads.map(l => l.id)));
    };

    const deselectAllNewLeads = () => {
        setSelectedNewLeads(new Set());
    };

    const startAICampaign = async () => {
        if (selectedNewLeads.size === 0) {
            alert('Please select at least one lead to start the campaign');
            return;
        }

        setStartingCampaign(true);
        try {
            const response = await fetch('/api/leads/batch-call', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leadIds: Array.from(selectedNewLeads)
                })
            });

            const result = await response.json();
            alert(`AI Campaign started for ${result.queued} leads!`);
            setSelectedNewLeads(new Set());
            await fetchLeads();
        } catch (error) {
            console.error('Failed to start campaign:', error);
            alert('Failed to start AI campaign');
        } finally {
            setStartingCampaign(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="animate-spin text-slate-400" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* AI Campaign Controls */}
            {selectedNewLeads.size > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Phone className="text-blue-600" size={20} />
                        <span className="font-medium text-blue-900">
                            {selectedNewLeads.size} lead{selectedNewLeads.size !== 1 ? 's' : ''} selected
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={deselectAllNewLeads}
                            className="px-4 py-2 text-sm bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                            Deselect All
                        </button>
                        <button
                            onClick={startAICampaign}
                            disabled={startingCampaign}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {startingCampaign ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Starting...
                                </>
                            ) : (
                                <>
                                    <Bot size={16} />
                                    Start AI Campaign
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Kanban Board */}
            <div className="flex gap-4 overflow-x-auto pb-4">
                {STAGES.map(stage => {
                    const { leads: paginatedLeads, total, hasMore, hasPrev } = getPaginatedLeads(stage.key);
                    const isNewStage = stage.key === 'New';

                    return (
                        <div
                            key={stage.key}
                            className="flex-shrink-0 w-80"
                            onDragOver={handleDragOver}
                            onDrop={() => handleDrop(stage.key)}
                        >
                            {/* Column Header */}
                            <div className={`${stage.color} border rounded-xl p-4 mb-3`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{stage.icon}</span>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm">
                                                {stage.label}
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                {total} lead{total !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                    {stage.key === 'AI_Calling' && (
                                        <Bot size={16} className="text-blue-600 animate-pulse" />
                                    )}
                                </div>

                                {/* Select All for New Leads */}
                                {isNewStage && total > 0 && (
                                    <button
                                        onClick={selectAllNewLeads}
                                        className="w-full mt-2 text-xs bg-white/50 hover:bg-white/80 text-slate-700 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        Select All ({total})
                                    </button>
                                )}

                                {/* Pagination Controls */}
                                {total > LEADS_PER_PAGE && (
                                    <div className="flex items-center justify-between mt-2 text-xs text-slate-600">
                                        <button
                                            onClick={() => handlePageChange(stage.key, 'prev')}
                                            disabled={!hasPrev}
                                            className="p-1 hover:bg-white/50 rounded disabled:opacity-30"
                                        >
                                            <ChevronLeft size={14} />
                                        </button>
                                        <span>
                                            {currentPages[stage.key] * LEADS_PER_PAGE + 1}-
                                            {Math.min((currentPages[stage.key] + 1) * LEADS_PER_PAGE, total)} of {total}
                                        </span>
                                        <button
                                            onClick={() => handlePageChange(stage.key, 'next')}
                                            disabled={!hasMore}
                                            className="p-1 hover:bg-white/50 rounded disabled:opacity-30"
                                        >
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Lead Cards */}
                            <div className="space-y-3 min-h-[400px]">
                                {paginatedLeads.length === 0 ? (
                                    <div className="text-center text-slate-400 text-sm py-8">
                                        No leads in this stage
                                    </div>
                                ) : (
                                    paginatedLeads.map(lead => (
                                        <div key={lead.id} className="relative">
                                            {isNewStage && (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedNewLeads.has(lead.id)}
                                                    onChange={() => toggleLeadSelection(lead.id)}
                                                    className="absolute top-2 left-2 z-10 w-4 h-4 cursor-pointer"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            )}
                                            <div
                                                draggable
                                                onDragStart={() => handleDragStart(lead)}
                                                className="cursor-move"
                                            >
                                                <LeadCard
                                                    lead={lead}
                                                    onViewDetails={handleViewDetails}
                                                    onBookVisit={handleBookVisit}
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
