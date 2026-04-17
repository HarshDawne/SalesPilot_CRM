import React from 'react';
import { Unit } from '@/lib/types/properties';
import { UnitStatusBadge } from './UnitStatusBadge';
import { Edit2, Trash2, Eye } from 'lucide-react';

interface UnitTableProps {
    units: Unit[];
    onEdit?: (unit: Unit) => void;
    onDelete?: (unit: Unit) => void;
}

export function UnitTable({ units, onEdit, onDelete }: UnitTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b border-slate-200 text-xs font-bold text-muted uppercase tracking-wider">
                        <th className="py-3 px-4">Unit</th>
                        <th className="py-3 px-4">Floor</th>
                        <th className="py-3 px-4">Configuration</th>
                        <th className="py-3 px-4">Area</th>
                        <th className="py-3 px-4">Price</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {units.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="py-8 text-center text-muted">
                                No units found. Add your first unit.
                            </td>
                        </tr>
                    ) : (
                        units.map((unit) => (
                            <tr key={unit.id} className="group hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-4 font-bold text-charcoal">
                                    {unit.label}
                                </td>
                                <td className="py-3 px-4 text-slate-600">
                                    {unit.floor || '-'}
                                </td>
                                <td className="py-3 px-4 text-slate-600">
                                    {unit.bedrooms ? `${unit.bedrooms} BHK` : unit.category}
                                </td>
                                <td className="py-3 px-4 text-slate-600">
                                    {unit.sizeSqft ? `${unit.sizeSqft} sqft` : '-'}
                                </td>
                                <td className="py-3 px-4 text-slate-600 font-medium">
                                    {unit.price ? `₹${(unit.price / 100000).toFixed(2)} L` : '-'}
                                </td>
                                <td className="py-3 px-4">
                                    <UnitStatusBadge status={unit.status} />
                                </td>
                                <td className="py-3 px-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {onEdit && (
                                            <button onClick={() => onEdit(unit)} className="p-1 hover:bg-white rounded text-slate-500 hover:text-copper shadow-sm">
                                                <Edit2 size={14} />
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button onClick={() => onDelete(unit)} className="p-1 hover:bg-white rounded text-slate-500 hover:text-red-500 shadow-sm">
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
