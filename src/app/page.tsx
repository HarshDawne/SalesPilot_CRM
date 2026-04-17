"use client";

import { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  TrendingUp,
  Users,
  Calendar,
  Zap,
  Building2,
  DollarSign,
  ArrowUpRight,
  Target,
  Sparkles,
  ChevronRight,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function RevenueCommandCenter() {
  // KPI State
  const [stats, setStats] = useState({
    inventoryValue: 0,
    activeLeads: 0,
    visitsThisWeek: 0,
    conversionRate: 0,
    performanceMatrix: [] as any[]
  });

  const [loading, setLoading] = useState(true);
  const [recentactivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    // 1. Fetch Real Stats
    const fetchStats = async () => {
        try {
            const res = await fetch('/api/dashboard/stats');
            const data = await res.json();
            if (!data.error) {
                setStats(prev => ({
                    ...prev,
                    ...data,
                    performanceMatrix: data.performanceMatrix || []
                }));
            }
        } catch (error) {
            console.error("Failed to fetch dashboard stats:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchStats();

    // 2. Initial mock activities
    setRecentActivities([
      { id: 1, type: 'call', text: 'AI Agent "Nova" engaging high-intent Lead #492', time: 'Just now', icon: Target, status: 'Active' },
      { id: 2, type: 'visit', text: 'Tower A (Unit 304) - Physical Visit Confirmed', time: '2 mins ago', icon: Calendar, status: 'Ready' },
      { id: 3, type: 'view', text: 'Penthouse B: Microsite behavior showing checkout intent', time: '5 mins ago', icon: Zap, status: 'Hot' },
      { id: 4, type: 'campaign', text: 'Strategy "Alpha": +15% conversion lift detected', time: '10 mins ago', icon: TrendingUp, status: 'Optimal' },
    ]);

    // Simulate Live Feed
    const interval = setInterval(() => {
      const actions = [
        { type: 'call', text: 'AI closing sequence initiated for Lead #801', icon: Target, status: 'Critical' },
        { type: 'view', text: 'Microsite: 15 active viewers in Tower B', icon: Activity, status: 'Active' },
        { type: 'negotiation', text: 'Digital offer received for Unit 1201', icon: DollarSign, status: 'Hot' },
      ];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];

      setRecentActivities(prev => [
        { ...randomAction, id: Date.now(), time: 'Just now' },
        ...prev.slice(0, 3)
      ]);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR', 
      notation: 'compact',
      maximumSignificantDigits: 3 
    }).format(val);
  };

  const [clientMatrix, setClientMatrix] = useState<any[]>([]);

  useEffect(() => {
    if (!stats.performanceMatrix || stats.performanceMatrix.length === 0) {
        setClientMatrix(Array.from({ length: 12 }).map((_, i) => ({
            week: `W${i + 1}`,
            actual: Math.round(15 + Math.pow(i, 1.8) * 1.5 + Math.random() * 5),
            projected: Math.round(20 + Math.pow(i, 1.7) * 1.6)
        })));
    }
  }, [stats.performanceMatrix]);

  const displayMatrix = useMemo(() => {
    if (stats.performanceMatrix && stats.performanceMatrix.length > 0) {
        return stats.performanceMatrix;
    }
    return clientMatrix.length > 0 ? clientMatrix : Array.from({ length: 12 }).map((_, i) => ({
        week: `W${i + 1}`,
        actual: Math.round(15 + Math.pow(i, 1.8) * 1.5),
        projected: Math.round(20 + Math.pow(i, 1.7) * 1.6)
    }));
  }, [stats.performanceMatrix, clientMatrix]);

  const chartMax = useMemo(() => {
    if (!displayMatrix.length) return 100;
    return Math.max(...displayMatrix.map(d => Math.max(d.actual, d.projected))) * 1.1;
  }, [displayMatrix]);

  const toHeight = (val: number) => Math.max(4, Math.round((val / chartMax) * 100));

  return (
    <div className="max-w-[1440px] mx-auto p-6 lg:p-10 space-y-10 focus:outline-hidden">
      
      {/* 1. Header & Strategy Toggle */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em]">
                <div className="w-1.5 h-1.5 rounded-full bg-ai-accent animate-pulse"></div>
                Command Center v3.0 // Ready
            </div>
            <h1 className="text-4xl font-black text-text-main tracking-tighter">
                Revenue <span className="text-secondary">Intelligence</span>
            </h1>
            <p className="text-sm text-text-secondary font-medium max-w-xl">
                Real-time liquidity and intent orchestration across 4 active property projects.
            </p>
        </div>
        
        <div className="flex items-center gap-3">
           <button className="px-5 py-2.5 bg-white border border-border-subtle rounded-lg text-xs font-bold text-text-secondary hover:text-primary hover:border-primary transition-all flex items-center gap-2">
              <Clock size={14} />
              Viewing: Today
           </button>
        </div>
      </header>

      {/* 2. Zone A: Strategic Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          label="Gross Inventory Value" 
          value={loading ? "..." : formatCurrency(stats.inventoryValue)} 
          delta="+2.4%" 
          icon={<Building2 className="text-primary" />}
          subtext="Total Liquidity"
        />
        <KPICard 
          label="Conversion Probability" 
          value={loading ? "..." : `${stats.conversionRate.toFixed(1)}%`} 
          delta="+0.8%" 
          icon={<TrendingUp className="text-ai-accent" />}
          subtext="Predicted Yield"
        />
        <KPICard 
          label="High-Intent Pipeline" 
          value={loading ? "..." : stats.activeLeads.toString()} 
          delta="+12" 
          icon={<Target className="text-secondary" />}
          subtext="Active Engagements"
        />
        <KPICard 
          label="Site Visit Accuracy" 
          value={loading ? "..." : (stats.visitsThisWeek > 0 ? "98.2%" : "N/A")} 
          delta="Stable" 
          icon={<Calendar className="text-text-main" />}
          subtext="SLA Adherence"
        />
      </div>

      {/* 3. Zone B & C: Performance Matrix & Activity Pulse */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Performance Matrix */}
        <div className="xl:col-span-8 card-premium p-8 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h3 className="text-xl font-bold text-text-main font-heading">Performance Matrix</h3>
                    <p className="text-text-secondary text-xs font-medium">Weekly revenue velocity vs campaign intensity</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-200 border border-slate-300"></div>
                        <span className="text-[10px] font-bold text-text-secondary uppercase">Projected</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-ai-accent"></div>
                        <span className="text-[10px] font-bold text-text-secondary uppercase">Actual</span>
                    </div>
                </div>
            </div>

            {/* Technical Data Viz (Dynamic) */}
            <div className="h-64 flex items-stretch justify-between gap-3 px-2">
                {displayMatrix.map((data, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2 group/bar">
                        <div className="w-full relative h-[80%] flex flex-col justify-end">
                            {/* Tooltip on hover */}
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover/bar:flex flex-col items-center z-50 pointer-events-none">
                                <div className="bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded-md whitespace-nowrap shadow-lg">
                                    <div>Actual: {data.actual}</div>
                                    <div className="text-slate-400">Target: {data.projected}</div>
                                </div>
                                <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 -mt-1"></div>
                            </div>
                            {/* Projected Bar (behind) */}
                            <div 
                                className="absolute bottom-0 w-full bg-slate-100 border border-slate-200 rounded-t-lg transition-all duration-1000"
                                style={{ height: `${toHeight(data.projected)}%` }}
                            ></div>
                            {/* Actual Bar (front) */}
                            <div 
                                className="relative w-[70%] mx-auto bg-primary rounded-t-lg transition-all duration-700 group-hover/bar:bg-secondary"
                                style={{ height: `${toHeight(data.actual)}%` }}
                            ></div>
                        </div>
                        <span className="text-[8px] font-black text-slate-400">{data.week}</span>
                    </div>
                ))}
            </div>
            
            <div className="mt-8 pt-8 border-t border-border-subtle grid grid-cols-3 gap-8">
                <MiniIndicator label="Mean Acquisition Cost" value="₹12.4k" color="primary" />
                <MiniIndicator label="Decision Cycle (Avg)" value="9.2 Days" color="ai-accent" />
                <MiniIndicator label="AI Agent Effectiveness" value="94.8%" color="secondary" />
            </div>
        </div>

        {/* Live Ops Pulse */}
        <div className="xl:col-span-4 card-premium p-0 flex flex-col bg-white">
            <div className="p-6 border-b border-border-subtle flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity size={16} className="text-primary animate-pulse" />
                    <h3 className="text-sm font-bold text-text-main uppercase tracking-widest">Live Ops Pulse</h3>
                </div>
                <button className="text-[10px] font-black text-secondary hover:underline transition-all">REPLAY FEED</button>
            </div>

            <div className="flex-1 p-5 space-y-4">
                {recentactivities.map((activity, idx) => (
                    <div key={activity.id} className={cn(
                        "p-4 rounded-xl border transition-all duration-300 flex items-start gap-4 cursor-pointer",
                        idx === 0 
                            ? "bg-slate-50 border-primary/10 shadow-sm" 
                            : "bg-white border-transparent hover:border-border-subtle hover:bg-slate-50"
                    )}>
                        <div className={cn(
                            "p-2 rounded-lg bg-white border border-border-subtle text-text-main shadow-xs",
                            idx === 0 && "border-primary/20 text-primary"
                        )}>
                            <activity.icon size={14} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] font-black text-text-secondary uppercase tracking-widest">{activity.time}</span>
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter",
                                    activity.status === 'Hot' ? "bg-red-50 text-red-600" :
                                    activity.status === 'Active' ? "bg-blue-50 text-blue-600" : 
                                    "bg-blue-50 text-primary"
                                )}>
                                    {activity.status}
                                </span>
                            </div>
                            <p className="text-xs font-bold text-text-main leading-snug">{activity.text}</p>
                        </div>
                    </div>
                ))}
            </div>

            <button className="p-4 bg-slate-50 border-t border-border-subtle text-center text-[10px] font-bold text-text-secondary hover:text-primary hover:bg-white transition-all">
                VIEW GLOBAL LOG
            </button>
        </div>

      </div>
    </div>
  );
}

