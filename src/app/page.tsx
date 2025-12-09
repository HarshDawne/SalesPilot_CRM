"use client";

import { useState, useEffect } from 'react';
import Link from "next/link";
import {
  Activity,
  TrendingUp,
  Users,
  Calendar,
  Megaphone,
  ArrowRight,
  DollarSign,
  Zap,
  MapPin,
  Building2
} from "lucide-react";

export default function RevenueCommandCenter() {
  // KPI State
  const [stats, setStats] = useState({
    inventoryValue: 0,
    activeLeads: 0,
    visitsThisWeek: 0,
    deadStockCount: 0
  });

  const [recentactivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    // Fetch KPIs from API
    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard/stats');
        const data = await res.json();
        setStats(data);
      } catch (e) {
        console.error("Failed to fetch dashboard stats", e);
      }
    }
    fetchStats();

    // Seed initial mock activities
    setRecentActivities([
      { id: 1, type: 'call', text: 'AI Agent "Sarah" called Lead #492', time: 'Just now', icon: Users, color: 'text-blue-500' },
      { id: 2, type: 'visit', text: 'Visit Confirmed: Unit 304 (Tower A)', time: '2 mins ago', icon: Calendar, color: 'text-emerald-500' },
      { id: 3, type: 'view', text: 'Lead #401 viewed "Penthouse 3D Tour"', time: '5 mins ago', icon: Zap, color: 'text-amber-500' },
      { id: 4, type: 'campaign', text: 'Campaign "Summer Sale" reached 45 leads', time: '10 mins ago', icon: Megaphone, color: 'text-purple-500' },
    ]);

    // Simulate Live Feed
    const interval = setInterval(() => {
      const actions = [
        { type: 'call', text: 'AI Agent "Sarah" engaging new lead...', icon: Users, color: 'text-blue-500' },
        { type: 'view', text: 'Lead browsing "Sky Villa" specs...', icon: Zap, color: 'text-amber-500' },
        { type: 'visit', text: 'New Site Visit Request received!', icon: Calendar, color: 'text-emerald-500' },
      ];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];

      setRecentActivities(prev => [
        { ...randomAction, id: Date.now(), time: 'Just now' },
        ...prev.slice(0, 4)
      ]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumSignificantDigits: 3 }).format(val);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="max-w-7xl mx-auto p-6 space-y-8">

        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-bold mb-1">
              <Activity size={18} className="animate-pulse" />
              <span className="text-xs uppercase tracking-wider">System Operational</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Revenue Command Center</h1>
            <p className="text-slate-500 mt-2">Real-time oversight of inventory, campaigns, and conversions.</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/campaigns/new"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
            >
              <Megaphone size={18} />
              Launch Campaign
            </Link>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <DollarSign size={64} className="text-indigo-600" />
            </div>
            <div className="text-sm font-medium text-slate-500 mb-2">Total Inventory Value</div>
            <div className="text-3xl font-bold text-slate-900">{formatCurrency(stats.inventoryValue)}</div>
            <div className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
              <TrendingUp size={12} /> +2.4% vs last month
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users size={64} className="text-blue-600" />
            </div>
            <div className="text-sm font-medium text-slate-500 mb-2">Active Hot Leads</div>
            <div className="text-3xl font-bold text-slate-900">{stats.activeLeads}</div>
            <div className="text-xs text-blue-600 font-medium mt-2">
              Ready for outreach
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Calendar size={64} className="text-emerald-600" />
            </div>
            <div className="text-sm font-medium text-slate-500 mb-2">Visits This Week</div>
            <div className="text-3xl font-bold text-slate-900">{stats.visitsThisWeek}</div>
            <div className="text-xs text-emerald-600 font-medium mt-2">
              5 confirmed today
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Building2 size={64} className="text-red-500" />
            </div>
            <div className="text-sm font-medium text-slate-500 mb-2">Dead Stock Alert</div>
            <div className="text-3xl font-bold text-slate-900">{stats.deadStockCount}</div>
            <div className="text-xs text-red-500 font-medium mt-2 flex items-center gap-1">
              Units unsold &gt; 90 days
            </div>
          </div>
        </div>

        {/* Main Dashboard Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Live Pulse Feed */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-full">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="text-indigo-600" size={20} />
                <h3 className="font-bold text-slate-900">Live Activity Feed</h3>
              </div>
              <div className="space-y-6">
                {recentactivities.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className={`mt-1 h-3 w-3 rounded-full shrink-0 ${item.color.replace('text-', 'bg-')}`} />
                    <div>
                      <p className="text-sm font-medium text-slate-800 leading-snug">
                        {item.text}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <item.icon size={12} /> {item.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions & Charts Placeholder */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Link href="/leads" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                <Users size={24} />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Lead Management</h3>
              <p className="text-slate-500 text-sm mt-1">View dialer lists and follow-ups</p>
            </Link>

            <Link href="/calendar" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                <Calendar size={24} />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Site Visits</h3>
              <p className="text-slate-500 text-sm mt-1">Manage today&apos;s schedule</p>
            </Link>

            <Link href="/properties" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                <Building2 size={24} />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Inventory</h3>
              <p className="text-slate-500 text-sm mt-1">Update unit status & pricing</p>
            </Link>

            <div className="bg-slate-900 p-6 rounded-2xl text-white">
              <div className="flex items-center gap-2 mb-2 text-indigo-400 font-bold">
                <Zap size={18} />
                <span className="text-xs uppercase tracking-wider">AI Insights</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                &quot;High conversion detected in <strong>Skyline Towers</strong> (3BHK). Recommend increasing ad spend in Mumbai South.&quot;
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
