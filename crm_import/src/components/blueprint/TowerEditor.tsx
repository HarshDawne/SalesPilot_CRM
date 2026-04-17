"use client";

import React, { useState } from 'react';
import { BlueprintTower, BlueprintUnit, UnitStatus } from '@/lib/types/blueprint';
import {
    ArrowLeft, Check, Lock, XCircle, Pencil, Save, X, LayoutGrid,
    Layers, Info, FileText, Clock, Filter
} from 'lucide-react';
import { UnitEditorModal } from './UnitEditorModal';
import { ThreeDRenderSection } from './ThreeDRenderSection';
import { RequestRenderModal } from './RequestRenderModal';
import { ShareRenderModal } from './ShareRenderModal';

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
    const [requestModalOpen, setRequestModalOpen] = useState(false);
    const [shareModalRender, setShareModalRender] = useState<any>(null);

    const STATUS_CONFIG = {
        AVAILABLE: { label: 'Available', dot: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50/50', border: 'border-emerald-100' },
        BOOKED: { label: 'Booked', dot: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50/50', border: 'border-blue-100' },
        SOLD: { label: 'Sold', dot: 'bg-slate-300', text: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200' },
        BLOCKED: { label: 'Blocked', dot: 'bg-amber-400', text: 'text-amber-600', bg: 'bg-amber-50/50', border: 'border-amber-100' }
    };

    // Filter units based on statusFilter
    const filteredUnits = statusFilter === 'ALL'
        ? tower.units
        : tower.units.filter(u => u.status === statusFilter);

    // Group units by floor
    const unitsByFloor = filteredUnits.reduce((acc, unit) => {
        if (!acc[unit.floor]) acc[unit.floor] = [];
        acc[unit.floor].push(unit);
        return acc;
    }, {} as Record<number, BlueprintUnit[]>);

    const sortedFloors = Object.keys(unitsByFloor).map(Number).sort((a, b) => b - a);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Header / Config Bar */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-6 h-24 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        {/* MIDDLE ROW: Name, Location (Left) and Developer (Right) */}
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Builder Mode</span>
                                <span className="text-slate-300">/</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tower Config</span>
                            </div>
                            {isEditingName ? (
                                <input
                                    autoFocus
                                    type="text"
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    onBlur={() => {
                                        if (editingName.trim() && editingName !== tower.name) {
                                            onUpdateConfig({ name: editingName.trim() });
                                        }
                                        setIsEditingName(false);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            if (editingName.trim() && editingName !== tower.name) {
                                                onUpdateConfig({ name: editingName.trim() });
                                            }
                                            setIsEditingName(false);
                                        } else if (e.key === 'Escape') {
                                            setEditingName(tower.name);
                                            setIsEditingName(false);
                                        }
                                    }}
                                    className="bg-slate-100 border border-emerald-400 text-2xl font-bold text-slate-900 px-2 py-0 mt-1 rounded focus:outline-none w-full max-w-md"
                                />
                            ) : (
                                <h2
                                    onClick={() => !isReadOnly && setIsEditingName(true)}
                                    className={`text-2xl font-bold text-slate-900 mt-1 px-2 py-0 -ml-2 rounded transition-all flex items-center gap-2 group ${!isReadOnly ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                                >
                                    {tower.name}
                                    {!isReadOnly && <Pencil size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                </h2>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Interactive Legend Filter */}
                        <div className="hidden lg:flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                            <button
                                onClick={() => setStatusFilter('ALL')}
                                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${statusFilter === 'ALL' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                                    }`}
                            >
                                All {tower.units.length}
                            </button>
                            <div className="w-[1px] h-4 bg-slate-300 mx-1"></div>
                            {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                                const count = tower.units.filter(u => u.status === key).length;
                                const isActive = statusFilter === key;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => setStatusFilter(key)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${isActive
                                            ? `${config.bg} ${config.text} ${config.border} border shadow-sm`
                                            : 'text-slate-400 hover:text-slate-600 hover:bg-white'
                                            }`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></div>
                                        {config.label} {count}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Config Blocks */}
                        <div className="flex gap-4">
                            <ConfigBlock
                                label="Floors"
                                value={tower.totalFloors}
                                onChange={(val) => onUpdateConfig({ totalFloors: val })}
                                disabled={isReadOnly}
                            />
                            <ConfigBlock
                                label="Units / Floor"
                                value={tower.unitsPerFloor}
                                onChange={(val) => onUpdateConfig({ unitsPerFloor: val })}
                                disabled={isReadOnly}
                            />
                            <ConfigBlock
                                label="Start Unit #"
                                value={tower.startingUnitNumber || 101}
                                onChange={(val) => onUpdateConfig({ startingUnitNumber: val })}
                                disabled={isReadOnly}
                            />
                        </div>

                        <div className="flex gap-4">
                            <ThreeDRenderSection
                                renders={tower.renders || []}
                                requests={tower.renderRequests || []}
                                isReadOnly={isReadOnly}
                                onRequestNew={() => setRequestModalOpen(true)}
                                onView={(r) => r.media[0] && window.open(r.media[0].url, '_blank')}
                                onShare={(r) => setShareModalRender(r)}
                                onDeleteRequest={async (requestId) => {
                                    try {
                                        const response = await fetch(`/api/render-requests/${requestId}`, {
                                            method: 'DELETE'
                                        });
                                        const data = await response.json();
                                        if (data.success) {
                                            const newRequests = (tower.renderRequests || []).filter(r => r.id !== requestId);
                                            onUpdateConfig({ renderRequests: newRequests });
                                        } else {
                                            alert(data.error || 'Failed to delete request');
                                        }
                                    } catch (error) {
                                        console.error('Error deleting render request:', error);
                                        alert('Failed to delete request');
                                    }
                                }}
                                compact
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Canvas */}
            <div className="flex-1 overflow-auto p-8">
                <div className="max-w-[1600px] mx-auto space-y-4">
                    {sortedFloors.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                            <Filter size={40} className="text-slate-200 mb-4" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No units match this filter</p>
                            <button onClick={() => setStatusFilter('ALL')} className="mt-4 text-emerald-500 font-bold text-xs hover:underline">Clear Filters</button>
                        </div>
                    ) : sortedFloors.map((floorNum) => (
                        <div key={floorNum} className="flex gap-4">
                            {/* Floor Label Sidebar */}
                            <div className="w-24 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center p-4">
                                <span className="text-2xl font-black text-slate-800 leading-none">{floorNum}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Floor</span>
                            </div>

                            {/* Units Grid */}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {unitsByFloor[floorNum].map(unit => (
                                    <UnitCard
                                        key={unit.id}
                                        unit={unit}
                                        onClick={() => setSelectedUnit(unit)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

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

            {requestModalOpen && (
                <RequestRenderModal
                    propertyId={propertyId}
                    towerId={tower.id}
                    sourceType="TOWER"
                    propertyName={propertyName}
                    builderName={builderName}
                    towerName={tower.name}
                    onClose={() => setRequestModalOpen(false)}
                    onSuccess={(data) => {
                        onUpdateConfig({ 
                            renderRequests: [...(tower.renderRequests || []), data as any] 
                        });
                        setRequestModalOpen(false);
                    }}
                />
            )}

            {shareModalRender && (
                <ShareRenderModal
                    render={shareModalRender}
                    onClose={() => setShareModalRender(null)}
                />
            )}
        </div>
    );
}

function ConfigBlock({ label, value, onChange, disabled }: { label: string, value: number, onChange: (val: number) => void, disabled: boolean }) {
    const [localValue, setLocalValue] = useState(value.toString());

    // Sync local state if parent value changes
    React.useEffect(() => {
        setLocalValue(value.toString());
    }, [value]);

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 px-4 flex flex-col items-center justify-center min-w-[100px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</span>
            <input
                type="text"
                inputMode="numeric"
                value={localValue}
                onChange={(e) => {
                    const val = e.target.value;
                    // Allow only digits or empty string
                    if (val === '' || /^\d+$/.test(val)) {
                        setLocalValue(val);
                        // Update parent if it's a valid number
                        if (val !== '') {
                            onChange(parseInt(val, 10));
                        }
                    }
                }}
                onBlur={() => {
                    // Reset to parent value if empty on blur
                    if (localValue === '') {
                        setLocalValue(value.toString());
                    }
                }}
                disabled={disabled}
                className="bg-transparent text-center font-bold text-lg text-slate-900 outline-none w-full appearance-none"
            />
        </div>
    );
}

function UnitCard({ unit, onClick }: { unit: BlueprintUnit, onClick: () => void }) {
    const statusStyles = {
        AVAILABLE: 'bg-emerald-50/40 border-emerald-100 text-emerald-900 hover:border-emerald-300 hover:bg-emerald-50 shadow-sm',
        SOLD: 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300 transition-opacity',
        BLOCKED: 'bg-amber-50/40 border-amber-100 text-amber-900 hover:border-amber-300',
        BOOKED: 'bg-blue-50/40 border-blue-100 text-blue-900 hover:border-blue-300'
    };

    const StatusIcon = {
        AVAILABLE: Check,
        SOLD: XCircle,
        BLOCKED: Lock,
        BOOKED: Clock
    }[unit.status] || Check;

    const style = (statusStyles as any)[unit.status] || statusStyles.AVAILABLE;

    return (
        <div
            onClick={onClick}
            className={`group flex flex-col rounded-xl border p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 ${style}`}
        >
            <div className="flex justify-between items-start mb-4">
                <span className="font-black text-2xl tracking-tighter">{unit.unitNumber}</span>
                <div className={`p-1 rounded-md ${unit.status === 'AVAILABLE' ? 'text-emerald-500' : 'text-slate-300'}`}>
                    <StatusIcon size={14} strokeWidth={3} />
                </div>
            </div>

            <div className="flex flex-col gap-1 mb-5">
                <span className="text-xs font-bold text-slate-500/80 uppercase tracking-widest">{unit.configuration || '2 BHK'}</span>
                <span className="text-[11px] font-bold text-slate-400 tracking-wide">{unit.areaSqft || 1250} SQFT</span>
            </div>

            <button
                className="mt-auto w-full py-2 bg-white/60 border border-slate-200/50 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 hover:bg-white hover:text-copper hover:border-copper/30 transition-all flex items-center justify-center gap-2 shadow-sm"
                onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                }}
            >
                <div className="p-1 bg-slate-100 rounded text-slate-400 group-hover:text-copper transition-colors">
                    <FileText size={12} />
                </div>
                View Docs
            </button>
        </div>
    );
}
