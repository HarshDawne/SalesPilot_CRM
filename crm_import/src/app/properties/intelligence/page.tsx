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
                <h1 className="text-[36px] font-bold font-heading text-charcoal">Inventory Intelligence</h1>
                <p className="text-muted mt-2 text-lg">Real-time insights into stock velocity and health.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="kpi-card border-t-4 border-t-red-500">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                            <AlertTriangle size={24} />
                        </div>
                        <span className="badge-danger text-[10px] font-bold">ACTION REQUIRED</span>
                    </div>
                    <div>
                        <div className="text-xs font-bold text-red-600 uppercase tracking-widest mb-2">Dead Stock (90+ Days)</div>
                        <div className="kpi-card__number text-red-900 mb-2">{data.deadStockCount} Units</div>
                        <div className="kpi-card__label">Value: {formatCurrency(data.deadStockValue)}</div>
                    </div>
                </div>

                <div className="kpi-card border-t-4 border-t-copper">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-gradient-to-br from-orange-50 to-amber-50 text-copper rounded-xl">
                            <TrendingUp size={24} />
                        </div>
                        <span className="badge-copper text-[10px] font-bold">+12% vs last month</span>
                    </div>
                    <div>
                        <div className="text-xs font-bold text-copper uppercase tracking-widest mb-2">Sales Velocity</div>
                        <div className="kpi-card__number mb-2">{data.monthlyVelocity} Units</div>
                        <div className="kpi-card__label">Sold in last 30 days</div>
                    </div>
                </div>

                <div className="kpi-card border-t-4 border-t-copper">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-gradient-to-br from-orange-50 to-amber-50 text-copper rounded-xl">
                            <DollarSign size={24} />
                        </div>
                    </div>
                    <div>
                        <div className="text-xs font-bold text-copper uppercase tracking-widest mb-2">Projected Revenue</div>
                        <div className="kpi-card__number mb-2">{formatCurrency(data.deadStockValue * 0.1)}</div>
                        <div className="kpi-card__label">If 10% of dead stock clears</div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Dead Stock Action Center */}
                <div className="premium-card overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-transparent">
                        <h3 className="font-bold font-heading text-slate-900 text-lg flex items-center gap-2">
                            <div className="p-1.5 bg-red-50 text-red-500 rounded-lg">
                                <AlertTriangle size={16} />
                            </div>
                            Stagnant Inventory
                        </h3>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                        {data.deadStockUnits.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 font-medium">No stagnant inventory found! Great job.</div>
                        ) : (
                            data.deadStockUnits.map((unit) => (
                                <div key={unit.id} className="p-5 hover:bg-emerald-50/30 transition-all flex justify-between items-center group">
                                    <div>
                                        <div className="font-bold text-slate-900">{unit.unitNumber} • <span className="text-slate-600 font-semibold">{unit.type.replace('_', ' ')}</span></div>
                                        <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-3">
                                            <span className="badge-neutral text-[10px]">{unit.daysOnMarket} days on market</span>
                                            <span className="font-semibold">{formatCurrency(unit.price)}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => alert(`Starting campaign for Unit ${unit.unitNumber}`)}
                                        className="opacity-0 group-hover:opacity-100 transition-all btn-primary px-4 py-2 text-xs flex items-center gap-1.5 shadow-md hover-glow-emerald"
                                    >
                                        <Megaphone size={13} /> Boost
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Property Health Stats */}
                <div className="premium-card overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50/50 to-transparent">
                        <h3 className="font-bold font-heading text-slate-900 text-lg flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                                <Building2 size={16} />
                            </div>
                            Portfolio Health
                        </h3>
                    </div>
                    <div className="p-6 space-y-6">
                        {data.propertyStats.map((property) => (
                            <div key={property.id} className="p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                                <div className="flex justify-between text-sm mb-3">
                                    <span className="font-bold font-heading text-slate-900">{property.name}</span>
                                    <span className="badge-emerald text-[10px]">{property.occupancyRate.toFixed(1)}% Sold</span>
                                </div>
                                <div className="h-3 bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full" style={{ width: `${(property.booked / property.totalUnits) * 100}%` }} title="Booked"></div>
                                    <div className="bg-gradient-to-r from-amber-400 to-amber-500 h-full" style={{ width: `${(property.reservation / property.totalUnits) * 100}%` }} title="Reserved"></div>
                                    <div className="bg-slate-300 h-full" style={{ width: `${(property.available / property.totalUnits) * 100}%` }} title="Available"></div>
                                </div>
                                <div className="flex gap-4 mt-3 text-xs text-slate-600 font-medium">
                                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Booked: {property.booked}</div>
                                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div> Reserved: {property.reserved}</div>
                                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div> Available: {property.available}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
