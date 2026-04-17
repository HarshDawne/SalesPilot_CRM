"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Layers, Info, Check, Lock, XCircle,
    FileText, Download, X, File, Clock, Filter
} from 'lucide-react';
import { DEMO_PROPERTIES } from '@/data/demoProperties';
import { UNIT_STATUS_CONFIG } from '@/lib/types/properties';

export default function TowerUnitsPage() {
    const params = useParams();
    const propertyId = params.id as string;
    const towerId = params.towerId as string;

    const [property, setProperty] = useState<any>(null);
    const [tower, setTower] = useState<any>(null);

    // State for Documents Drawer
    const [selectedUnit, setSelectedUnit] = useState<any | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        const prop = DEMO_PROPERTIES.find(p => p.id === propertyId);
        if (prop) {
            setProperty(prop);
            const t = prop.towers.find((t: any) => t.id === towerId);
            setTower(t);
        }
    }, [propertyId, towerId]);

    if (!tower) return <div className="p-12 text-center text-slate-500">Loading tower data...</div>;

    // Generate floors descending
    const totalFloors = tower.floors || 20;
    const floorsArray = Array.from({ length: totalFloors }, (_, i) => totalFloors - i);

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
                                {tower.units?.length || 0}
                            </span>
                        </button>

                        <div className="w-[1px] h-4 bg-slate-200 mx-1"></div>

                        {/* Status Pillars */}
                        {Object.entries(UNIT_STATUS_CONFIG).map(([key, config]) => {
                            const count = tower.units?.filter((u: any) => (u.status || 'available').toLowerCase() === key).length || 0;
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
                    {floorsArray.map(floor => {
                        const existingUnits = tower.units.filter((u: any) => u.floor === floor);

                        // Mock generation if empty to ensure high fidelity demo look
                        let displayUnits = existingUnits.length > 0 ? existingUnits : Array.from({ length: 4 }, (_, i) => ({
                            id: `gen_${floor}_${i}`,
                            unitNo: `${tower.name.substring(0, 1)}${floor}0${i + 1}`,
                            bhk: (i % 2 === 0) ? '3 BHK' : '2 BHK',
                            status: 'available',
                            carpetArea: (i % 2 === 0) ? 1850 : 1250,
                            price: (i % 2 === 0) ? 25000000 : 15000000,
                            facing: (i === 0) ? 'North' : 'East'
                        }));

                        // Filter by status if not "all"
                        if (statusFilter !== 'all') {
                            displayUnits = displayUnits.filter((u: any) => (u.status || 'available').toLowerCase() === statusFilter);
                        }

                        if (displayUnits.length === 0 && statusFilter !== 'all') return null;

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
                                        {displayUnits.map((unit: any) => (
                                            <UnitGridCard
                                                key={unit.id}
                                                unit={unit}
                                                onViewDocs={() => setSelectedUnit({ ...unit, towerName: tower.name })}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
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

function UnitGridCard({ unit, onViewDocs }: { unit: any, onViewDocs: () => void }) {
    const normalizedStatus = (unit.status || 'available').toLowerCase() as keyof typeof UNIT_STATUS_CONFIG;
    const config = UNIT_STATUS_CONFIG[normalizedStatus] || UNIT_STATUS_CONFIG.available;

    const statusIcons = {
        available: <Check size={12} className="text-emerald-600" />,
        booked: <Clock size={12} className="text-blue-600" />,
        sold: <XCircle size={12} className="text-slate-400" />,
        blocked: <Lock size={12} className="text-amber-600" />
    };

    const icon = statusIcons[normalizedStatus] || statusIcons.available;

    return (
        <div className={`
            relative group rounded-lg border p-3 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 bg-white
            ${config.bg} ${config.border} ${config.text}
        `}>
            {/* Header */}
            <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-sm tracking-tight">{unit.unitNo}</span>
                {icon}
            </div>

            <div className="text-xs font-medium opacity-80 mb-3">{unit.bhk}</div>

            {/* Builder Actions */}
            <button
                onClick={(e) => { e.stopPropagation(); onViewDocs(); }}
                className="w-full py-1.5 px-2 bg-white/50 hover:bg-white border border-black/5 hover:border-black/20 rounded text-[10px] font-bold uppercase tracking-wide text-slate-600 transition-colors flex items-center justify-center gap-1.5"
            >
                <FileText size={10} /> View Docs
            </button>

            {/* Tooltip (Hover) */}
            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 text-white text-xs p-3 rounded-lg shadow-xl pointer-events-none z-20">
                <div className="font-bold text-sm mb-1">{unit.unitNo} • {unit.bhk}</div>
                <div className="space-y-1 opacity-90">
                    <div className="flex justify-between text-slate-500"><span>Area:</span> <span className="text-slate-200">{unit.carpetArea} sqft</span></div>
                    <div className="flex justify-between text-slate-500"><span>Price:</span> <span className="text-emerald-400">₹ {(unit.price / 10000000).toFixed(2)} Cr</span></div>
                    <div className="flex justify-between text-slate-500"><span>Facing:</span> <span className="text-slate-200">{unit.facing}</span></div>
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

function DocumentSheet({ unit, onClose }: { unit: any, onClose: () => void }) {
    if (!unit) return null;

    // Mock Documents based on unit logic
    const mockDocs = [
        { name: "Floor Plan - Type A", type: "PDF", size: "2.4 MB" },
        { name: `Unit ${unit.unitNo} Layout`, type: "PDF", size: "1.1 MB" },
        { name: "RERA Certificate", type: "PDF", size: "850 KB" }
    ];

    if (unit.status === 'SOLD') {
        mockDocs.push({ name: "Sale Agreement (Draft)", type: "DOCX", size: "45 KB" });
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={onClose}></div>

            {/* Drawer */}
            <div className="relative w-full max-w-md bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                    <div>
                        <div className="text-xs font-bold text-copper uppercase tracking-wider mb-1">{unit.towerName}</div>
                        <h2 className="text-2xl font-bold text-slate-900 font-heading">Unit {unit.unitNo}</h2>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-xs font-bold">{unit.bhk}</span>
                            <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-xs font-bold">{unit.carpetArea} sqft</span>
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
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-center">
                    <button onClick={onClose} className="text-xs font-bold text-slate-500 hover:text-slate-800">Close Panel</button>
                </div>
            </div>
        </div>
    );
}
