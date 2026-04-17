"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { 
    X, ShieldCheck, TrendingUp, Info, 
    Download, Hand, CheckCircle2, 
    ChevronRight, ArrowRight, Calculator,
    Clock, Flame, MapPin, Layers
} from 'lucide-react';
import type { WarRoomUnit, WarRoomTower, HoldEntry } from './types';

interface QuickSellPanelProps {
    unit: WarRoomUnit;
    tower: WarRoomTower;
    property: any;
    hold?: HoldEntry;
    allUnits: WarRoomUnit[];
    onClose: () => void;
    onHold: () => void;
    onReleaseHold: () => void;
}

export function QuickSellPanel({
    unit,
    tower,
    property,
    hold,
    allUnits,
    onClose,
    onHold,
    onReleaseHold
}: QuickSellPanelProps) {
    const [secondsLeft, setSecondsLeft] = useState(0);

    // Update countdown for holds
    useEffect(() => {
        if (!hold) return;
        const update = () => {
            const left = Math.max(0, Math.floor((hold.expiry - Date.now()) / 1000));
            setSecondsLeft(left);
        };
        update();
        const timer = setInterval(update, 1000);
        return () => clearInterval(timer);
    }, [hold]);

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Derived comparisons
    const similarUnits = useMemo(() => {
        return allUnits
            .filter(u => u.id !== unit.id && u.configuration === unit.configuration && u.status === 'AVAILABLE')
            .slice(0, 2);
    }, [allUnits, unit]);

    const isPremium = unit.floor > tower.totalFloors * 0.7 || unit.isHighDemand;

    return (
        <div className="absolute top-0 right-0 bottom-0 w-[420px] bg-[#0b0f14] border-l border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-30 flex flex-col animate-slide-in">
            {/* Header */}
            <div className="p-6 pb-4 flex items-center justify-between border-b border-white/5">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            unit.status === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-slate-400'
                        }`}>
                            {hold ? 'Soft Hold' : unit.status}
                        </span>
                        {unit.isHighDemand && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-wider">
                                <Flame size={10} fill="currentColor" /> High Demand
                            </span>
                        )}
                    </div>
                    <h2 className="text-2xl font-black text-white leading-none">Unit {unit.unitNumber}</h2>
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">{tower.name} • Floor {unit.floor}</p>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Visual Highlight Card */}
                <div className="p-6 pt-4">
                    <div className="bg-gradient-to-br from-[#1a202c] to-[#0f172a] rounded-3xl p-6 border border-white/10 relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Layers size={80} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6 relative z-10">
                            <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Configuration</span>
                                <span className="text-lg font-black text-white">{unit.configuration}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Facing</span>
                                <span className="text-lg font-black text-white">{unit.facing}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Carpet Area</span>
                                <span className="text-lg font-black text-white">{unit.carpetArea} <span className="text-xs text-slate-500 uppercase">sqft</span></span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Super Builtup</span>
                                <span className="text-lg font-black text-white">{Math.round(unit.builtUpArea)} <span className="text-xs text-slate-500 uppercase">sqft</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hold Banner if Active */}
                {hold && (
                    <div className="mx-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                                <Clock size={20} className="animate-pulse" />
                            </div>
                            <div>
                                <p className="text-xs text-amber-500/70 font-bold uppercase tracking-wider">Locked by {hold.agentName}</p>
                                <p className="text-lg font-black text-amber-500 leading-none">{formatTime(secondsLeft)} remaining</p>
                            </div>
                        </div>
                        <button 
                            onClick={onReleaseHold}
                            className="px-3 py-1.5 bg-amber-500 text-amber-950 text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-amber-400 transition-colors"
                        >
                            Release
                        </button>
                    </div>
                )}

                {/* Price Breakdown */}
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <Calculator size={14} className="text-emerald-500" /> Price Estimate
                        </h3>
                        <span className="text-[10px] font-bold text-slate-500">Excl. Stamp Duty</span>
                    </div>

                    <div className="bg-white/5 rounded-2xl border border-white/5 divide-y divide-white/5 overflow-hidden">
                        <div className="p-4 flex items-center justify-between">
                            <span className="text-xs text-slate-400">Base Price (₹{unit.basePrice.toLocaleString()}/sqft)</span>
                            <span className="text-sm font-bold text-white">₹{(unit.basePrice * unit.builtUpArea).toLocaleString()}</span>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                            <span className="text-xs text-slate-400">Floor Rise (₹{unit.floorRise}/sqft per floor)</span>
                            <span className="text-sm font-bold text-emerald-400">+ ₹{(unit.floorRise * unit.floor * unit.builtUpArea).toLocaleString()}</span>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                            <span className="text-xs text-slate-400">PLC Charges (Facing/Location)</span>
                            <span className="text-sm font-bold text-emerald-400">+ ₹{unit.plcCharges.toLocaleString()}</span>
                        </div>
                        <div className="p-4 flex items-center justify-between bg-emerald-500/5">
                            <span className="text-xs font-black text-white uppercase tracking-wider">Estimated Total</span>
                            <span className="text-xl font-black text-emerald-400">₹{unit.totalPrice.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Smart Insight */}
                {isPremium && (
                    <div className="mx-6 p-4 bg-violet-500/10 border border-violet-500/20 rounded-2xl">
                        <div className="flex items-start gap-3">
                            <TrendingUp size={18} className="text-violet-400 mt-0.5" />
                            <div>
                                <p className="text-xs font-black text-violet-300 uppercase tracking-widest mb-1">Market Insight</p>
                                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                    This unit on the {unit.floor}th floor is seeing <span className="text-violet-300 font-bold">2.4x higher demand</span> than lower floors. Price appreciation predicted at 12% by occupancy.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 bg-[#080c12] border-t border-white/10 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={onHold}
                        disabled={!!hold}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Hand size={14} />
                        Hold Unit
                    </button>
                    <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all">
                        <Download size={14} />
                        Quote PDF
                    </button>
                </div>
                <button className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-xl text-sm font-black uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all transform active:scale-[0.98]">
                    <CheckCircle2 size={18} />
                    Book Unit Now
                </button>
            </div>

            <style jsx>{`
                .animate-slide-in {
                    animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}
