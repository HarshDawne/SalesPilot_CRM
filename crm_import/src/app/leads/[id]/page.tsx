"use client";

import { useState, useEffect } from "react";
import { Lead, Activity } from "@/lib/db";
import { useParams } from "next/navigation";
import { Phone, Mail, User, ArrowLeft, MessageSquare, Calendar, ChevronDown, Check, Clock, Tag } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import ActivityTimeline from "@/components/ActivityTimeline";
import ActivityComposer from "@/components/ActivityComposer";
import BookingModal from "@/components/BookingModal";

import AuditViewer from "@/components/AuditViewer";
import TransitionModal from "@/components/TransitionModal";
import { ShieldCheck } from "lucide-react";

export default function LeadProfile() {
    const params = useParams();
    const [lead, setLead] = useState<Lead | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [isAuditOpen, setIsAuditOpen] = useState(false);
    const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
    const [targetStage, setTargetStage] = useState<string>("");

    useEffect(() => {
        if (params.id) {
            fetchLeadDetails();
        }
    }, [params.id]);

    const fetchLeadDetails = async () => {
        try {
            const res = await fetch(`/api/leads/${params.id}`);
            const data = await res.json();
            setLead(data);
            setActivities(data.activities || []);
        } catch (error) {
            console.error("Failed to fetch lead details", error);
        } finally {
            setLoading(false);
        }
    };

    const handleActivityAdded = (newActivity: Activity) => {
        setActivities([newActivity, ...activities]);
        fetchLeadDetails(); // Refresh to update status/lastContacted
    };

    const handleStatusChange = async (newStatus: string) => {
        setTargetStage(newStatus);
        setIsTransitionModalOpen(true);
        setIsStatusOpen(false);
    };

    if (loading) return <div className="flex h-full items-center justify-center text-slate-400">Loading profile...</div>;
    if (!lead) return <div className="flex h-full items-center justify-center text-slate-400">Lead not found</div>;

    const statusOptions = [
        "New", "Contacted", "AI-Qualified", "Human Verified", "Property Suggested",
        "Visit Booked", "Visit Completed", "Follow-Up Stage", "Negotiation Stage",
        "Token Paid", "Closed (Won)", "Closed (Lost)", "No-Show"
    ];

    const statusColors: Record<string, string> = {
        "New": "bg-blue-50 text-blue-700 ring-blue-600/20",
        "Contacted": "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
        "AI-Qualified": "bg-purple-50 text-purple-700 ring-purple-600/20",
        "Human Verified": "bg-violet-50 text-violet-700 ring-violet-600/20",
        "Property Suggested": "bg-sky-50 text-sky-700 ring-sky-600/20",
        "Visit Booked": "bg-orange-50 text-orange-700 ring-orange-600/20",
        "Visit Completed": "bg-amber-50 text-amber-700 ring-amber-600/20",
        "Follow-Up Stage": "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
        "Negotiation Stage": "bg-pink-50 text-pink-700 ring-pink-600/20",
        "Token Paid": "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
        "Closed (Won)": "bg-green-50 text-green-700 ring-green-600/20",
        "Closed (Lost)": "bg-slate-100 text-slate-500 ring-slate-600/20",
        "No-Show": "bg-red-50 text-red-700 ring-red-600/20",
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Back Link */}
            <div className="flex justify-between items-center mb-6">
                <Link href="/leads" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Leads
                </Link>
                <button
                    onClick={() => setIsAuditOpen(true)}
                    className="text-xs font-medium text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                >
                    <ShieldCheck size={14} />
                    Audit Log
                </button>
            </div>

            {/* Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mb-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-4 mb-3">
                            <h1 className="text-3xl font-bold font-heading text-slate-900">{lead.firstName} {lead.lastName}</h1>

                            {/* Status Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsStatusOpen(!isStatusOpen)}
                                    className={cn("px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 transition-all ring-1 ring-inset hover:ring-2", statusColors[lead.currentStage] || "bg-slate-100 text-slate-700")}
                                >
                                    {lead.currentStage}
                                    <ChevronDown size={14} className="opacity-70" />
                                </button>

                                {isStatusOpen && (
                                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-20 animate-in fade-in zoom-in-95 duration-100 max-h-96 overflow-y-auto">
                                        {statusOptions.map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => handleStatusChange(status)}
                                                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors"
                                            >
                                                {status}
                                                {lead.currentStage === status && <Check size={14} className="text-indigo-600" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Score Badge */}
                            <div className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100 flex items-center gap-1">
                                Score: {lead.score || 0}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-6 text-slate-500 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-slate-100 rounded-full"><Phone size={14} className="text-slate-600" /></div>
                                <span className="font-medium text-slate-700">{lead.primaryPhone || "No phone"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-slate-100 rounded-full"><Mail size={14} className="text-slate-600" /></div>
                                <span>{lead.email || "No email"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-slate-100 rounded-full"><User size={14} className="text-slate-600" /></div>
                                <span>{lead.source || "Manual"}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Info */}
                <div className="space-y-8">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                            <User size={16} className="text-indigo-500" />
                            Lead Details
                        </h3>
                        <div className="space-y-6">
                            <div className="pb-4 border-b border-slate-50">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Budget Range</label>
                                <div className="text-lg font-medium text-slate-900">
                                    {lead.budgetMin ? `₹${(lead.budgetMin / 100000).toFixed(0)}L - ${(lead.budgetMax! / 100000).toFixed(0)}L` : "-"}
                                </div>
                            </div>
                            <div className="pb-4 border-b border-slate-50">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Location Preference</label>
                                <div className="flex items-center gap-2 text-slate-900 font-medium">
                                    {lead.preferredLocation || "Not specified"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Activity & Composer */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Composer */}
                    <ActivityComposer leadId={lead.id} onActivityAdded={handleActivityAdded} />

                    {/* Timeline */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                        <h3 className="text-lg font-bold font-heading text-slate-900 mb-8 flex items-center gap-2">
                            <Clock size={20} className="text-indigo-500" />
                            Activity Timeline
                        </h3>
                        <ActivityTimeline activities={activities} />
                    </div>
                </div>
            </div>

            <BookingModal
                isOpen={isBookingOpen}
                onClose={() => setIsBookingOpen(false)}
                leadId={params.id as string}
                onBookingConfirmed={handleActivityAdded}
            />

            <AuditViewer
                isOpen={isAuditOpen}
                onClose={() => setIsAuditOpen(false)}
                activities={activities}
            />

            {lead && (
                <TransitionModal
                    lead={lead}
                    isOpen={isTransitionModalOpen}
                    onClose={() => setIsTransitionModalOpen(false)}
                    onSuccess={() => {
                        fetchLeadDetails();
                        setIsTransitionModalOpen(false);
                    }}
                    allowedStages={statusOptions}
                />
            )}
        </div>
    );
}
