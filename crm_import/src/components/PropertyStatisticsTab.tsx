"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, Users, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface PropertyStatisticsTabProps {
    stats: {
        totalUnits: number;
        available: number;
        reserved: number;
        negotiation: number;
        booked: number;
        blocked: number;
        occupancyRate: number;
    };
}

export default function PropertyStatisticsTab({ stats }: PropertyStatisticsTabProps) {
    const pipelineCount = stats.negotiation + stats.reserved;
    const bookedRatio = stats.totalUnits > 0 ? (stats.booked / stats.totalUnits * 100).toFixed(0) : 0;
    const availableRatio = stats.totalUnits > 0 ? (stats.available / stats.totalUnits * 100).toFixed(0) : 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* 1️⃣ Key Metrics Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    label="Available Units"
                    value={stats.available}
                    subtext={`${((stats.available / stats.totalUnits) * 100).toFixed(1)}% of total`}
                    theme="green"
                    icon={CheckCircle}
                />
                <MetricCard
                    label="Booked Scale"
                    value={stats.booked}
                    subtext={`${((stats.booked / stats.totalUnits) * 100).toFixed(1)}% sold`}
                    theme="indigo"
                    icon={TrendingUp}
                />
                <MetricCard
                    label="Pipeline (Reserved)"
                    value={stats.reserved}
                    subtext={`${((stats.reserved / stats.totalUnits) * 100).toFixed(1)}% pending`}
                    theme="amber"
                    icon={Clock}
                />
                <MetricCard
                    label="Occupancy Rate"
                    value={`${stats.occupancyRate.toFixed(1)}%`}
                    subtext={`${stats.booked + stats.reserved} occupied units`}
                    theme="purple"
                    icon={Users}
                />
            </div>

            {/* 2️⃣ Status Distribution */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                    <h3 className="text-sm font-semibold text-slate-900 tracking-tight">Status Distribution</h3>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-md">Live Data</span>
                </div>
                <div className="p-6 space-y-5">
                    <DistributionRow label="Available" value={stats.available} total={stats.totalUnits} color="bg-emerald-500" bg="bg-emerald-50" textColor="text-emerald-700" />
                    <DistributionRow label="Reserved" value={stats.reserved} total={stats.totalUnits} color="bg-amber-500" bg="bg-amber-50" textColor="text-amber-700" />
                    <DistributionRow label="In Negotiation" value={stats.negotiation} total={stats.totalUnits} color="bg-sky-500" bg="bg-sky-50" textColor="text-sky-700" />
                    <DistributionRow label="Booked (Sold)" value={stats.booked} total={stats.totalUnits} color="bg-indigo-500" bg="bg-indigo-50" textColor="text-indigo-700" />
                    <DistributionRow label="Blocked" value={stats.blocked} total={stats.totalUnits} color="bg-rose-500" bg="bg-rose-50" textColor="text-rose-700" />
                </div>
            </div>

            {/* 3️⃣ Mini Insight Strip */}
            <div className="flex flex-wrap gap-3">
                <InsightPill text={`Most units are ${getMostCommonStatus(stats)}`} />
                <InsightPill text={`${pipelineCount} active deals in pipeline`} />
                <InsightPill text={`Booked/Available Ratio: ${bookedRatio}:${availableRatio}`} />
            </div>
        </div>
    );
}

// Sub-components for cleanliness
function MetricCard({ label, value, subtext, theme, icon: Icon }: any) {
    const themeClasses: any = {
        green: "bg-emerald-50/50 border-emerald-100 text-emerald-900 hover:border-emerald-200 hover:shadow-emerald-50",
        indigo: "bg-indigo-50/50 border-indigo-100 text-indigo-900 hover:border-indigo-200 hover:shadow-indigo-50",
        amber: "bg-amber-50/50 border-amber-100 text-amber-900 hover:border-amber-200 hover:shadow-amber-50",
        purple: "bg-purple-50/50 border-purple-100 text-purple-900 hover:border-purple-200 hover:shadow-purple-50",
    };

    const iconColors: any = {
        green: "text-emerald-600 bg-emerald-100",
        indigo: "text-indigo-600 bg-indigo-100",
        amber: "text-amber-600 bg-amber-100",
        purple: "text-purple-600 bg-purple-100",
    };

    return (
        <div className={cn(
            "rounded-xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group",
            themeClasses[theme] || "bg-white border-slate-200"
        )}>
            <div className="flex justify-between items-start mb-4">
                <div className={cn("p-2 rounded-lg", iconColors[theme])}>
                    <Icon size={18} />
                </div>
            </div>
            <div>
                <div className="text-3xl font-bold tracking-tight mb-1">{value}</div>
                <div className="text-sm font-medium opacity-90">{label}</div>
                <div className="text-xs opacity-60 mt-1">{subtext}</div>
            </div>
        </div>
    );
}

function DistributionRow({ label, value, total, color, bg, textColor }: any) {
    const percentage = ((value / total) * 100) || 0;
    return (
        <div>
            <div className="flex items-center justify-between text-sm mb-2">
                <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", color)}></span>
                    <span className="text-slate-600 font-medium">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", bg, textColor)}>
                        {value} units
                    </span>
                    <span className="text-slate-400 text-xs w-10 text-right">{percentage.toFixed(1)}%</span>
                </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                    className={cn("h-full rounded-full transition-all duration-500", color)}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

function InsightPill({ text }: { text: string }) {
    return (
        <div className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600 flex items-center gap-1.5">
            <AlertCircle size={12} className="text-slate-400" />
            {text}
        </div>
    );
}

function getMostCommonStatus(stats: any) {
    const map = [
        { name: 'Available', val: stats.available },
        { name: 'Reserved', val: stats.reserved },
        { name: 'Booked', val: stats.booked },
        { name: 'Blocked', val: stats.blocked },
    ];
    return map.sort((a, b) => b.val - a.val)[0].name;
}
