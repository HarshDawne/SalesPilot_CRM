"use client";

import { Lead, LeadStatus } from "@/modules/leads/types";
import { useState, useEffect } from "react";
import { CommunicationConsole } from "./CommunicationConsole";
import { VisitScheduler } from "./VisitScheduler";
import { MoreHorizontal, Phone, Calendar, Clock, AlertCircle, Sparkles } from "lucide-react";

type PipelineStage = {
    id: LeadStatus;
    title: string;
    color: string;
};

const stages: PipelineStage[] = [
    { id: LeadStatus.NEW, title: 'New Leads', color: 'border-blue-500' },
    { id: LeadStatus.CONTACTED, title: 'Contacted', color: 'border-yellow-500' },
    { id: LeadStatus.INTERESTED, title: 'Interested', color: 'border-orange-500' },
    { id: LeadStatus.SITE_VISIT_SCHEDULED, title: 'Visit Scheduled', color: 'border-purple-500' },
    { id: LeadStatus.NEGOTIATION, title: 'Negotiation', color: 'border-pink-500' },
    { id: LeadStatus.BOOKING, title: 'Booking', color: 'border-emerald-500' },
];

export function PipelineBoard() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [activeCall, setActiveCall] = useState<{ name: string, phone: string } | null>(null);
    const [activeVisit, setActiveVisit] = useState<{ name: string, id: string } | null>(null);

    useEffect(() => {
        // Fetch leads
        fetch('/api/leads').then(res => res.json()).then(setLeads);
    }, []);

    const getLeadsByStage = (stage: LeadStatus) => leads.filter(l => l.status === stage);

    return (
        <div className="flex h-full overflow-x-auto gap-4 p-4 pb-2 relative">
            {stages.map(stage => (
                <div key={stage.id} className="min-w-[320px] max-w-[320px] flex flex-col h-full bg-slate-100 rounded-xl border border-slate-200">
                    <div className={`p-4 border-t-4 ${stage.color} bg-white rounded-t-xl shadow-sm`}>
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="font-bold text-slate-800">{stage.title}</h3>
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-medium">
                                {getLeadsByStage(stage.id).length}
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                        {getLeadsByStage(stage.id).map(lead => (
                            <div key={lead.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-bold text-slate-900">{lead.name}</h4>
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            <Phone size={10} /> {lead.phone}
                                        </p>
                                    </div>
                                    <button className="text-slate-300 hover:text-slate-600">
                                        <MoreHorizontal size={16} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2 my-3">
                                    {lead.tags?.slice(0, 3).map(tag => (
                                        <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase rounded tracking-wider text-center truncate">
                                            {tag.replace('_', ' ')}
                                        </span>
                                    ))}

                                    {/* AI Score Badge */}
                                    {lead.aiScore !== undefined ? (
                                        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded tracking-wider flex items-center justify-center gap-1 ${lead.aiScore > 70 ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                                            <Sparkles size={10} /> AI: {lead.aiScore}
                                        </span>
                                    ) : (
                                        lead.leadScore > 50 && (
                                            <span className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold uppercase rounded tracking-wider flex items-center justify-center gap-1">
                                                <AlertCircle size={10} /> Hot ({lead.leadScore})
                                            </span>
                                        )
                                    )}
                                </div>

                                {lead.aiReasoning && (
                                    <div className="mb-3 px-2 py-1.5 bg-purple-50 rounded border border-purple-100 text-[10px] text-purple-800 italic leading-tight">
                                        "{lead.aiReasoning}"
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-3 border-t border-slate-50 text-xs text-slate-400">
                                    <span className="flex items-center gap-1">
                                        <Clock size={12} /> 2h ago
                                    </span>
                                    <button
                                        className="text-indigo-600 font-semibold hover:bg-indigo-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
                                        onClick={() => setActiveCall({ name: lead.name, phone: lead.phone })}
                                    >
                                        <Phone size={14} /> Call
                                    </button>
                                </div>
                                <div className="mt-2 pt-2 border-t border-slate-50 flex justify-center">
                                    <button
                                        className="text-xs font-medium text-emerald-600 flex items-center gap-1 hover:underline"
                                        onClick={() => setActiveVisit({ name: lead.name, id: lead.id })}
                                    >
                                        <Calendar size={12} /> Schedule Visit
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <CommunicationConsole
                isOpen={!!activeCall}
                leadName={activeCall?.name}
                leadPhone={activeCall?.phone}
                onClose={() => setActiveCall(null)}
            />

            <VisitScheduler
                isOpen={!!activeVisit}
                leadName={activeVisit?.name}
                leadId={activeVisit?.id}
                onClose={() => setActiveVisit(null)}
            />
        </div>
    );
}
