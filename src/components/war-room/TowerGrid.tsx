"use client";

import React, { useMemo } from 'react';
import { LayoutGrid, Flame, Clock, Navigation } from 'lucide-react';
import type { WarRoomTower, WarRoomUnit, HoldEntry } from './types';

interface TowerGridProps {
    towers: WarRoomTower[];
    holds: Record<string, HoldEntry>;
    selectedUnitId: string | null;
    isUnitVisible: (unit: WarRoomUnit) => boolean;
    hasActiveFilters: boolean;
    zoom: number;
    presentationMode: boolean;
    onSelectUnit: (unit: WarRoomUnit) => void;
}

export function TowerGrid({
    towers,
    holds,
    selectedUnitId,
    isUnitVisible,
    hasActiveFilters,
    zoom,
    presentationMode,
    onSelectUnit
}: TowerGridProps) {
    return (
        <div 
            className="p-8 flex items-start gap-12 transition-transform duration-300 origin-top-left"
            style={{ transform: `scale(${zoom})` }}
        >
            {towers.map(tower => (
                <TowerBlock 
                    key={tower.id} 
                    tower={tower}
                    holds={holds}
                    selectedUnitId={selectedUnitId}
                    isUnitVisible={isUnitVisible}
                    hasActiveFilters={hasActiveFilters}
                    onSelectUnit={onSelectUnit}
                />
            ))}
        </div>
    );
}

function TowerBlock({ 
    tower, 
    holds, 
    selectedUnitId, 
    isUnitVisible, 
    hasActiveFilters, 
    onSelectUnit 
}: { 
    tower: WarRoomTower, 
    holds: Record<string, HoldEntry>, 
    selectedUnitId: string | null,
    isUnitVisible: (unit: WarRoomUnit) => boolean,
    hasActiveFilters: boolean,
    onSelectUnit: (unit: WarRoomUnit) => void 
}) {
    // Group units by floor
    const unitsByFloor = useMemo(() => {
        const floors: Record<number, WarRoomUnit[]> = {};
        tower.units.forEach(unit => {
            if (!floors[unit.floor]) floors[unit.floor] = [];
            floors[unit.floor].push(unit);
        });
        // Sort floor numbers descending (highest floor on top)
        const sortedFloors = Object.keys(floors).map(Number).sort((a, b) => b - a);
        return { floors, sortedFloors };
    }, [tower.units]);

    return (
        <div className="flex flex-col gap-6 min-w-[320px] animate-slide-up">
            {/* Tower Header */}
            <div className="flex items-center justify-between px-3">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{tower.units.length} UNITS</span>
                    </div>
                    <h3 className="text-2xl font-black text-white leading-none tracking-tight font-heading group-hover:text-emerald-400 transition-colors cursor-default">
                        {tower.name}
                    </h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-all cursor-pointer">
                    <Navigation size={18} />
                </div>
            </div>

            {/* Grid Container */}
            <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-[2rem] border border-white/5 shadow-2xl relative group/grid overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none"></div>
                {unitsByFloor.sortedFloors.map(floorNum => (
                    <div key={floorNum} className="flex gap-1.5 group/floor">
                        {/* Floor Label */}
                        <div className="w-8 flex items-center justify-center text-[10px] font-bold text-slate-600 group-hover/floor:text-slate-400 transition-colors">
                            {floorNum}
                        </div>
                        
                        {/* Units in row */}
                        <div className="flex gap-1.5">
                            {unitsByFloor.floors[floorNum].map(unit => {
                                const isVisible = isUnitVisible(unit);
                                const hold = holds[unit.id];
                                return (
                                    <UnitCell 
                                        key={unit.id} 
                                        unit={unit} 
                                        hold={hold}
                                        isSelected={selectedUnitId === unit.id}
                                        isVisible={isVisible}
                                        hasActiveFilters={hasActiveFilters}
                                        onClick={() => onSelectUnit(unit)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const STATUS_CONFIG = {
    AVAILABLE: { 
        bg: 'bg-emerald-500/5 hover:bg-emerald-500/15', 
        border: 'border-emerald-500/10 hover:border-emerald-500/40', 
        text: 'text-emerald-400', 
        glow: 'shadow-[0_0_20px_rgba(16,185,129,0.05)]' 
    },
    SOFT_HOLD: { 
        bg: 'bg-amber-500/10 hover:bg-amber-500/20', 
        border: 'border-amber-500/30 hover:border-amber-500/60', 
        text: 'text-amber-400', 
        glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)] animate-glow-pulse' 
    },
    BOOKED: { 
        bg: 'bg-blue-500/5', 
        border: 'border-blue-500/10', 
        text: 'text-blue-400', 
        glow: '' 
    },
    SOLD: { 
        bg: 'bg-slate-900/60', 
        border: 'border-white/5', 
        text: 'text-slate-600', 
        glow: '' 
    },
    BLOCKED: { 
        bg: 'bg-red-500/5', 
        border: 'border-red-500/10', 
        text: 'text-red-400', 
        glow: '' 
    },
};

function UnitCell({ 
    unit, 
    hold, 
    isSelected, 
    isVisible, 
    hasActiveFilters, 
    onClick 
}: { 
    unit: WarRoomUnit, 
    hold?: HoldEntry, 
    isSelected: boolean,
    isVisible: boolean,
    hasActiveFilters: boolean,
    onClick: () => void 
}) {
    const status = hold ? 'SOFT_HOLD' : unit.status;
    const config = STATUS_CONFIG[status];
    
    // Dim out if filtered
    const opacityClass = !isVisible && hasActiveFilters ? 'opacity-20 grayscale brightness-50' : 'opacity-100';
    const borderClass = isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-[#080c12] z-10' : config.border;
    
    return (
        <button
            onClick={onClick}
            className={`
                relative w-16 h-16 rounded-[1.2rem] border-2 transition-all duration-300 flex flex-col items-center justify-center gap-0.5
                ${config.bg} ${borderClass} ${config.text} ${config.glow} ${opacityClass}
                hover:scale-110 hover:z-20 group/unit
                active:scale-95
            `}
        >
            {/* Status Icons */}
            <div className="absolute -top-1.5 -right-1.5 flex gap-1">
                {unit.isHighDemand && (
                    <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-lg animate-pulse">
                        <Flame size={10} fill="currentColor" />
                    </div>
                )}
                {hold && (
                    <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-lg">
                        <Clock size={10} />
                    </div>
                )}
            </div>

            <span className="text-[14px] font-black tracking-tight leading-none">{unit.unitNumber}</span>
            <span className="text-[8px] font-black uppercase tracking-widest opacity-60 leading-none">{unit.configuration}</span>
            
            {/* Price Hint */}
            <div className="mt-1 flex items-center gap-0.5 opacity-40">
                <span className="text-[7px] font-bold">₹</span>
                <span className="text-[8px] font-bold">{(unit.totalPrice / 10000000).toFixed(1)}Cr</span>
            </div>

            {/* Selection indicator */}
            {isSelected && (
                <div className="absolute inset-0 rounded-xl bg-white/10 animate-pulse pointer-events-none" />
            )}
        </button>
    );
}
