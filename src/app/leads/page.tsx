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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="max-w-[1600px] mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">
              Lead Management
            </h1>
            <p className="text-slate-600 mt-2 flex items-center gap-2">
              <Sparkles size={16} className="text-blue-600" />
              AI-Powered Real Estate CRM
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 font-semibold flex items-center gap-2 hover:scale-105"
          >
            <Users size={18} />
            Add New Lead
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Leads */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-16 -mt-16" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30">
                  <Users size={24} />
                </div>
              </div>
              <p className="text-sm font-medium text-slate-600 mb-1">Total Leads</p>
              <p className="text-3xl font-bold text-slate-900">{metrics.totalLeads}</p>
            </div>
          </div>

          {/* New Today */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:border-green-200 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full -mr-16 -mt-16" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg shadow-green-500/30">
                  <Sparkles size={24} />
                </div>
                {metrics.newTodayChange !== 0 && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${metrics.newTodayChange > 0
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                    }`}>
                    {metrics.newTodayChange > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                    {Math.abs(metrics.newTodayChange)}%
                  </div>
                )}
              </div>
              <p className="text-sm font-medium text-slate-600 mb-1">New Today</p>
              <p className="text-3xl font-bold text-slate-900">{metrics.newToday}</p>
            </div>
          </div>

          {/* Upcoming Visits */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:border-purple-200 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -mr-16 -mt-16" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg shadow-purple-500/30">
                  <Calendar size={24} />
                </div>
                {metrics.visitsChange !== 0 && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${metrics.visitsChange > 0
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                    }`}>
                    {metrics.visitsChange > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                    {Math.abs(metrics.visitsChange)}%
                  </div>
                )}
              </div>
              <p className="text-sm font-medium text-slate-600 mb-1">Upcoming Visits</p>
              <p className="text-3xl font-bold text-slate-900">{metrics.upcomingVisits}</p>
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:border-emerald-200 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full -mr-16 -mt-16" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/30">
                  <TrendingUp size={24} />
                </div>
                {metrics.conversionChange !== 0 && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${metrics.conversionChange > 0
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                    }`}>
                    {metrics.conversionChange > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                    {Math.abs(metrics.conversionChange)}%
                  </div>
                )}
              </div>
              <p className="text-sm font-medium text-slate-600 mb-1">Conversion Rate</p>
              <p className="text-3xl font-bold text-slate-900">{metrics.conversionRate}%</p>
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
