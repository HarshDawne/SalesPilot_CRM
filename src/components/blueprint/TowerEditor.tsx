"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { BlueprintTower, BlueprintUnit, UnitStatus } from '@/lib/types/blueprint';
import {
    ArrowLeft, Check, Lock, XCircle, Pencil, X, LayoutGrid,
    Layers, FileText, Filter, Wand2, RefreshCw, Clock, Plus as PlusIcon,
    MousePointer2, Settings2, Trash2, CheckCircle2, AlertCircle
} from 'lucide-react';
import { UnitEditorModal } from './UnitEditorModal';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';

interface TowerEditorProps {
    propertyId: string;
    propertyName: string;
    builderName: string;
    tower: BlueprintTower;
    onBack: () => void;
    isReadOnly?: boolean;
    onUpdateConfig: (updates: Partial<BlueprintTower>) => void;
    onUpdateUnit: (towerId: string, unitId: string, updates: Partial<BlueprintUnit>) => void;
}

export function TowerEditor({
    propertyId,
    propertyName,
    builderName,
    tower,
    onBack,
    isReadOnly = false,
    onUpdateConfig,
    onUpdateUnit
}: TowerEditorProps) {
    const [selectedUnit, setSelectedUnit] = useState<BlueprintUnit | null>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editingName, setEditingName] = useState(tower.name);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedUnitIds, setSelectedUnitIds] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    const [unitMix, setUnitMix] = useState<any[]>([
        { configuration: '2 BHK', carpetArea: 1050, builtUpArea: 1200, count: 4, basePrice: 12000 }
    ]);

    const generateGrid = () => {
        const floors = tower.totalFloors || 10;
        const perFloor = tower.unitsPerFloor || 4;
        const start = tower.startingUnitNumber || 101;
        const units: BlueprintUnit[] = [];

        // Mix for demo screenshots
        const demoStatuses = ['AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'BOOKED', 'SOLD', 'BLOCKED', 'BOOKED'];

        for (let f = 1; f <= floors; f++) {
            let unitInFloorIdx = 0;
            unitMix.forEach(mixItem => {
                for (let i = 0; i < mixItem.count; i++) {
                    if (unitInFloorIdx >= perFloor) break;
                    
                    const unitNum = start + (f - 1) * 100 + unitInFloorIdx;
                    const basePrice = mixItem.basePrice || 12000;
                    const floorRise = 50; 
                    const totalPrice = (basePrice + (f > 5 ? floorRise * (f - 5) : 0)) * mixItem.builtUpArea;
                    const status = demoStatuses[Math.floor(Math.random() * demoStatuses.length)] as any;

                    units.push({
                        id: uuidv4(),
                        unitNumber: unitNum.toString(),
                        floor: f,
                        type: 'Apartment',
                        status: status,
                        configuration: mixItem.configuration,
                        carpetArea: mixItem.carpetArea,
                        builtUpArea: mixItem.builtUpArea,
                        superBuiltUpArea: mixItem.builtUpArea * 1.35,
                        basePrice,
                        floorRise,
                        plcCharges: 0,
                        totalPrice,
                        facing: 'East',
                        documents: [],
                        renders: [],
                        renderRequests: []
                    });
                    unitInFloorIdx++;
                }
            });
            
            while (unitInFloorIdx < perFloor) {
                const unitNum = start + (f - 1) * 100 + unitInFloorIdx;
                const status = demoStatuses[Math.floor(Math.random() * demoStatuses.length)] as any;

                units.push({
                    id: uuidv4(), unitNumber: unitNum.toString(), floor: f, type: 'Apartment', status: status,
                    configuration: '2 BHK', carpetArea: 1050, builtUpArea: 1200, superBuiltUpArea: 1620,
                    basePrice: 12000, floorRise: 50, plcCharges: 0, totalPrice: 14400000, facing: 'East',
                    documents: [], renders: [], renderRequests: []
                });
                unitInFloorIdx++;
            }
        }

        setIsGenerating(true);
        setTimeout(() => {
            onUpdateConfig({ units });
            setIsGenerating(false);
            setSelectedUnitIds(new Set());
        }, 150);
    };

    const STATUS_CONFIG = {
        AVAILABLE: { label: 'Available', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
        BOOKED: { label: 'Booked', dot: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
        SOLD: { label: 'Sold', dot: 'bg-slate-400', text: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' },
        BLOCKED: { label: 'Blocked', dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' }
    };

    const toggleUnitSelection = (id: string) => {
        const next = new Set(selectedUnitIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedUnitIds(next);
        if (next.size > 0) setIsSelectionMode(true);
        else setIsSelectionMode(false);
    };

    const bulkUpdateStatus = (status: UnitStatus) => {
        selectedUnitIds.forEach(id => {
            onUpdateUnit(tower.id, id, { status });
        });
        setSelectedUnitIds(new Set());
        setIsSelectionMode(false);
    };

    const filteredUnits = useMemo(() => 
        statusFilter === 'ALL' ? tower.units : tower.units.filter(u => u.status === statusFilter)
    , [tower.units, statusFilter]);

    const unitsByFloor = useMemo(() => 
        filteredUnits.reduce((acc, unit) => {
            if (!acc[unit.floor]) acc[unit.floor] = [];
            acc[unit.floor].push(unit);
            return acc;
        }, {} as Record<number, BlueprintUnit[]>)
    , [filteredUnits]);

    const sortedFloors = useMemo(() => 
        Object.keys(unitsByFloor).map(Number).sort((a, b) => b - a)
    , [unitsByFloor]);

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            {/* STICKY ENTERPRISE HEADER */}
            <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-[1800px] mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={onBack} 
                            className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-200 transition-all"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        
                        <div className="w-px h-10 bg-slate-100"></div>

                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Blueprint Terminal</span>
                                <span className="text-slate-200">/</span>
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Structure X-Ray</span>
                            </div>
                            {isEditingName ? (
                                <input
                                    autoFocus
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    onBlur={() => {
                                        if (editingName.trim() && editingName !== tower.name) onUpdateConfig({ name: editingName.trim() });
                                        setIsEditingName(false);
                                    }}
                                    className="bg-slate-50 border border-emerald-400 text-xl font-black text-slate-900 px-2 py-0 rounded focus:outline-none"
                                />
                            ) : (
                                <h2
                                    onClick={() => !isReadOnly && setIsEditingName(true)}
                                    className="text-xl font-black text-slate-900 cursor-pointer hover:text-emerald-600 transition-colors flex items-center gap-2 group"
                                >
                                    {tower.name}
                                    {!isReadOnly && <Pencil size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300" />}
                                </h2>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Status Filter Hub */}
                        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-200">
                            <button
                                onClick={() => setStatusFilter('ALL')}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    statusFilter === 'ALL' ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                Total {tower.units.length}
                            </button>
                            <div className="w-px h-4 bg-slate-200 mx-1"></div>
                            {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                                const count = tower.units.filter(u => u.status === key).length;
                                const isActive = statusFilter === key;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => setStatusFilter(key)}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                            isActive ? `${config.bg} ${config.text} border ${config.border} shadow-sm` : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        <div className={cn("w-2 h-2 rounded-full", config.dot)}></div>
                                        {config.label} {count}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Config Inputs */}
                        <div className="flex items-center gap-3">
                            <ConfigBlock label="Levels" value={tower.totalFloors} onChange={(v) => onUpdateConfig({ totalFloors: v })} disabled={isReadOnly} />
                            <ConfigBlock label="Units/Lv" value={tower.unitsPerFloor} onChange={(v) => onUpdateConfig({ unitsPerFloor: v })} disabled={isReadOnly} />
                        </div>

                        {!isReadOnly && (
                            <button
                                onClick={generateGrid}
                                disabled={isGenerating}
                                className="h-12 flex items-center gap-3 px-6 bg-slate-900 hover:bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 transition-all disabled:opacity-50"
                            >
                                {isGenerating ? <RefreshCw className="animate-spin" size={14} /> : <Wand2 size={14} className="text-emerald-400" />}
                                {tower.units.length > 0 ? 'Force Rebuild' : 'Initialize Inventory'}
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* BULK ACTION PANEL */}
            {isSelectionMode && !isReadOnly && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-300">
                    <div className="bg-slate-900 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-8 border border-white/10 backdrop-blur-xl">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Bulk Selection</span>
                            <span className="text-sm font-bold">{selectedUnitIds.size} Units Selected</span>
                        </div>
                        <div className="w-px h-8 bg-white/10"></div>
                        <div className="flex items-center gap-2">
                            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                <button
                                    key={key}
                                    onClick={() => bulkUpdateStatus(key as UnitStatus)}
                                    className="px-4 py-2 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2"
                                >
                                    <div className={cn("w-2 h-2 rounded-full", config.dot)}></div>
                                    {config.label}
                                </button>
                            ))}
                        </div>
                        <div className="w-px h-8 bg-white/10"></div>
                        <button 
                            onClick={() => { setSelectedUnitIds(new Set()); setIsSelectionMode(false); }}
                            className="p-2 hover:bg-red-500/20 text-red-400 rounded-full transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* MIX BUILDER */}
            {!isReadOnly && tower.units.length === 0 && (
                <div className="bg-white border-b border-slate-200 px-8 py-6">
                    <div className="max-w-[1800px] mx-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <Settings2 size={18} className="text-slate-900" />
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Inventory Mix Matrix</h3>
                            </div>
                            <div className="px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                Allocation: <span className={unitMix.reduce((s, i) => s + i.count, 0) === tower.unitsPerFloor ? 'text-emerald-600' : 'text-amber-600'}>
                                    {unitMix.reduce((s, i) => s + i.count, 0)} / {tower.unitsPerFloor} Units per Floor
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-4">
                            {unitMix.map((mix, idx) => (
                                <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-3xl flex items-center gap-6 group hover:border-emerald-500/30 transition-all">
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Asset Config</span>
                                        <select 
                                            value={mix.configuration}
                                            onChange={(e) => {
                                                const next = [...unitMix];
                                                next[idx].configuration = e.target.value;
                                                setUnitMix(next);
                                            }}
                                            className="bg-transparent text-sm font-black text-slate-900 outline-none"
                                        >
                                            <option>1 BHK</option><option>2 BHK</option><option>3 BHK</option><option>4 BHK</option><option>Studio</option><option>Penthouse</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">RERA Area (sqft)</span>
                                        <input 
                                            type="number" 
                                            value={mix.carpetArea}
                                            onChange={(e) => {
                                                const next = [...unitMix];
                                                next[idx].carpetArea = parseInt(e.target.value);
                                                setUnitMix(next);
                                            }}
                                            className="bg-transparent w-20 text-sm font-black text-slate-900 outline-none"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Units / Lv</span>
                                        <input 
                                            type="number" 
                                            value={mix.count}
                                            onChange={(e) => {
                                                const next = [...unitMix];
                                                next[idx].count = parseInt(e.target.value);
                                                setUnitMix(next);
                                            }}
                                            className="bg-transparent w-16 text-sm font-black text-slate-900 outline-none"
                                        />
                                    </div>
                                    {unitMix.length > 1 && (
                                        <button 
                                            onClick={() => setUnitMix(unitMix.filter((_, i) => i !== idx))}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-white rounded-xl transition-all"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button 
                                onClick={() => setUnitMix([...unitMix, { configuration: '3 BHK', carpetArea: 1400, builtUpArea: 1600, count: 1, basePrice: 14000 }])}
                                className="px-6 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 hover:border-emerald-500 hover:text-emerald-500 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                            >
                                <PlusIcon size={16} /> Asset Type
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* UNIT CANVAS */}
            <main className="flex-1 overflow-auto p-12">
                <div className="max-w-[1800px] mx-auto space-y-8">
                    {sortedFloors.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 shadow-inner">
                            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 text-slate-200">
                                <LayoutGrid size={48} strokeWidth={1.5} />
                            </div>
                            <h4 className="text-xl font-black text-slate-900 mb-2">Inventory Null</h4>
                            <p className="text-slate-400 text-sm mb-8 text-center max-w-sm">Define your tower structure and asset mix to generate the live interactive grid.</p>
                            {!isReadOnly && (
                                <button
                                    onClick={generateGrid}
                                    className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-3"
                                >
                                    <Wand2 size={16} />
                                    Launch Matrix Generator
                                </button>
                            )}
                        </div>
                    ) : sortedFloors.map((floorNum) => (
                        <div key={floorNum} className="flex gap-8 group/floor">
                            {/* Floor Sidebar */}
                            <div className="w-28 shrink-0">
                                <div className="sticky top-28 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center transition-all group-hover/floor:border-emerald-200">
                                    <div className="text-3xl font-black text-slate-900 leading-none mb-2">{floorNum}</div>
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Level</div>
                                </div>
                            </div>

                            {/* Assets Grid */}
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                                {unitsByFloor[floorNum].map(unit => (
                                    <UnitCard
                                        key={unit.id}
                                        unit={unit}
                                        isSelected={selectedUnitIds.has(unit.id)}
                                        onSelect={(e) => {
                                            if (e.shiftKey || isSelectionMode) {
                                                e.stopPropagation();
                                                toggleUnitSelection(unit.id);
                                            } else {
                                                setSelectedUnit(unit);
                                            }
                                        }}
                                        onContextSelect={(e) => {
                                            e.preventDefault();
                                            toggleUnitSelection(unit.id);
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {selectedUnit && (
                <UnitEditorModal
                    propertyId={propertyId}
                    towerId={tower.id}
                    unit={selectedUnit}
                    isReadOnly={isReadOnly}
                    onClose={() => setSelectedUnit(null)}
                    onSave={(updates) => {
                        onUpdateUnit(tower.id, selectedUnit.id, updates);
                        setSelectedUnit(null);
                    }}
                />
            )}
        </div>
    );
}

function ConfigBlock({ label, value, onChange, disabled }: { label: string, value: number, onChange: (val: number) => void, disabled: boolean }) {
    const [local, setLocal] = useState(value.toString());
    useEffect(() => setLocal(value.toString()), [value]);

    return (
        <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2 flex flex-col items-center justify-center min-w-[100px] shadow-sm">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</span>
            <input
                type="text"
                value={local}
                disabled={disabled}
                onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '');
                    setLocal(v);
                    if (v) onChange(parseInt(v, 10));
                }}
                className="bg-transparent text-center text-base font-black text-slate-900 outline-none w-full"
            />
        </div>
    );
}

function UnitCard({ unit, isSelected, onSelect, onContextSelect }: { unit: BlueprintUnit, isSelected: boolean, onSelect: (e: any) => void, onContextSelect: (e: any) => void }) {
    const statusTheme = {
        AVAILABLE: { bg: 'bg-white', border: 'border-slate-200', text: 'text-slate-900', icon: Check, accent: 'text-emerald-500' },
        SOLD: { bg: 'bg-slate-50', border: 'border-slate-100', text: 'text-slate-300', icon: XCircle, accent: 'text-slate-300' },
        BOOKED: { bg: 'bg-blue-50/30', border: 'border-blue-100', text: 'text-blue-900', icon: Clock, accent: 'text-blue-500' },
        BLOCKED: { bg: 'bg-amber-50/30', border: 'border-amber-100', text: 'text-amber-900', icon: Lock, accent: 'text-amber-500' }
    };

    const theme = statusTheme[unit.status] || statusTheme.AVAILABLE;
    const Icon = theme.icon;

    return (
        <div
            onClick={onSelect}
            onContextMenu={onContextSelect}
            className={cn(
                "relative group p-6 rounded-[2.5rem] border-2 transition-all duration-500 cursor-pointer overflow-hidden",
                isSelected ? "border-emerald-500 scale-[0.98] shadow-2xl shadow-emerald-500/10" : `${theme.bg} ${theme.border} hover:border-emerald-400 hover:-translate-y-1 hover:shadow-xl`
            )}
        >
            {isSelected && (
                <div className="absolute top-4 right-4 z-10 text-emerald-500 animate-in zoom-in">
                    <CheckCircle2 size={24} fill="white" />
                </div>
            )}

            <div className="flex justify-between items-start mb-6">
                <span className={cn("text-3xl font-black tracking-tighter transition-colors", isSelected ? "text-slate-900" : theme.text)}>
                    {unit.unitNumber}
                </span>
                <div className={cn("p-2 rounded-2xl bg-white shadow-sm transition-transform group-hover:rotate-12", theme.accent)}>
                    <Icon size={16} strokeWidth={3} />
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configuration</span>
                    <span className="text-sm font-black text-slate-900">{unit.configuration || '2 BHK'} Asset</span>
                </div>
                
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pricing</span>
                        <span className="text-xs font-black text-slate-900">₹{(unit.totalPrice / 10000000).toFixed(2)} Cr</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Area</span>
                        <span className="text-xs font-black text-slate-900">{unit.carpetArea} sqft</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions Hidden Overlay */}
            <div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                <button className="p-3 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2">
                    <MousePointer2 size={12} /> Inspect
                </button>
            </div>
        </div>
    );
}
