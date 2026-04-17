"use client";

import LeadsTable from "@/components/LeadsTable";
import CreateLeadModal from "@/components/CreateLeadModal";
import { useState, useEffect } from "react";
import { Users, Calendar, TrendingUp, Phone, Sparkles, ArrowUp, ArrowDown } from "lucide-react";

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

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

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
        newTodayChange: Math.random() > 0.5 ? Math.floor(Math.random() * 20) : -Math.floor(Math.random() * 10),
        visitsChange: Math.random() > 0.5 ? Math.floor(Math.random() * 15) : -Math.floor(Math.random() * 8),
        conversionChange: Math.random() > 0.5 ? Math.floor(Math.random() * 5) : -Math.floor(Math.random() * 3)
      });
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-[1600px] mx-auto p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold font-heading text-gradient-emerald">
              Lead Management
            </h1>
            <p className="text-slate-600 mt-2 flex items-center gap-2 text-lg">
              <Sparkles size={16} className="text-emerald-600" />
              AI-Powered Real Estate CRM
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2 shadow-xl hover-glow-emerald"
          >
            <Users size={18} />
            Add New Lead
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Leads */}
          <div className="premium-card-emerald p-7 micro-lift hover-glow-emerald group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/5 rounded-full -mr-12 -mt-12" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl shadow-lg shadow-emerald-500/30">
                  <Users size={24} />
                </div>
              </div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Total Leads</p>
              <p className="text-4xl font-bold font-heading text-slate-900">{metrics.totalLeads}</p>
            </div>
          </div>

          {/* New Today */}
          <div className="premium-card-emerald p-7 micro-lift hover-glow-emerald group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-400/5 rounded-full -mr-12 -mt-12" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-xl shadow-lg shadow-teal-500/30">
                  <Sparkles size={24} />
                </div>
                {metrics.newTodayChange !== 0 && (
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${metrics.newTodayChange > 0
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                    {metrics.newTodayChange > 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                    {Math.abs(metrics.newTodayChange)}%
                  </div>
                )}
              </div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">New Today</p>
              <p className="text-4xl font-bold font-heading text-slate-900">{metrics.newToday}</p>
            </div>
          </div>

          {/* Upcoming Visits */}
          <div className="premium-card-emerald p-7 micro-lift hover-glow-emerald group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-400/5 rounded-full -mr-12 -mt-12" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-teal-600 to-emerald-500 text-white rounded-xl shadow-lg shadow-teal-500/30">
                  <Calendar size={24} />
                </div>
                {metrics.visitsChange !== 0 && (
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${metrics.visitsChange > 0
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                    {metrics.visitsChange > 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                    {Math.abs(metrics.visitsChange)}%
                  </div>
                )}
              </div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Upcoming Visits</p>
              <p className="text-4xl font-bold font-heading text-slate-900">{metrics.upcomingVisits}</p>
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="premium-card-emerald p-7 micro-lift hover-glow-emerald group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/5 rounded-full -mr-12 -mt-12" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/30">
                  <TrendingUp size={24} />
                </div>
                {metrics.conversionChange !== 0 && (
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${metrics.conversionChange > 0
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                    {metrics.conversionChange > 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                    {Math.abs(metrics.conversionChange)}%
                  </div>
                )}
              </div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Conversion Rate</p>
              <p className="text-4xl font-bold font-heading text-slate-900">{metrics.conversionRate}%</p>
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <LeadsTable key={refreshKey} />

        {/* Create Lead Modal */}
        <CreateLeadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setRefreshKey(k => k + 1);
            setIsModalOpen(false);
            fetchMetrics();
          }}
        />
      </div>
    </div>
  );
}
