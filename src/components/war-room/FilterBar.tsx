"use client";

import { X, SlidersHorizontal } from 'lucide-react';
import type { WarRoomTower } from './types';

export interface WarRoomFilters {
    status: string[];
    configuration: string[];
    facing: string[];
    minPrice: number;
    maxPrice: number;
    floors: number[];
    tower: string;
}

interface Props {
    towers: WarRoomTower[];
    filters: WarRoomFilters;
    onChange: (f: WarRoomFilters) => void;
    hasActiveFilters: boolean;
}

const STATUS_OPTIONS = [
    { value: 'AVAILABLE', label: 'Available', dot: 'bg-emerald-500' },
    { value: 'SOFT_HOLD', label: 'On Hold', dot: 'bg-amber-400' },
    { value: 'BOOKED', label: 'Booked', dot: 'bg-blue-500' },
    { value: 'SOLD', label: 'Sold', dot: 'bg-slate-500' },
    { value: 'BLOCKED', label: 'Blocked', dot: 'bg-red-500' },
];

const CONFIG_OPTIONS = ['1 BHK', '2 BHK', '3 BHK', '4 BHK', 'Studio', 'Office', 'Retail'];
const FACING_OPTIONS = ['North', 'South', 'East', 'West', 'NE', 'NW', 'SE', 'SW'];

function toggleArray<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
}

export function FilterBar({ towers, filters, onChange, hasActiveFilters }: Props) {
    const chipBase = "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border cursor-pointer whitespace-nowrap";
    const chipActive = "bg-white/15 border-white/30 text-white";
    const chipIdle = "bg-white/5 border-white/10 text-slate-500 hover:text-slate-300 hover:bg-white/8 hover:border-white/20";

    return (
        <div className="flex items-center gap-3 px-6 py-2.5 border-b border-white/5 bg-[#0d1117] flex-shrink-0 overflow-x-auto">
            <SlidersHorizontal size={13} className="text-slate-500 flex-shrink-0" />

            {/* Status */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
                {STATUS_OPTIONS.map(opt => {
                    const active = filters.status.includes(opt.value);
                    return (
                        <button
                            key={opt.value}
                            onClick={() => onChange({ ...filters, status: toggleArray(filters.status, opt.value) })}
                            className={`${chipBase} ${active ? chipActive : chipIdle}`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />
                            {opt.label}
                        </button>
                    );
                })}
            </div>

            <div className="h-4 w-px bg-white/10 flex-shrink-0" />

            {/* Configuration */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
                {CONFIG_OPTIONS.map(cfg => {
                    const active = filters.configuration.includes(cfg);
                    return (
                        <button
                            key={cfg}
                            onClick={() => onChange({ ...filters, configuration: toggleArray(filters.configuration, cfg) })}
                            className={`${chipBase} ${active ? chipActive : chipIdle}`}
                        >
                            {cfg}
                        </button>
                    );
                })}
            </div>

            <div className="h-4 w-px bg-white/10 flex-shrink-0" />

            {/* Tower */}
            <select
                value={filters.tower}
                onChange={e => onChange({ ...filters, tower: e.target.value })}
                className="bg-white/5 border border-white/10 text-slate-400 text-[10px] font-bold uppercase tracking-wider rounded-lg px-3 py-1.5 focus:outline-none focus:border-white/30 cursor-pointer hover:bg-white/8 transition-all flex-shrink-0"
            >
                <option value="">All Towers</option>
                {towers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                ))}
            </select>

            {/* Facing */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
                {FACING_OPTIONS.map(f => {
                    const active = filters.facing.includes(f);
                    return (
                        <button
                            key={f}
                            onClick={() => onChange({ ...filters, facing: toggleArray(filters.facing, f) })}
                            className={`${chipBase} ${active ? chipActive : chipIdle}`}
                        >
                            {f}
                        </button>
                    );
                })}
            </div>

            {/* Clear */}
            {hasActiveFilters && (
                <>
                    <div className="h-4 w-px bg-white/10 flex-shrink-0" />
                    <button
                        onClick={() => onChange({
                            status: [], configuration: [], facing: [],
                            minPrice: 0, maxPrice: 0, floors: [], tower: ''
                        })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 whitespace-nowrap flex-shrink-0"
                    >
                        <X size={11} />
                        Clear Filters
                    </button>
                </>
            )}
        </div>
    );
}
