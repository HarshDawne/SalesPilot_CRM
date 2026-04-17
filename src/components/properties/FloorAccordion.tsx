
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { UnitCard } from './UnitCard';

export function FloorAccordion({ floor, units }: { floor: number, units: any[] }) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="border border-slate-200 rounded-xl bg-white overflow-hidden mb-3">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {isOpen ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                        <Layers size={16} className="text-copper" /> Floor {floor}
                    </div>
                    <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                        {units.length} Units
                    </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        {units.filter(u => u.status === 'AVAILABLE').length} Available
                    </span>
                    <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                        {units.filter(u => u.status === 'SOLD').length} Sold
                    </span>
                </div>
            </button>

            {isOpen && (
                <div className="p-4 bg-white border-t border-slate-200">
                    {units.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {units.map(unit => (
                                <UnitCard key={unit.id} unit={unit} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-slate-400 text-sm py-4">No units configued for this floor.</p>
                    )}
                </div>
            )}
        </div>
    );
}
