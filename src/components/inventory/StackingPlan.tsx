"use client";

import { Unit, UnitStatus } from "@/modules/inventory/types";
import { useState } from "react";
import { Info, CheckCircle, Lock, Ban } from "lucide-react";
import { CostSheetGenerator } from "@/components/sales/CostSheetGenerator";

interface StackingPlanProps {
    units: Unit[];
    towerName: string;
    onUnitClick?: (unit: Unit) => void;
}

export function StackingPlan({ units, towerName, onUnitClick }: StackingPlanProps) {
    // Group units by floor
    const floors = [...new Set(units.map(u => u.floorNumber))].sort((a, b) => b - a);
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

    const handleUnitClick = (unit: Unit) => {
        if (onUnitClick) onUnitClick(unit);
        setSelectedUnit(unit);
    };
    const getStatusColor = (status: UnitStatus) => {
        switch (status) {
            case UnitStatus.AVAILABLE: return 'bg-emerald-100 hover:bg-emerald-200 border-emerald-300 text-emerald-800';
            case UnitStatus.BLOCKED: return 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-800';
            case UnitStatus.SOLD: return 'bg-rose-100 border-rose-200 text-rose-400 cursor-not-allowed opacity-70';
            case UnitStatus.BOOKED: return 'bg-blue-100 border-blue-300 text-blue-800';
            default: return 'bg-slate-100 text-slate-400';
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-900">{towerName} - Stacking Plan</h3>
                <div className="flex gap-4 text-xs font-medium">
                    <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-400 rounded-sm"></div> Available</span>
                    <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-rose-400 rounded-sm"></div> Sold</span>
                    <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-amber-400 rounded-sm"></div> Blocked</span>
                </div>
            </div>

            <div className="p-6 overflow-x-auto">
                <div className="min-w-[600px] space-y-2">
                    {floors.map(floor => (
                        <div key={floor} className="flex gap-2">
                            <div className="w-16 h-12 flex items-center justify-center font-bold text-slate-400 bg-slate-50 rounded-lg text-sm shrink-0">
                                Floor {floor}
                            </div>
                            <div className="flex gap-2 flex-1">
                                {units.filter(u => u.floorNumber === floor).sort((a, b) => a.unitNumber.localeCompare(b.unitNumber)).map(unit => (
                                    <button
                                        key={unit.id}
                                        onClick={() => unit.status !== UnitStatus.SOLD && handleUnitClick(unit)}
                                        disabled={unit.status === UnitStatus.SOLD}
                                        className={`
                                            flex-1 h-12 rounded-lg border flex items-center justify-between px-3 transition-all relative group
                                            ${getStatusColor(unit.status)}
                                        `}
                                    >
                                        <div className="text-left">
                                            <div className="font-bold text-sm leading-none">{unit.unitNumber}</div>
                                            <div className="text-[10px] opacity-75 mt-0.5">{unit.configuration}</div>
                                        </div>
                                        <div>
                                            {unit.status === UnitStatus.AVAILABLE && <CheckCircle size={14} />}
                                            {unit.status === UnitStatus.SOLD && <Ban size={14} />}
                                            {unit.status === UnitStatus.BLOCKED && <Lock size={14} />}
                                        </div>

                                        {/* Tooltip on Hover */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 text-white text-xs rounded-lg p-3 hidden group-hover:block z-10 shadow-xl">
                                            <div className="font-bold text-sm mb-1">{unit.unitNumber} ({unit.configuration})</div>
                                            <div className="space-y-1 opacity-90">
                                                <div className="flex justify-between"><span>Area:</span> <span>{unit.area.carpet} sqft</span></div>
                                                <div className="flex justify-between"><span>Price:</span> <span>₹{(unit.price.totalCost / 10000000).toFixed(2)} Cr</span></div>
                                                <div className="flex justify-between text-yellow-400"><span>Status:</span> <span>{unit.status}</span></div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <CostSheetGenerator
                isOpen={!!selectedUnit}
                unit={selectedUnit || undefined}
                leadId="user-context-id" // In a real app, this would come from the context or route
                onClose={() => setSelectedUnit(null)}
            />
        </div>
    );
}
