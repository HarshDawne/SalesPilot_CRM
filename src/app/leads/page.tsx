"use client";

import LeadsTable from "@/components/LeadsTable";
import { BulkImport } from "@/components/leads/BulkImport";
import CreateLeadModal from "@/components/CreateLeadModal";
import { useState, useEffect } from "react";
import { 
    Users, Calendar, TrendingUp, Phone, Sparkles, 
    Plus, LayoutGrid, List, Filter, Download, 
    ChevronDown, X, Upload
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function LeadsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    newToday: 0,
    upcomingVisits: 0,
    conversionRate: 0,
    newTodayChange: 0,
    visitsChange: 0,
    conversionChange: 0
  });

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/leads');
      const leads = await response.json();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const newToday = leads.filter((l: any) => {
        const createdDate = new Date(l.createdAt);
        createdDate.setHours(0, 0, 0, 0);
        return createdDate.getTime() === today.getTime();
      }).length;

      const upcomingVisits = leads.filter((l: any) =>
        l.currentStage === 'Visit_Booked' &&
        new Date(l.visit?.visitDateTime) > new Date()
      ).length;

      const totalLeads = leads.length;
      const wonLeads = leads.filter((l: any) => l.currentStage === 'Booking_Done').length;
      const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

      setMetrics({
        totalLeads,
        newToday,
        upcomingVisits,
        conversionRate,
        newTodayChange: 12, // Mocked for design
        visitsChange: 8,
        conversionChange: 5
      });
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-[1440px] mx-auto">
      
      {/* 1. Industrial Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em]">
                <Plus size={12} className="text-secondary" />
                Pipeline Orchestration
            </div>
            <h1 className="text-3xl font-black text-text-main tracking-tighter">
                Lead <span className="text-secondary">Management</span>
            </h1>
            <p className="text-sm text-text-secondary font-medium">Unified command for manual entries, AI harvests, and partner redirects.</p>
        </div>

        <div className="flex items-center gap-3 relative">
            {/* View Toggle */}
            <div className="mr-2"></div>

            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="btn-primary flex items-center gap-2 text-xs py-2.5"
            >
              <Plus size={16} />
              Add Inventory Lead
              <ChevronDown size={14} className={cn("transition-transform", showAddMenu && "rotate-180")} />
            </button>

            {/* Dropdown Menu */}
            {showAddMenu && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-border-subtle overflow-hidden z-30 animate-in fade-in zoom-in-95 duration-200">
                <button
                  onClick={() => { setIsModalOpen(true); setShowAddMenu(false); }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 transition-colors border-b border-border-subtle"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center">
                    <Users size={16} />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-text-main">Walk-in Entry</div>
                    <div className="text-[10px] text-text-secondary">Manual on-site registration</div>
                  </div>
                </button>
                <button
                  onClick={() => { setIsBulkImportOpen(true); setShowAddMenu(false); }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-secondary/5 text-secondary flex items-center justify-center">
                    <Upload size={16} />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-text-main">Bulk Data Ingestion</div>
                    <div className="text-[10px] text-text-secondary">CSV / Excel Harbingers</div>
                  </div>
                </button>
              </div>
            )}
            {showAddMenu && <div className="fixed inset-0 z-10" onClick={() => setShowAddMenu(false)}></div>}
        </div>
      </div>

      {/* 2. Strategy Metrics Removed */}


      {/* 3. Primary Workspace */}
      <div className="card-premium min-h-[600px] flex flex-col bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle bg-slate-50/30 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <span className="text-[11px] font-medium text-text-secondary">
                    Total Command Nodes: <span className="text-text-main font-bold">{metrics.totalLeads}</span> Active
                </span>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-slate-300 uppercase underline decoration-secondary/30 underline-offset-4 tracking-[0.2em]">Tactical Interface v3.0</span>
            </div>
        </div>
        
        <div className="flex-1 overflow-auto">
            <LeadsTable key={refreshKey} />
        </div>
      </div>

      {/* Modals */}
      <CreateLeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setRefreshKey(k => k + 1);
          setIsModalOpen(false);
          fetchMetrics();
        }}
      />

      {isBulkImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/20 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden relative animate-in zoom-in-95 duration-200 border border-border-subtle">
            <button
              onClick={() => setIsBulkImportOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-all z-10"
            >
              <X size={20} />
            </button>
            <div className="p-8">
              <div className="mb-6">
                  <h3 className="text-xl font-black text-text-main tracking-tight">Bulk Data Ingestion</h3>
                  <p className="text-sm text-text-secondary font-medium">Standardize and import large lead datasets instantly.</p>
              </div>
              <BulkImport />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
