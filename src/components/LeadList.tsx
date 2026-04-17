"use client";

import { useState } from "react";
import { Lead } from "@/lib/db";
import { Search, Phone, Plus, ArrowRight, LayoutGrid, List as ListIcon, Download, Upload, Filter, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

import CreateLeadModal from "./CreateLeadModal";
import KanbanBoard from "./KanbanBoard";
import { useRealtimeLeads } from "@/hooks/useRealtimeLeads";
import { useToast } from "@/components/ui/ToastProvider";

export default function LeadList() {
    const { showToast } = useToast();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("All");
    const [smartFilter, setSmartFilter] = useState<string>("All"); // "All", "Fresh", "Hot", "Visit Due"
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
    const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

    // Advanced Filters
    const [showFilters, setShowFilters] = useState(false);
    const [minBudget, setMinBudget] = useState<string>("");
    const [maxBudget, setMaxBudget] = useState<string>("");

    // Use real-time hook for automatic updates
    const { leads: allLeads/*, isConnected*/ } = useRealtimeLeads();

    // Smart Segments Logic
    const leads = allLeads.filter(lead => {
        // 1. Basic Search
        const matchesSearch = !search ||
            lead.firstName?.toLowerCase().includes(search.toLowerCase()) ||
            lead.lastName?.toLowerCase().includes(search.toLowerCase()) ||
            lead.primaryPhone.includes(search);

        // 2. Status Filter
        const matchesStatus = statusFilter === "All" || lead.currentStage === statusFilter;

        // 3. Smart Filter
        let matchesSmart = true;
        if (smartFilter === "Fresh") {
            const daysOld = (new Date().getTime() - new Date(lead.createdAt).getTime()) / (1000 * 3600 * 24);
            matchesSmart = daysOld <= 3;
        } else if (smartFilter === "Hot") {
            matchesSmart = (lead.aiScore || 0) >= 80 || (lead.leadTags?.includes('hot') || false);
        } else if (smartFilter === "Visit Due") {
            matchesSmart = lead.currentStage === "Visit_Booked";
        }

        // 4. Advanced Filters
        let matchesAdvanced = true;
        if (minBudget) {
            const budget = lead.qualification?.budgetMin || lead.budgetMin || 0;
            matchesAdvanced = matchesAdvanced && budget >= parseInt(minBudget);
        }
        if (maxBudget) {
            const budget = lead.qualification?.budgetMax || lead.budgetMax || 0;
            matchesAdvanced = matchesAdvanced && budget <= parseInt(maxBudget);
        }

        return matchesSearch && matchesStatus && matchesSmart && matchesAdvanced;
    });

    const handleStatusChange = async (leadId: string, newStatus: string) => {
        try {
            // Optimistic update handled by real-time hook
            await fetch(`/api/leads/${leadId}/status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });
        } catch (error) {
            console.error("Status update failed", error);
            // Real-time hook will revert on error
        }
    };

    const handleExport = () => {
        window.location.href = '/api/leads/export';
    };

    const handleImportClick = () => {
        document.getElementById('import-file')?.click();
    };

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch('/api/leads/import', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.status === 'success') {
                showToast(`Imported: ${data.created}, Duplicates: ${data.duplicates}`, "success");
                // Real-time hook will automatically show new leads
            } else {
                showToast('Import failed', "error");
            }
        } catch (err) {
            console.error(err);
            showToast('Import error', "error");
        }
    };

    const toggleSelectAll = () => {
        if (selectedLeads.size === leads.length) {
            setSelectedLeads(new Set());
        } else {
            setSelectedLeads(new Set(leads.map(l => l.id)));
        }
    };

    const toggleSelectLead = (id: string) => {
        const newSelected = new Set(selectedLeads);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedLeads(newSelected);
    };

    const handleBatchCall = async () => {
        if (selectedLeads.size === 0) return;
        if (!confirm(`Start AI Campaign for ${selectedLeads.size} leads?`)) return;

        try {
            const res = await fetch('/api/leads/batch-call', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadIds: Array.from(selectedLeads) })
            });
            const data = await res.json();
            if (data.status === 'success') {
                showToast(`Campaign Started! Queued: ${data.queued}`, "success");
                setSelectedLeads(new Set());
            } else {
                showToast('Failed to start campaign', "error");
            }
        } catch (error) {
            console.error(error);
            showToast('Error starting campaign', "error");
        }
    };

    const statusColors: Record<string, string> = {
        "New": "bg-blue-50 text-blue-700 ring-blue-600/20",
        "AI_Calling": "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
        "Qualified": "bg-green-50 text-green-700 ring-green-600/20",
        "Visit_Booked": "bg-purple-50 text-purple-700 ring-purple-600/20",
        "Visit_Completed": "bg-amber-50 text-amber-700 ring-amber-600/20",
        "Negotiation": "bg-pink-50 text-pink-700 ring-pink-600/20",
        "Booking_Done": "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
        "Disqualified": "bg-red-50 text-red-700 ring-red-600/20",
    };

    return (
        <div className="p-8 max-w-7xl mx-auto relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-heading text-slate-900">Leads</h1>
                    <p className="text-slate-500 mt-1">Manage and track your potential customers</p>
                </div>
                <div className="flex gap-3 items-center">
                    <div className="bg-white border border-slate-200 rounded-lg p-1 flex items-center">
                        <button onClick={() => setViewMode('list')} className={cn("p-2 rounded-md transition-all", viewMode === 'list' ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-600")} title="List View"><ListIcon size={20} /></button>
                        <button onClick={() => setViewMode('kanban')} className={cn("p-2 rounded-md transition-all", viewMode === 'kanban' ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-600")} title="Kanban View"><LayoutGrid size={20} /></button>
                    </div>
                    <button onClick={handleExport} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200" title="Export CSV"><Download size={20} /></button>
                    <button onClick={handleImportClick} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200" title="Import CSV"><Upload size={20} /></button>
                    <input type="file" id="import-file" className="hidden" accept=".csv" onChange={handleImportFile} />
                    <Link href="/admin/reconciliation" className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200" title="Admin Reconciliation"><LayoutGrid size={20} /></Link>
                    <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary flex items-center gap-2 shadow-lg shadow-indigo-500/20"><Plus size={20} /> Add New Lead</button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96 flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" placeholder="Search leads..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn("p-2.5 rounded-xl border border-slate-200 transition-colors", showFilters ? "bg-slate-100 text-slate-900" : "bg-white text-slate-500 hover:bg-slate-50")}
                    >
                        <Filter size={20} />
                    </button>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    {/* Smart Tabs */}
                    {[
                        { id: "All", label: "All Leads" },
                        { id: "Fresh", label: "Fresh (3 Days)" },
                        { id: "Hot", label: "Hot Prospects" },
                        { id: "Visit Due", label: "Visit Due" }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setSmartFilter(tab.id)}
                            className={cn(
                                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                                smartFilter === tab.id
                                    ? "bg-indigo-600 text-white shadow-md"
                                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                    <div className="h-6 w-px bg-slate-200 mx-2"></div>
                    {/* Status Filters */}
                    {["All", "New", "Qualified", "Visit_Booked"].map((status) => (
                        <button key={status} onClick={() => setStatusFilter(status)} className={cn("px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all", statusFilter === status ? "bg-slate-900 text-white shadow-md" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50")}>{status.replace('_', ' ')}</button>
                    ))}
                </div>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
                <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap gap-4 items-end animate-in fade-in slide-in-from-top-2">
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Min Budget (₹)</label>
                        <input
                            type="number"
                            placeholder="Min"
                            className="px-3 py-2 rounded-lg border border-slate-200 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            value={minBudget}
                            onChange={(e) => setMinBudget(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Max Budget (₹)</label>
                        <input
                            type="number"
                            placeholder="Max"
                            className="px-3 py-2 rounded-lg border border-slate-200 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            value={maxBudget}
                            onChange={(e) => setMaxBudget(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => { setMinBudget(""); setMaxBudget(""); }}
                        className="px-3 py-2 text-sm text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1"
                    >
                        <X size={16} /> Clear Filters
                    </button>
                </div>
            )}

            {/* Batch Action Bar */}
            {selectedLeads.size > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-4 z-50">
                    <span className="font-medium">{selectedLeads.size} selected</span>
                    <div className="h-4 w-px bg-slate-700"></div>
                    <button onClick={handleBatchCall} className="flex items-center gap-2 hover:text-indigo-300 transition-colors font-medium">
                        <Phone size={16} /> Start AI Campaign
                    </button>
                </div>
            )}

            {/* Content */}
            {viewMode === 'list' ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="py-4 px-6 w-10">
                                        <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={leads.length > 0 && selectedLeads.size === leads.length} onChange={toggleSelectAll} />
                                    </th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Lead Name</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Budget</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Contact</th>
                                    <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {leads.length === 0 ? (
                                    <tr><td colSpan={7} className="p-8 text-center text-slate-500">No leads found</td></tr>
                                ) : (
                                    leads.map((lead) => (
                                        <tr key={lead.id} className={cn("group hover:bg-slate-50/80 transition-colors cursor-pointer", selectedLeads.has(lead.id) && "bg-indigo-50/50")}>
                                            <td className="py-4 px-6">
                                                <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={selectedLeads.has(lead.id)} onChange={() => toggleSelectLead(lead.id)} />
                                            </td>
                                            <td className="py-4 px-6">
                                                <Link href={`/leads/${lead.id}`} className="block">
                                                    <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{lead.firstName} {lead.lastName}</div>
                                                    <div className="text-xs text-slate-500">Added {formatDistanceToNow(new Date(lead.createdAt))} ago</div>
                                                </Link>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset", statusColors[lead.currentStage] || "bg-gray-100 text-gray-700 ring-gray-600/20")}>{lead.currentStage?.replace(/_/g, ' ') || 'New'}</span>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-slate-600">{lead.primaryPhone}</td>
                                            <td className="py-4 px-6 text-sm text-slate-600">{lead.budgetMin ? `₹${(lead.budgetMin / 100000).toFixed(0)}L - ${(lead.budgetMax! / 100000).toFixed(0)}L` : "-"}</td>
                                            <td className="py-4 px-6 text-sm text-slate-500">{lead.lastContactedAt ? formatDistanceToNow(new Date(lead.lastContactedAt)) + " ago" : "Never"}</td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Call"><Phone size={16} /></button>
                                                    <Link href={`/leads/${lead.id}`} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><ArrowRight size={16} /></Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <KanbanBoard leads={leads} onStatusChange={handleStatusChange} />
            )}

            <CreateLeadModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSuccess={() => setIsCreateModalOpen(false)} />
        </div>
    );
}
