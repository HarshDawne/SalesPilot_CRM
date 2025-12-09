"use client";

import { useState, useEffect } from "react";
import {
    LayoutDashboard,
    AlertTriangle,
    TrendingUp,
    DollarSign,
    BarChart3,
    ArrowRight,
    Megaphone,
    Building2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface IntelligenceData {
    deadStockCount: number;
    deadStockValue: number;
    monthlyVelocity: number;
    propertyStats: any[];
    deadStockUnits: any[];
}

export default function InventoryIntelligencePage() {
    const [data, setData] = useState<IntelligenceData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/inventory/intelligence')
            .then(res => res.json())
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-8">Loading Intelligence...</div>;
    if (!data) return <div className="p-8">Failed to load data.</div>;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold font-heading text-slate-900">Inventory Intelligence</h1>
                <p className="text-slate-500 mt-1">Real-time insights into stock velocity and health.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                            <AlertTriangle size={24} />
                        </div>
                        <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-1 rounded-full">ACTION REQUIRED</span>
                    </div>
                    <div>
                        <div className="text-slate-500 text-sm font-medium uppercase tracking-wider">Dead Stock (90+ Days)</div>
                        <div className="text-3xl font-bold text-slate-900 mt-1">{data.deadStockCount} Units</div>
                        <div className="text-sm text-slate-400 mt-1">Value: {formatCurrency(data.deadStockValue)}</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">+12% vs last month</span>
                    </div>
                    <div>
                        <div className="text-slate-500 text-sm font-medium uppercase tracking-wider">Sales Velocity</div>
                        <div className="text-3xl font-bold text-slate-900 mt-1">{data.monthlyVelocity} Units</div>
                        <div className="text-sm text-slate-400 mt-1">Sold in last 30 days</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <DollarSign size={24} />
                        </div>
                    </div>
                    <div>
                        <div className="text-slate-500 text-sm font-medium uppercase tracking-wider">projected Revenue</div>
                        <div className="text-3xl font-bold text-slate-900 mt-1">{formatCurrency(data.deadStockValue * 0.1)}</div>
                        <div className="text-sm text-slate-400 mt-1">If 10% of dead stock clears</div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Dead Stock Action Center */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <AlertTriangle size={18} className="text-red-500" />
                            Stagnant Inventory
                        </h3>
                        <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                            View All <ArrowRight size={16} />
                        </button>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                        {data.deadStockUnits.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">No stagnant inventory found! Great job.</div>
                        ) : (
                            data.deadStockUnits.map((unit) => (
                                <div key={unit.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center group">
                                    <div>
                                        <div className="font-semibold text-slate-900">{unit.unitNumber} • {unit.type.replace('_', ' ')}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">
                                            {unit.daysOnMarket} days on market • {formatCurrency(unit.price)}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => alert(`Starting campaign for Unit ${unit.unitNumber}`)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-sm"
                                    >
                                        <Megaphone size={12} /> Boost
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Property Health Stats */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Building2 size={18} className="text-slate-500" />
                            Portfolio Health
                        </h3>
                    </div>
                    <div className="p-6 space-y-6">
                        {data.propertyStats.map((property) => (
                            <div key={property.id}>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-medium text-slate-900">{property.name}</span>
                                    <span className="text-slate-500">{property.occupancyRate.toFixed(1)}% Sold</span>
                                </div>
                                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                                    <div className="bg-emerald-500 h-full" style={{ width: `${(property.booked / property.totalUnits) * 100}%` }} title="Booked"></div>
                                    <div className="bg-orange-400 h-full" style={{ width: `${(property.reservation / property.totalUnits) * 100}%` }} title="Reserved"></div>
                                    <div className="bg-slate-300 h-full" style={{ width: `${(property.available / property.totalUnits) * 100}%` }} title="Available"></div>
                                </div>
                                <div className="flex gap-4 mt-2 text-xs text-slate-500">
                                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Booked: {property.booked}</div>
                                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-400"></div> Reserved: {property.reserved}</div>
                                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-300"></div> Available: {property.available}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
