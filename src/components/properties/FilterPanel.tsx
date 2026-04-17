import React from 'react';
import { PropertyFilter, ProjectStatus } from '@/types/property';
import { X, RotateCcw, IndianRupee, MapPin, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterPanelProps {
    filters: PropertyFilter;
    onChange: (filters: PropertyFilter) => void;
    onReset: () => void;
}

export function FilterPanel({ filters, onChange, onReset }: FilterPanelProps) {
    const statuses: ProjectStatus[] = [
        ProjectStatus.ACTIVE,
        ProjectStatus.UNDER_CONSTRUCTION,
        ProjectStatus.COMPLETED,
        ProjectStatus.PLANNING,
        ProjectStatus.ON_HOLD
    ];

    const cities = ["Mumbai", "Pune", "Bangalore", "Delhi", "Dubai"];

    const toggleStatus = (status: ProjectStatus) => {
        const current = filters.status || [];
        const updated = current.includes(status)
            ? current.filter(s => s !== status)
            : [...current, status];
        onChange({ ...filters, status: updated.length ? updated : undefined });
    };

    const toggleCity = (city: string) => {
        const current = filters.city || [];
        const updated = current.includes(city)
            ? current.filter(c => c !== city)
            : [...current, city];
        onChange({ ...filters, city: updated.length ? updated : undefined });
    };

    return (
        <div className="bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                
                {/* 1. Status Filter */}
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity size={14} className="text-primary" />
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Project Lifecycle</label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {statuses.map(status => (
                            <button
                                key={status}
                                onClick={() => toggleStatus(status)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 border",
                                    filters.status?.includes(status)
                                        ? "bg-primary border-primary text-white shadow-md shadow-primary/10"
                                        : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
                                )}
                            >
                                {status.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. City Filter */}
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <MapPin size={14} className="text-secondary" />
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Regional Geographies</label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {cities.map(city => (
                            <button
                                key={city}
                                onClick={() => toggleCity(city)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 border",
                                    filters.city?.includes(city)
                                        ? "bg-secondary border-secondary text-white shadow-md shadow-secondary/10"
                                        : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
                                )}
                            >
                                {city}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Price Filter */}
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <IndianRupee size={14} className="text-amber-500" />
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Financial Bracket (Lakhs)</label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase ml-1">Min Price</span>
                            <input 
                                type="number" 
                                placeholder="Any"
                                value={filters.minPrice || ''}
                                onChange={(e) => onChange({ ...filters, minPrice: e.target.value ? Number(e.target.value) : undefined })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-text-main focus:bg-white focus:border-amber-500/30 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase ml-1">Max Price</span>
                            <input 
                                type="number" 
                                placeholder="Any"
                                value={filters.maxPrice || ''}
                                onChange={(e) => onChange({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-text-main focus:bg-white focus:border-amber-500/30 outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

            </div>

            {/* Bottom Bar */}
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
                <p className="text-[10px] font-medium text-slate-400 italic">
                    Select criteria to refine your global inventory view.
                </p>
                <button
                    onClick={onReset}
                    className="flex items-center gap-2 px-4 py-2 text-[10px] font-black text-slate-500 hover:text-primary uppercase tracking-widest transition-colors"
                >
                    <RotateCcw size={12} />
                    Reset Parameters
                </button>
            </div>
        </div>
    );
}
