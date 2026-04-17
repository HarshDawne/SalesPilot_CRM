"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Lead, Activity } from "@/lib/db";
import { 
    Phone, Mail, User, ArrowLeft, MessageSquare, Calendar, 
    ChevronDown, Check, Clock, Tag, ShieldCheck, Zap, 
    Sparkles, Target, Settings, MoreHorizontal, CheckSquare,
    Smartphone, Hash, MapPin, Globe, History, Send, Trash2, Home,
    ArrowRight, StickyNote
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

// Components
import ActivityTimeline from "@/components/ActivityTimeline";
import ActivityComposer from "@/components/ActivityComposer";
import BookingModal from "@/components/BookingModal";
import AuditViewer from "@/components/AuditViewer";
import TransitionModal from "@/components/TransitionModal";
import { PropertyInterests } from "@/components/leads/PropertyInterests";

export default function LeadProfile() {
    const params = useParams();
    const router = useRouter();
    const [lead, setLead] = useState<Lead | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    
    // UI State
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [isAuditOpen, setIsAuditOpen] = useState(false);
    const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
    const [isAgentMenuOpen, setIsAgentMenuOpen] = useState(false);
    const [activeActivityTab, setActiveActivityTab] = useState<"note" | "call" | "whatsapp">("note");
    const [targetStage, setTargetStage] = useState<string>("");

    useEffect(() => {
        if (params?.id) {
            fetchLeadDetails();
        }
    }, [params?.id]);

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
        fetchLeadDetails(); 
    };

    const handleStatusChange = async (newStatus: string) => {
        setTargetStage(newStatus);
        setIsTransitionModalOpen(true);
        setIsStatusOpen(false);
    };

    const handleQuickAction = (tab: "note" | "call" | "whatsapp") => {
        setActiveActivityTab(tab);
        const element = document.getElementById('activity-composer');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const handleAssignAgent = async (agentId: string) => {
        if (!lead) return;
        try {
            const res = await fetch(`/api/leads/${lead.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignedAgentId: agentId })
            });
            if (res.ok) {
                fetchLeadDetails();
                setIsAgentMenuOpen(false);
            }
        } catch (error) {
            console.error("Failed to assign agent", error);
        }
    };

    if (loading) return (
        <div className="flex flex-col h-full items-center justify-center bg-bg-base space-y-4">
            <Zap className="text-primary animate-pulse" size={40} />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Intelligence Profile...</p>
        </div>
    );
    
    if (!lead) return (
        <div className="flex flex-col h-full items-center justify-center bg-bg-base">
            <h2 className="text-xl font-black text-text-main uppercase tracking-tight">Node Not Found</h2>
            <button onClick={() => router.back()} className="mt-4 btn-primary">Return to Registry</button>
        </div>
    );

    const statusOptions = [
        "New", "Contacted", "AI_Calling", "Qualified", "Visit_Booked", 
        "Visit_Completed", "Negotiation", "Booking_Done", "Disqualified"
    ];

    const mockAgents = [
        { id: "agent_1", name: "Vikram Malhotra" },
        { id: "agent_2", name: "Ananya Sharma" },
        { id: "agent_3", name: "Rohan Gupta" }
    ];

    const getStageStyles = (stage: string) => {
        const styles: Record<string, string> = {
            "New": "bg-slate-100 text-slate-600 border-slate-200",
            "AI_Calling": "bg-primary/5 text-primary border-primary/20",
            "Qualified": "bg-emerald-50 text-emerald-600 border-emerald-100",
            "Visit_Booked": "bg-secondary/5 text-secondary border-secondary/20",
            "Negotiation": "bg-amber-50 text-amber-600 border-amber-100",
            "Booking_Done": "bg-emerald-100 text-emerald-700 border-emerald-200",
            "Disqualified": "bg-rose-50 text-rose-600 border-rose-100",
        };
        return styles[stage] || "bg-slate-100 text-slate-700 border-slate-200";
    };

    return (
        <div className="max-w-[1440px] mx-auto p-4 lg:p-10 space-y-8 animate-in fade-in duration-500">
            
            {/* Header: Tactical Metadata */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.back()} 
                        className="p-2.5 bg-white border border-border-subtle rounded-xl text-slate-400 hover:text-primary hover:border-primary/20 transition-all shadow-sm"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-text-main tracking-tighter uppercase">{lead.name}</h1>
                            <div className="relative">
                                <button
                                    onClick={() => setIsStatusOpen(!isStatusOpen)}
                                    className={cn(
                                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all border",
                                        getStageStyles(lead.currentStage)
                                    )}
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                    {lead.currentStage}
                                    <ChevronDown size={10} />
                                </button>
                                {isStatusOpen && (
                                    <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-border-subtle py-2 z-50 animate-in zoom-in-95 duration-150">
                                        {statusOptions.map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => handleStatusChange(status)}
                                                className="w-full text-left px-4 py-2 text-[9px] font-black uppercase tracking-widest text-text-secondary hover:bg-slate-50 hover:text-primary flex items-center justify-between transition-colors"
                                            >
                                                {status.replace('_', ' ')}
                                                {lead.currentStage === status && <Check size={10} className="text-primary" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subscriber Node: {lead.id.slice(-6).toUpperCase()}</span>
                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Source: {lead.source || lead.createdVia || "Direct Channel"}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lead Created</p>
                        <p className="text-xs font-bold text-text-main">{new Date(lead.createdAt).toLocaleDateString()} {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="h-10 w-px bg-slate-200 mx-2 hidden sm:block" />
                    <div className="relative group">
                        <div className="flex items-center gap-3 p-1.5 bg-white border border-border-subtle rounded-2xl shadow-sm hover:border-primary/20 transition-all cursor-pointer" onClick={() => setIsAgentMenuOpen(!isAgentMenuOpen)}>
                            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-black text-xs text-slate-400">
                                {lead.assignedAgentId ? lead.assignedAgentId.charAt(0).toUpperCase() : "?"}
                            </div>
                            <div className="pr-4">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Assigned Agent</p>
                                {lead.assignedAgentId ? (
                                    <p className="text-xs font-bold text-text-main uppercase tracking-tight">Agent {lead.assignedAgentId.slice(0, 8)}</p>
                                ) : (
                                    <button className="text-xs font-black text-rose-500 hover:text-rose-600 uppercase tracking-tighter flex items-center gap-1 group">
                                        UNASSIGNED
                                        <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                )}
                            </div>
                        </div>
                        {isAgentMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-border-subtle py-2 z-50 animate-in fade-in slide-in-from-top-2">
                                <p className="px-4 py-2 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 mb-1">Select Strategic Agent</p>
                                {mockAgents.map((agent) => (
                                    <button
                                        key={agent.id}
                                        onClick={() => handleAssignAgent(agent.id)}
                                        className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:bg-slate-50 hover:text-primary transition-colors flex items-center gap-2"
                                    >
                                        <User size={12} /> {agent.name}
                                    </button>
                                ))}
                                <button className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 transition-colors flex items-center gap-2">
                                    <Trash2 size={12} /> Remove Assignment
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Tactical Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Column 1: Intelligence Repository (Left) */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Contact Detail Matrix */}
                    <div className="card-premium p-6 bg-white">
                        <h3 className="text-[10px] font-black text-text-main uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Smartphone size={14} className="text-primary" />
                            Contact Details
                        </h3>
                        <div className="space-y-4">
                            <ContactRow label="Primary Line" value={lead.primaryPhone} icon={<Phone size={14} />} primary />
                            <ContactRow label="Alternative" value={lead.secondaryPhone || lead.alternatePhone || "Not Provided"} icon={<Hash size={14} />} />
                            <ContactRow label="Digital ID" value={lead.email || "No Email Bound"} icon={<Mail size={14} />} />
                            <div className="pt-4 border-t border-border-subtle">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Preferred Channel</p>
                                <div className="flex gap-2">
                                    {['phone', 'whatsapp', 'email'].map(method => (
                                        <div key={method} className={cn(
                                            "flex-1 py-1.5 rounded-lg border text-[8px] font-black uppercase text-center transition-all",
                                            lead.preferredContactMethod === method ? "bg-primary/5 border-primary/20 text-primary" : "bg-slate-50 border-slate-100 text-slate-300"
                                        )}>
                                            {method}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Requirement Spectrum */}
                    <div className="card-premium p-6 bg-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.05]">
                            <Target size={60} className="text-primary" />
                        </div>
                        <h3 className="text-[10px] font-black text-text-main uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Target size={14} className="text-primary" />
                            Requirement Matrix
                        </h3>
                        <div className="grid grid-cols-2 gap-y-6 gap-x-4 relative z-10">
                            <SpecItem label="Budget Range" value={lead.qualification?.budgetMin ? `₹${(lead.qualification.budgetMin / 100000).toFixed(0)}L+` : "Undisclosed"} iconColor="text-emerald-500" />
                            <SpecItem label="Asset Type" value={Array.isArray(lead.qualification?.propertyType) ? lead.qualification.propertyType.join(', ') : (lead.qualification?.propertyType || "Property")} />
                            <SpecItem label="Location" value={Array.isArray(lead.qualification?.preferredLocations) ? lead.qualification.preferredLocations.join(', ') : (lead.qualification?.preferredLocations || "NCR Zone")} />
                            <SpecItem label="Timeline" value={lead.qualification?.timeline || "Standard"} />
                            <div className="col-span-2 pt-4 border-t border-border-subtle">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Intent Profile</p>
                                <p className="text-sm font-black text-primary uppercase">{lead.qualification?.purpose === 'investment' ? 'Strategic Investment' : 'Self-Use Residence'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Column 2: Operation Center (Center) */}
                <div className="lg:col-span-6 space-y-6">
                    {/* Tactical Actions Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <ActionButton icon={<Calendar size={18} />} label="Schedule Visit" onClick={() => setIsBookingOpen(true)} color="primary" />
                        <ActionButton icon={<StickyNote size={18} />} label="Add Note" onClick={() => handleQuickAction("note")} />
                        <ActionButton icon={<Phone size={18} />} label="Log Call" onClick={() => handleQuickAction("call")} />
                        <ActionButton 
                            icon={<MessageSquare size={18} />} 
                            label="WhatsApp" 
                            onClick={() => {
                                if (lead.primaryPhone) {
                                    window.open(`https://wa.me/${lead.primaryPhone.replace(/\D/g, '')}`, '_blank');
                                }
                                handleQuickAction("whatsapp");
                            }} 
                            color="success" 
                        />
                    </div>

                    {/* Follow-Up Status */}
                    <div className="card-premium p-6 bg-slate-900 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                            <History size={80} />
                        </div>
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/80 mb-1">Next Operational Follow-Up</p>
                                <h4 className="text-2xl font-black tracking-tight">{lead.visit?.visitDateTime ? new Date(lead.visit.visitDateTime).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }) : "No Pending Follow-up"}</h4>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Reminder Status</p>
                                <div className="px-3 py-1 bg-cyan-400/10 border border-cyan-400/30 rounded-full text-[10px] font-black text-cyan-400 tracking-widest">
                                    {lead.visit ? "ACTIVE" : "STANDBY"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Engagement Console */}
                    <div className="card-premium p-0 overflow-hidden bg-white">
                        <div className="bg-slate-50 border-b border-border-subtle px-6 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MessageSquare size={14} className="text-primary" />
                                <span className="text-[10px] font-black text-text-main uppercase tracking-widest">Interaction Logs</span>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest last-activity">Last Activity: {formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: true })}</span>
                        </div>
                        <ActivityComposer 
                            leadId={lead.id} 
                            onActivityAdded={handleActivityAdded} 
                            activeTab={activeActivityTab}
                            onTabChange={setActiveActivityTab}
                        />
                        <div className="p-6">
                            <ActivityTimeline activities={activities} />
                        </div>
                    </div>
                </div>

                {/* Column 3: Context Layer (Right) */}
                <div className="lg:col-span-3 space-y-6">
                    <PropertyInterests interests={lead.interestedProperties || [
                        { propertyId: '1', propertyName: 'M3M Crown Sector 111', status: 'interested', addedAt: new Date().toISOString() },
                        { propertyId: '2', propertyName: 'Signature Global Deluxe', status: 'viewed', addedAt: new Date().toISOString() }
                    ]} />

                    <div className="card-premium p-6 bg-emerald-50/30 border-emerald-100">
                        <h3 className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <ShieldCheck size={14} className="text-emerald-600" />
                            Visit Intelligence
                        </h3>
                        {lead.visitFeedback ? (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Feedback Synopsis</p>
                                    <p className="text-xs font-medium text-emerald-900 leading-relaxed italic">"{lead.visitFeedback.notes}"</p>
                                </div>
                                <div className="pt-4 border-t border-emerald-100 flex justify-between">
                                    <div>
                                        <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Rating</p>
                                        <p className="font-black text-lg text-emerald-700">{lead.visitFeedback.feedbackRating}/5</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Intensity</p>
                                        <p className="font-black text-lg text-emerald-700 uppercase">{lead.visitFeedback.interestLevelPostVisit || "Mid"}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">No Post-Visit Data Captured</p>
                            </div>
                        )}
                    </div>

                    <div className="card-premium p-6 bg-white border-dashed">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Intel</h3>
                            <button onClick={() => setIsAuditOpen(true)} className="text-[10px] font-black text-primary uppercase">Audit View</button>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-[10px]">
                                <span className="font-bold text-slate-400 uppercase">AI Score</span>
                                <span className="font-black text-primary">{lead.aiScore || 0}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                    className="bg-primary h-full transition-all duration-1000" 
                                    style={{ width: `${lead.aiScore || 0}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Modals Preserved */}
            <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} leadId={params.id as string} onBookingConfirmed={handleActivityAdded} />
            <AuditViewer isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} activities={activities} />
            {lead && (
                <TransitionModal 
                    lead={lead} 
                    isOpen={isTransitionModalOpen} 
                    onClose={() => setIsTransitionModalOpen(false)} 
                    onSuccess={(updated) => { setLead(updated); setIsTransitionModalOpen(false); }} 
                    allowedStages={statusOptions} 
                />
            )}
        </div>
    );
}

function ContactRow({ label, value, icon, primary }: any) {
    return (
        <div className="group">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">{label}</p>
            <div className={cn(
                "flex items-center gap-3 p-2 rounded-xl border transition-all",
                primary ? "bg-primary/5 border-primary/10 text-primary" : "bg-slate-50/50 border-slate-100 text-text-main group-hover:border-slate-200"
            )}>
                <div className={cn("p-1.5 rounded-lg", primary ? "bg-primary text-white" : "bg-white border border-slate-100 text-slate-400")}>
                    {icon}
                </div>
                <span className="text-xs font-bold truncate">{value}</span>
            </div>
        </div>
    );
}

function SpecItem({ label, value, iconColor }: any) {
    return (
        <div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">{label}</p>
            <p className={cn("text-xs font-black uppercase tracking-tight", iconColor || "text-text-main")}>{value || "---"}</p>
        </div>
    );
}

function ActionButton({ icon, label, onClick, color }: any) {
    return (
        <button 
            onClick={onClick}
            className={cn(
                "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all duration-300 group hover:-translate-y-1 hover:shadow-lg",
                color === 'primary' ? "bg-primary border-primary text-white shadow-primary/20" : 
                color === 'success' ? "bg-emerald-600 border-emerald-600 text-white shadow-emerald-200" :
                "bg-white border-border-subtle text-text-secondary hover:border-primary/20 hover:text-primary"
            )}
        >
            <div className="group-hover:scale-110 transition-transform">{icon}</div>
            <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
        </button>
    );
}
