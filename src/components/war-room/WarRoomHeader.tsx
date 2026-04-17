"use client";

import { ArrowLeft, Zap, Monitor, ZoomIn, ZoomOut, Activity } from 'lucide-react';

interface Props {
    property: any;
    onBack: () => void;
    presentationMode: boolean;
    onTogglePresentation: () => void;
    zoom: number;
    onZoomChange: (z: number) => void;
}

export function WarRoomHeader({ property, onBack, presentationMode, onTogglePresentation, zoom, onZoomChange }: Props) {
    return (
        <div className="flex items-center justify-between px-6 h-14 border-b border-white/5 bg-[#0b1018] z-20 flex-shrink-0">
            {/* Left */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors"
                >
                    <ArrowLeft size={18} />
                </button>

                <div className="h-4 w-px bg-white/10" />

                <div className="flex items-center gap-3">
                    {/* Live pulse */}
                    <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500">Live</span>
                    </div>

                    <div className="h-4 w-px bg-white/10" />

                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">War Room</span>
                        <span className="text-sm font-bold text-white leading-none">{property?.name || 'Property Inventory'}</span>
                    </div>
                </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
                {/* Zoom */}
                <div className="flex items-center gap-1 bg-white/5 rounded-lg border border-white/10 p-0.5">
                    <button
                        onClick={() => onZoomChange(Math.max(0.5, zoom - 0.1))}
                        className="px-2 py-1.5 text-slate-400 hover:text-white transition-colors rounded text-xs"
                        title="Zoom out"
                    >
                        <ZoomOut size={13} />
                    </button>
                    <span className="px-2 text-[11px] font-bold text-slate-400 min-w-[42px] text-center">
                        {Math.round(zoom * 100)}%
                    </span>
                    <button
                        onClick={() => onZoomChange(Math.min(1.5, zoom + 0.1))}
                        className="px-2 py-1.5 text-slate-400 hover:text-white transition-colors rounded text-xs"
                        title="Zoom in"
                    >
                        <ZoomIn size={13} />
                    </button>
                </div>

                {/* Presentation Toggle */}
                <button
                    onClick={onTogglePresentation}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all border ${
                        presentationMode
                            ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                >
                    <Monitor size={13} />
                    {presentationMode ? 'Exit Presentation' : 'Present Mode'}
                </button>
            </div>
        </div>
    );
}
