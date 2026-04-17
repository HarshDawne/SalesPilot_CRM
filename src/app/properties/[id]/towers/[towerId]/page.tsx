"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Layers, Info, Check, Lock, XCircle,
    FileText, Download, X, File, Clock, Filter, Phone
} from 'lucide-react';
import { UNIT_STATUS_CONFIG } from '@/lib/types/properties';
import type { Tower, Unit, Property } from '@/types/property';

export default function TowerUnitsPage() {
    const params = useParams();
    const router = useRouter();
    const propertyId = params.id as string;
    const towerId = params.towerId as string;

    const [property, setProperty] = useState<Property | null>(null);
    const [tower, setTower] = useState<Tower | null>(null);
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);

    // State for Documents Drawer
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);

                // Fetch tower data
                const towerRes = await fetch(`/api/towers/${towerId}`);
                if (!towerRes.ok) throw new Error('Tower not found');
                const towerData = await towerRes.json();
                setTower(towerData.tower);

                // Fetch property data
                const propRes = await fetch(`/api/properties/${propertyId}`);
                if (propRes.ok) {
                    const propData = await propRes.json();
                    setProperty(propData.property);
                }

                // Fetch units for this tower ONLY
                const unitsRes = await fetch(`/api/units?towerId=${towerId}`);
                if (unitsRes.ok) {
                    const unitsData = await unitsRes.json();
                    setUnits(unitsData.units || []);
                }
            } catch (error) {
                console.error('Error fetching tower data:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [propertyId, towerId]);

    if (loading) return <div className="p-12 text-center text-slate-500">Loading tower data...</div>;
    if (!tower) return <div className="p-12 text-center text-slate-500">Tower not found</div>;

    // Calculate metrics
    const totalUnits = units.length;
    const availableUnits = units.filter(u => u.status === 'AVAILABLE').length;
    const reservedUnits = units.filter(u => u.status === 'RESERVED').length;
    const bookedUnits = units.filter(u => u.status === 'BOOKED').length;

    // Group units by floor
    const unitsByFloor = units.reduce((acc, unit) => {
        if (!acc[unit.floor]) acc[unit.floor] = [];
        acc[unit.floor].push(unit);
        return acc;
    }, {} as Record<number, Unit[]>);

    // Get floors in descending order
    const floors = Object.keys(unitsByFloor)
        .map(Number)
        .sort((a, b) => b - a);

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
            <div className="max-w-[1400px] mx-auto">

                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Link href={`/properties/${propertyId}/towers`} className="text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors">
                                Towers
                            </Link>
                            <span className="text-slate-300">/</span>
                            <span className="text-slate-900 text-sm font-medium">{tower.name}</span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 font-heading">{tower.name} Inventory</h1>
                        {property && (
                            <p className="text-sm text-slate-500 mt-1">
                                {property.name} • {totalUnits} Total Units • {availableUnits} Available
                            </p>
                        )}
                    </div>

                    {/* Campaign Creation Button */}
                    <button
                        onClick={() => router.push(`/communication/create?towerId=${towerId}&propertyId=${propertyId}`)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all"
                    >
                        <Phone className="w-4 h-4" />
                        Create AI Campaign
                    </button>
                </div>

                {/* Filters & Legend (Interactive Pills) */}
                <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                    {/* All Filter */}
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`
                                flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                                ${statusFilter === 'all'
                                ? 'bg-slate-900 text-white shadow-md'
                                : 'hover:bg-slate-100 text-slate-500'}
                            `}
                    >
                        All Units
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${statusFilter === 'all' ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>
                            {totalUnits}
                        </span>
                    </button>

                    <div className="w-[1px] h-4 bg-slate-200 mx-1"></div>

                    {/* Status Pillars */}
                    {Object.entries(UNIT_STATUS_CONFIG).map(([key, config]) => {
                        const count = units.filter(u => u.status.toLowerCase() === key.toLowerCase()).length;
                        const isActive = statusFilter === key;

                        return (
                            <button
                                key={key}
                                onClick={() => setStatusFilter(key)}
                                className={`
                                        flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border
                                        ${isActive
                                        ? `${config.bg} ${config.border} ${config.text} shadow-sm ring-1 ring-offset-0 ring-${config.color}-400/20`
                                        : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}
                                    `}
                            >
                                <div className={`w-2 h-2 rounded-full ${config.dot} ${isActive ? 'animate-pulse' : 'opacity-60'}`}></div>
                                <span>{config.label}</span>
                                <span className={`
                                        px-1.5 py-0.5 rounded text-[10px]
                                        ${isActive ? 'bg-white/40' : 'bg-slate-50 text-slate-400'}
                                    `}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>


            {/* Floors Grid */}
            <div className="space-y-4">
                {floors.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                        <Layers className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Units Found</h3>
                        <p className="text-slate-500">
                            {statusFilter !== 'all'
                                ? `No ${statusFilter} units in this tower.`
                                : 'This tower has no units yet.'}
                        </p>
                    </div>
                ) : (
                    floors.map(floor => {
                        const floorUnits = unitsByFloor[floor];

                        // Filter by status if not "all"
                        const displayUnits = statusFilter !== 'all'
                            ? floorUnits.filter(u => u.status.toLowerCase() === statusFilter.toLowerCase())
                            : floorUnits;

                        if (displayUnits.length === 0) return null;

                        return (
                            <div key={floor} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex">
                                {/* Floor Label */}
                                <div className="w-24 bg-slate-50 border-r border-slate-200 flex flex-col items-center justify-center p-4">
                                    <Layers className="text-slate-400 mb-1" size={20} />
                                    <span className="text-xl font-bold text-slate-900">{floor}</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Floor</span>
                                </div>

                                {/* Units Grid */}
                                <div className="flex-1 p-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        {displayUnits.map((unit) => (
                                            <UnitGridCard
                                                key={unit.id}
                                                unit={unit}
                                                onViewDocs={() => setSelectedUnit(unit)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Documents Drawer */}
            <DocumentSheet
                unit={selectedUnit}
                onClose={() => setSelectedUnit(null)}
            />
        </div>
    );
}

// ----------------------------------------------------------------------
// SUB COMPONENT: Unit Grid Card (Builder Style)
// ----------------------------------------------------------------------

function UnitGridCard({ unit, onViewDocs }: { unit: Unit, onViewDocs: () => void }) {
    const normalizedStatus = unit.status.toLowerCase() as keyof typeof UNIT_STATUS_CONFIG;
    const config = UNIT_STATUS_CONFIG[normalizedStatus] || UNIT_STATUS_CONFIG.available;

    const statusIcons: Record<string, React.ReactNode> = {
        available: <Check size={12} className="text-emerald-600" />,
        booked: <Clock size={12} className="text-blue-600" />,
        reserved: <Lock size={12} className="text-amber-600" />,
        negotiation: <Info size={12} className="text-blue-500" />,
        blocked: <XCircle size={12} className="text-slate-400" />,
        sold: <Check size={12} className="text-slate-400" />
    };

    const icon = statusIcons[normalizedStatus] || statusIcons.available;

    // Format unit type display
    const displayType = unit.type;

    return (
        <div className={`
            relative group rounded-lg border p-3 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 bg-white
            ${config.bg} ${config.border} ${config.text}
        `}>
            {/* Header */}
            <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-sm tracking-tight">{unit.unitNumber}</span>
                {icon}
            </div>

            <div className="text-xs font-medium opacity-80 mb-3">{displayType}</div>

            {/* Builder Actions */}
            <button
                onClick={(e) => { e.stopPropagation(); onViewDocs(); }}
                className="w-full py-1.5 px-2 bg-white/50 hover:bg-white border border-black/5 hover:border-black/20 rounded text-[10px] font-bold uppercase tracking-wide text-slate-600 transition-colors flex items-center justify-center gap-1.5"
            >
                <FileText size={10} /> View Details
            </button>

            {/* Tooltip (Hover) */}
            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 text-white text-xs p-3 rounded-lg shadow-xl pointer-events-none z-20">
                <div className="font-bold text-sm mb-1">{unit.unitNumber} • {displayType}</div>
                <div className="space-y-1 opacity-90">
                    <div className="flex justify-between text-slate-400"><span>Carpet:</span> <span className="text-slate-200">{unit.carpetArea} sqft</span></div>
                    <div className="flex justify-between text-slate-400"><span>Built-up:</span> <span className="text-slate-200">{unit.builtUpArea} sqft</span></div>
                    <div className="flex justify-between text-slate-400"><span>Price:</span> <span className="text-emerald-400">₹ {(unit.totalPrice / 10000000).toFixed(2)} Cr</span></div>
                    {unit.facing && <div className="flex justify-between text-slate-400"><span>Facing:</span> <span className="text-slate-200">{unit.facing}</span></div>}
                    <div className="pt-1 mt-1 border-t border-slate-800 font-bold uppercase text-[10px] tracking-wider text-center">
                        {unit.status}
                    </div>
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// SUB COMPONENT: Document Drawer (Right Sheet)
// ----------------------------------------------------------------------

function DocumentSheet({ unit, onClose }: { unit: Unit | null, onClose: () => void }) {
    const params = useParams();
    const router = useRouter();
    const propertyId = params.id as string;

    if (!unit) return null;

    // Mock Documents based on unit logic (will be replaced with real documents later)
    const mockDocs = [
        { name: "Floor Plan - Type A", type: "PDF", size: "2.4 MB" },
        { name: `Unit ${unit.unitNumber} Layout`, type: "PDF", size: "1.1 MB" },
        { name: "RERA Certificate", type: "PDF", size: "850 KB" }
    ];

    if (unit.status === 'BOOKED') {
        mockDocs.push({ name: "Booking Agreement (Draft)", type: "DOCX", size: "45 KB" });
    }

    const displayType = unit.type;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={onClose}></div>

            {/* Drawer */}
            <div className="relative w-full max-w-md bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                    <div>
                        <div className="text-xs font-bold text-copper uppercase tracking-wider mb-1">Floor {unit.floor}</div>
                        <h2 className="text-2xl font-bold text-slate-900 font-heading">Unit {unit.unitNumber}</h2>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-xs font-bold">{displayType}</span>
                            <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-xs font-bold">{unit.carpetArea} sqft</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${unit.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' :
                                unit.status === 'BOOKED' ? 'bg-blue-100 text-blue-700' :
                                    unit.status === 'RESERVED' ? 'bg-amber-100 text-amber-700' :
                                        'bg-slate-100 text-slate-700'
                                }`}>{unit.status}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                        Attached Documents
                    </h3>

                    <div className="space-y-3">
                        {mockDocs.map((doc, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-copper/40 hover:bg-orange-50/30 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-white group-hover:text-copper transition-colors shadow-sm">
                                        <File size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800 text-sm">{doc.name}</div>
                                        <div className="text-xs text-slate-400 font-medium">{doc.type} • {doc.size}</div>
                                    </div>
                                </div>
                                <button className="p-2 text-slate-400 hover:text-copper transition-colors">
                                    <Download size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <h4 className="font-bold text-slate-900 text-xs mb-2 flex items-center gap-2">
                            <Info size={14} className="text-copper" />
                            Internal Notes
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            This unit is currently {unit.status.toLowerCase()}. Verify all documents before proceeding with any new allocation. Pricing valid until Dec 31st.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-3">
                    <button 
                        onClick={() => router.push(`/communication/create?propertyId=${propertyId}&unitId=${unit.id}`)}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-bold shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                    >
                        <Phone size={18} />
                        Launch AI Campaign
                    </button>
                    <button onClick={onClose} className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest">
                        Close Unit Details
                    </button>
                </div>
            </div>
        </div>
    );
}
