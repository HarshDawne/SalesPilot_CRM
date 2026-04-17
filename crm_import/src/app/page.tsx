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
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-emerald">
                <Activity size={12} className="animate-pulse" />
                System Operational
              </span>
            </div>
            <h1 className="text-5xl font-bold font-heading text-gradient-emerald tracking-tight">Revenue Command Center</h1>
            <p className="text-slate-600 mt-3 text-lg">Real-time oversight of inventory, campaigns, and conversions.</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/campaigns/new"
              className="btn-primary flex items-center gap-2 shadow-xl hover-glow-emerald"
            >
              <Megaphone size={18} />
              Launch Campaign
            </Link>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="premium-card-emerald p-7 relative overflow-hidden group micro-lift hover-glow-emerald">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <DollarSign size={72} className="text-emerald-600" />
            </div>
            <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">Total Inventory Value</div>
            <div className="text-4xl font-bold font-heading text-slate-900 mb-2">{formatCurrency(stats.inventoryValue)}</div>
            <div className="badge-success text-[10px] font-bold">
              <TrendingUp size={10} /> +2.4% vs last month
            </div>
          </div>

          <div className="premium-card-emerald p-7 relative overflow-hidden group micro-lift hover-glow-emerald">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Users size={72} className="text-emerald-600" />
            </div>
            <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">Active Hot Leads</div>
            <div className="text-4xl font-bold font-heading text-slate-900 mb-2">{stats.activeLeads}</div>
            <div className="text-xs text-slate-500 font-semibold">
              Ready for outreach
            </div>
          </div>

          <div className="premium-card-emerald p-7 relative overflow-hidden group micro-lift hover-glow-emerald">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Calendar size={72} className="text-emerald-600" />
            </div>
            <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">Visits This Week</div>
            <div className="text-4xl font-bold font-heading text-slate-900 mb-2">{stats.visitsThisWeek}</div>
            <div className="text-xs text-slate-500 font-semibold">
              5 confirmed today
            </div>
          </div>

          <div className="premium-card p-7 border-t-4 border-t-red-500 relative overflow-hidden group micro-lift">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Building2 size={72} className="text-red-500" />
            </div>
            <div className="text-xs font-bold text-red-600 uppercase tracking-widest mb-3">Dead Stock Alert</div>
            <div className="text-4xl font-bold font-heading text-slate-900 mb-2">{stats.deadStockCount}</div>
            <div className="badge-danger text-[10px] font-bold">
              Units unsold &gt; 90 days
            </div>
          </div>
        </div>

        {/* Main Dashboard Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Live Pulse Feed */}
          <div className="lg:col-span-1 space-y-6">
            <div className="premium-card p-7 h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Activity size={18} />
                </div>
                <h3 className="font-bold font-heading text-slate-900 text-lg">Live Activity Feed</h3>
              </div>
              <div className="space-y-5">
                {recentactivities.map((item) => (
                  <div key={item.id} className="flex gap-4 animate-slide-up">
                    <div className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${item.color.replace('text-', 'bg-')} shadow-[0_0_8px_currentColor]`} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800 leading-snug">
                        {item.text}
                      </p>
                      <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5 font-medium">
                        <item.icon size={11} className="opacity-60" /> {item.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions & Charts Placeholder */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Link href="/leads" className="premium-card p-6 hover-glow-emerald micro-lift group">
              <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 rounded-xl w-fit mb-4 micro-scale">
                <Users size={24} />
              </div>
              <h3 className="font-bold font-heading text-slate-900 text-lg mb-1">Lead Management</h3>
              <p className="text-slate-500 text-sm leading-relaxed">View dialer lists and follow-ups</p>
            </Link>

            <Link href="/calendar" className="premium-card p-6 hover-glow-emerald micro-lift group">
              <div className="p-3.5 bg-gradient-to-br from-teal-50 to-emerald-50 text-teal-600 rounded-xl w-fit mb-4 micro-scale">
                <Calendar size={24} />
              </div>
              <h3 className="font-bold font-heading text-slate-900 text-lg mb-1">Site Visits</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Manage today&apos;s schedule</p>
            </Link>

            <Link href="/properties" className="premium-card p-6 hover-glow-emerald micro-lift group">
              <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 rounded-xl w-fit mb-4 micro-scale">
                <Building2 size={24} />
              </div>
              <h3 className="font-bold font-heading text-slate-900 text-lg mb-1">Inventory</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Update unit status & pricing</p>
            </Link>

            <div className="gradient-dark-emerald p-6 rounded-2xl text-white border border-emerald-800/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="badge-gold">
                  <Zap size={11} />
                  AI Insights
                </span>
              </div>
              <p className="text-emerald-50 text-sm leading-relaxed font-medium">
                &quot;High conversion detected in <strong className="text-emerald-300">Skyline Towers</strong> (3BHK). Recommend increasing ad spend in Mumbai South.&quot;
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
