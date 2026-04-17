"use client";

import { Lead, LeadStage } from "@/lib/db";
import { Bot, Calendar, CheckCircle2, FileCheck, HandshakeIcon, TrendingUp, XCircle } from "lucide-react";

interface LeadCardProps {
    lead: Lead;
    onViewDetails: (id: string) => void;
    onBookVisit?: (id: string) => void;
}

const stageColors: Record<LeadStage, string> = {
    "New": "bg-slate-100 text-slate-700",
    "AI_Calling": "bg-blue-100 text-blue-700",
    "Qualified": "bg-green-100 text-green-700",
    "Visit_Booked": "bg-purple-100 text-purple-700",
    "Visit_Completed": "bg-indigo-100 text-indigo-700",
    "Negotiation": "bg-orange-100 text-orange-700",
    "Booking_Done": "bg-emerald-100 text-emerald-700",
    "Disqualified": "bg-red-100 text-red-700"
};

const priorityColors = {
    high: "bg-green-500",
    medium: "bg-yellow-500",
    low: "bg-slate-400"
};

export default function LeadCard({ lead, onViewDetails, onBookVisit }: LeadCardProps) {
    const getPriority = () => {
        if ((lead.aiScore || 0) >= 80) return "high";
        if ((lead.aiScore || 0) >= 50) return "medium";
        return "low";
    };

    const priority = getPriority();

    const getLastActivity = () => {
        if (lead.visit?.visitDateTime) {
            return `Visit: ${new Date(lead.visit.visitDateTime).toLocaleDateString()}`;
        }
        if (lead.qualification?.qualifiedAt) {
            return `Qualified: ${new Date(lead.qualification.qualifiedAt).toLocaleDateString()}`;
        }
        if (lead.aiCalling?.lastAttemptAt) {
            return `Last call: ${new Date(lead.aiCalling.lastAttemptAt).toLocaleTimeString()}`;
        }
        return `Created: ${new Date(lead.createdAt).toLocaleDateString()}`;
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer group">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${priorityColors[priority]}`} />
                    <h3 className="font-semibold text-slate-900 text-sm">
                        {lead.name || `${lead.firstName} ${lead.lastName}`}
                    </h3>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stageColors[lead.currentStage]}`}>
                    {lead.currentStage.replace('_', ' ')}
                </span>
            </div>

            {/* Details */}
            <div className="space-y-2 text-xs text-slate-600 mb-3">
                {lead.qualification?.propertyType && (
                    <div className="flex items-center gap-1">
                        <span className="font-medium">Requirement:</span>
                        <span>{lead.qualification.propertyType}</span>
                    </div>
                )}

                {lead.qualification?.budgetMin && lead.qualification?.budgetMax && (
                    <div className="flex items-center gap-1">
                        <span className="font-medium">Budget:</span>
                        <span>
                            ₹{(lead.qualification.budgetMin / 100000).toFixed(0)}L -
                            ₹{(lead.qualification.budgetMax / 100000).toFixed(0)}L
                        </span>
                    </div>
                )}

                {lead.qualification?.preferredLocations && lead.qualification.preferredLocations.length > 0 && (
                    <div className="flex items-center gap-1">
                        <span className="font-medium">📍</span>
                        <span>{lead.qualification.preferredLocations[0]}</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{getLastActivity()}</span>
                    {lead.aiScore !== undefined && lead.aiScore > 0 && (
                        <span className="flex items-center gap-1 font-medium">
                            <Bot size={12} />
                            {lead.aiScore}/100
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    {lead.currentStage === 'Qualified' && onBookVisit && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onBookVisit(lead.id);
                            }}
                            className="flex-1 text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                        >
                            📅 Book Visit
                        </button>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails(lead.id);
                        }}
                        className="flex-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-medium transition-colors"
                    >
                        View Details
                    </button>
                </div>
            </div>
        </div>
    );
}
