"use client";

import { BarChart3, TrendingUp, Users, Wallet } from "lucide-react";

export default function AnalyticsPage() {
    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-full">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Manager Command Center</h1>
                    <p className="text-slate-500">Real-time performance metrics</p>
                </div>
                <div className="flex gap-2">
                    <select className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none">
                        <option>Last 30 Days</option>
                        <option>This Week</option>
                        <option>Today</option>
                    </select>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Revenue', value: '₹ 24.5 Cr', change: '+12%', icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-100' },
                    { label: 'Active Leads', value: '1,240', change: '+5%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
                    { label: 'Site Visits', value: '85', change: '+18%', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
                    { label: 'Conversion Rate', value: '3.2%', change: '-0.5%', icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-100' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.change.startsWith('+') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {stat.change}
                            </span>
                        </div>
                        <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                        <div className="text-sm text-slate-500">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Funnel Chart Mock */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-6">Lead Conversion Funnel</h3>
                    <div className="space-y-4">
                        {[
                            { label: 'Total Leads', value: '1000', pct: '100%', color: 'bg-blue-100' },
                            { label: 'Qualified', value: '450', pct: '45%', color: 'bg-blue-200' },
                            { label: 'Site Visits', value: '120', pct: '12%', color: 'bg-blue-300' },
                            { label: 'Negotiations', value: '60', pct: '6%', color: 'bg-blue-500' },
                            { label: 'Bookings', value: '25', pct: '2.5%', color: 'bg-indigo-600' },
                        ].map((step, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm font-medium mb-1">
                                    <span className="text-slate-600">{step.label}</span>
                                    <span className="text-slate-900">{step.value} ({step.pct})</span>
                                </div>
                                <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${step.color}`} style={{ width: step.pct }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-6">Top Performers</h3>
                    <div className="space-y-4">
                        {[
                            { name: 'Sarah Wilson', role: 'Senior Manager', sales: '₹ 4.2 Cr', deals: 3 },
                            { name: 'Rajesh Kumar', role: 'Sales Executive', sales: '₹ 2.8 Cr', deals: 2 },
                            { name: 'Priya Singh', role: 'Sales Associate', sales: '₹ 1.5 Cr', deals: 1 },
                        ].map((agent, i) => (
                            <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                                        {agent.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900">{agent.name}</div>
                                        <div className="text-xs text-slate-500">{agent.role}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-indigo-600">{agent.sales}</div>
                                    <div className="text-xs text-slate-400">{agent.deals} Deals</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
