'use client';

import { useState } from 'react';
import { Property, Tower, Unit, PropertyDocument, UnitStatus } from '@/types/property';
import PropertyHeader from './PropertyHeader';
import TowerGrid from './TowerGrid';
import UnitGrid from './UnitGrid';
import { Building2, Home, Image as ImageIcon, Wallet } from 'lucide-react';
import AssetManager from './AssetManager';


interface PropertyDetailViewProps {
    property: Property;
    towers: Tower[];
    units: Unit[];
    documents?: PropertyDocument[];
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

type TabType = 'overview' | 'towers' | 'units' | 'media';


export default function PropertyDetailView({ property, towers, units, documents = [], stats }: PropertyDetailViewProps) {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [filterUnitsByStatus, setFilterUnitsByStatus] = useState<UnitStatus | 'ALL'>('ALL');
    const [filterUnitsByTower, setFilterUnitsByTower] = useState<string>('all');

    // Calculate Revenue Stats
    const revenueStats = {
        bookedValue: units.filter(u => u.status === UnitStatus.BOOKED).reduce((sum, u) => sum + (u.totalPrice || 0), 0),
        availableValue: units.filter(u => [UnitStatus.AVAILABLE, UnitStatus.RESERVED, UnitStatus.NEGOTIATION].includes(u.status)).reduce((sum, u) => sum + (u.totalPrice || 0), 0),
    };

    const handleChipClick = (status: UnitStatus | 'ALL') => {
        setFilterUnitsByStatus(status);
        setActiveTab('units');
        setFilterUnitsByTower('all');
    };

    const handleTowerClick = (towerId: string) => {
        setFilterUnitsByTower(towerId);
        setActiveTab('units');
        setFilterUnitsByStatus('ALL');
    };

    const tabs = [
        { id: 'overview' as TabType, label: 'Overview', icon: Building2 },
        { id: 'towers' as TabType, label: 'Towers', icon: Building2, count: towers.length },
        { id: 'units' as TabType, label: 'Units', icon: Home, count: units.length },
        { id: 'media' as TabType, label: 'Media', icon: ImageIcon },

    ];

    const formatCurrency = (amount: number) => {
        if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
        return `₹${amount.toLocaleString()}`;
    };

    return (
        <div className="space-y-6">
            {/* Property Header */}
            <PropertyHeader property={property} units={units} />

            {/* Tabs */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/90">
                <nav className="flex space-x-8 px-6 max-w-7xl mx-auto" aria-label="Tabs">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    group flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-all
                                    ${isActive
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                                    }
                                `}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                {tab.label}
                                {tab.count !== undefined && (
                                    <span className={`
                                        ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide
                                        ${isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}
                                    `}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6 max-w-7xl mx-auto">
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {/* Inventory Insights Section (New) */}
                        <div className="premium-card p-6">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-indigo-500" />
                                Inventory Health
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <div className="text-xs font-semibold text-emerald-800 uppercase mb-1">Available</div>
                                    <div className="text-2xl font-bold text-emerald-700">{property.availableUnits}</div>
                                    <div className="w-full bg-emerald-200 h-1.5 rounded-full mt-3 overflow-hidden">
                                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(property.availableUnits / property.totalUnits) * 100}%` }} />
                                    </div>
                                </div>
                                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                    <div className="text-xs font-semibold text-indigo-800 uppercase mb-1">Booked</div>
                                    <div className="text-2xl font-bold text-indigo-700">{property.bookedUnits}</div>
                                    <div className="w-full bg-indigo-200 h-1.5 rounded-full mt-3 overflow-hidden">
                                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${(property.bookedUnits / property.totalUnits) * 100}%` }} />
                                    </div>
                                </div>
                                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                                    <div className="text-xs font-semibold text-orange-800 uppercase mb-1">Reserved</div>
                                    <div className="text-2xl font-bold text-orange-700">{stats.reserved || 0}</div>
                                    <div className="w-full bg-orange-200 h-1.5 rounded-full mt-3 overflow-hidden">
                                        <div className="bg-orange-500 h-full rounded-full" style={{ width: `${((stats.reserved || 0) / property.totalUnits) * 100}%` }} />
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Total Inventory</div>
                                    <div className="text-2xl font-bold text-slate-900">{property.totalUnits}</div>
                                    <div className="text-xs text-slate-400 mt-2">100% Tracking</div>
                                </div>
                            </div>

                            {/* Drilldown Chips */}
                            <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-slate-100">
                                <button onClick={() => handleChipClick('ALL')} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold uppercase hover:bg-slate-200 transition-colors">
                                    All Units ({property.totalUnits})
                                </button>
                                <button onClick={() => handleChipClick(UnitStatus.AVAILABLE)} className="px-4 py-2 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold uppercase hover:bg-emerald-200 transition-colors">
                                    Available ({property.availableUnits})
                                </button>
                                <button onClick={() => handleChipClick(UnitStatus.RESERVED)} className="px-4 py-2 rounded-lg bg-orange-100 text-orange-700 text-xs font-bold uppercase hover:bg-orange-200 transition-colors">
                                    In Pipeline ({(stats.reserved || 0) + (stats.negotiation || 0)})
                                </button>
                                <button onClick={() => handleChipClick(UnitStatus.BOOKED)} className="px-4 py-2 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold uppercase hover:bg-indigo-200 transition-colors">
                                    Booked ({property.bookedUnits})
                                </button>
                            </div>
                        </div>

                        {/* Revenue Snapshot (New) */}
                        <div className="premium-card p-6 bg-gradient-to-r from-indigo-50 to-white border-indigo-100">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Wallet className="w-4 h-4 text-indigo-500" />
                                Revenue Snapshot
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Total Sales (Booked)</div>
                                    <div className="text-2xl font-bold text-indigo-700">{formatCurrency(revenueStats.bookedValue)}</div>
                                </div>
                                <div>
                                    <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Unsold Inventory Value</div>
                                    <div className="text-2xl font-bold text-slate-700">{formatCurrency(revenueStats.availableValue)}</div>
                                </div>
                                <div>
                                    <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Booked Units</div>
                                    <div className="text-2xl font-bold text-slate-900">{property.bookedUnits} <span className="text-slate-400 text-lg font-normal">/ {property.totalUnits}</span></div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2">
                                <h2 className="text-lg font-bold text-slate-900 mb-4">Location & Address</h2>
                                <div className="premium-card p-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">City</label>
                                            <div className="font-medium text-slate-900">{property.location.city}</div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Locality/Area</label>
                                            <div className="font-medium text-slate-900">{property.location.locality}</div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Pincode</label>
                                            <div className="font-medium text-slate-900">{property.location.pincode}</div>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-slate-100">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Full Address</label>
                                        <p className="text-slate-700 leading-relaxed">{property.location.fullAddress}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-lg font-bold text-slate-900 mb-4">Project Stats</h2>
                                <div className="premium-card p-6 space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                        <span className="text-slate-500 text-sm">Towers</span>
                                        <span className="font-bold text-slate-900">{property.totalTowers}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                        <span className="text-slate-500 text-sm">Total Units</span>
                                        <span className="font-bold text-slate-900">{property.totalUnits}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                        <span className="text-slate-500 text-sm">Occupancy</span>
                                        <span className="font-bold text-blue-600">{((property.bookedUnits / property.totalUnits) * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 pt-4">
                                        <span className="text-slate-500 text-sm">RERA ID</span>
                                        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{property.reraId || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'towers' && (
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">All Towers</h2>
                        <TowerGrid towers={towers} onTowerClick={(tower) => handleTowerClick(tower.id)} />
                    </div>
                )}

                {activeTab === 'units' && (
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">All Units</h2>
                        <UnitGrid
                            units={units}
                            towers={towers}
                            documents={documents}
                            externalStatusFilter={filterUnitsByStatus}
                            externalTowerFilter={filterUnitsByTower}
                        />
                    </div>
                )}





                {activeTab === 'media' && (
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Media & Assets</h2>
                        <AssetManager level="property" id={property.id} />
                    </div>
                )}
            </div>
        </div>

    );
}