function KPICard({ label, value, delta, icon, subtext }: { label: string, value: string, delta: string, icon: React.ReactNode, subtext: string }) {
    return (
        <div className="card-premium p-6 group hover:border-primary/30">
            <div className="flex items-start justify-between mb-6">
                <div className="p-2.5 bg-slate-50 border border-border-subtle rounded-xl group-hover:bg-primary/5 transition-colors">
                    {icon}
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-100">
                    {delta}
                </div>
            </div>
            
            <div className="space-y-1">
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest leading-none">{label}</p>
                <h2 className="text-2xl font-black text-text-main tracking-tighter leading-none">{value}</h2>
                <p className="text-[11px] text-text-secondary font-medium pt-1 opacity-60">{subtext}</p>
            </div>
        </div>
    );
}

function MiniIndicator({ label, value, color }: { label: string, value: string, color: string }) {
    const colorClass = color === 'primary' ? 'bg-primary' : color === 'secondary' ? 'bg-secondary' : 'bg-ai-accent';
    return (
        <div className="space-y-2">
            <p className="text-[9px] font-black text-text-secondary uppercase tracking-[0.1em]">{label}</p>
            <div className="flex items-center gap-2">
                <div className={cn("w-1 h-3 rounded-full", colorClass)}></div>
                <span className="text-sm font-bold text-text-main">{value}</span>
            </div>
        </div>
    );
}
