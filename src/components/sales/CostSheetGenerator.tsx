"use client";

import { useState, useEffect } from "react";
import { Unit } from "@/modules/inventory/types";
import { CostSheet } from "@/modules/sales/types";
import { CostSheetService } from "@/modules/sales/cost-sheet-service";
import { X, FileText, Download, Send, Calculator, CheckCircle } from "lucide-react";

interface CostSheetGeneratorProps {
    unit?: Unit;
    leadId?: string;
    isOpen: boolean;
    onClose: () => void;
}

export function CostSheetGenerator({ unit, leadId, isOpen, onClose }: CostSheetGeneratorProps) {
    const [sheet, setSheet] = useState<CostSheet | null>(null);
    const [discount, setDiscount] = useState(0);
    const [isGenerated, setIsGenerated] = useState(false);

    useEffect(() => {
        if (unit && leadId) {
            // Recalculate whenever discount changes
            const newSheet = CostSheetService.generateQuotation(unit, leadId, discount);
            setSheet(newSheet);
        }
    }, [unit, leadId, discount]);

    if (!isOpen || !unit || !sheet) return null;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-white p-5 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-lg text-indigo-700">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Cost Sheet Estimation</h2>
                            <p className="text-sm text-slate-500">Unit {unit.unitNumber} • {unit.configuration} • {unit.area.carpet} sqft</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Breakdown Table */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left">Component</th>
                                    <th className="px-4 py-3 text-right">Amount (INR)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sheet.components.map((comp, idx) => (
                                    <tr key={idx} className={comp.name === 'Base Cost' ? 'font-semibold text-slate-800' : 'text-slate-600'}>
                                        <td className="px-4 py-3">
                                            {comp.name}
                                            {comp.isTax && <span className="ml-2 text-[10px] bg-slate-100 border border-slate-200 px-1 rounded text-slate-500">Tax</span>}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium">
                                            {formatCurrency(comp.amount)}
                                        </td>
                                    </tr>
                                ))}
                                {/* Discount Row */}
                                <tr className="bg-amber-50 text-amber-900">
                                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                                        Discount Applied
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-amber-700">
                                        - {formatCurrency(discount)}
                                    </td>
                                </tr>
                            </tbody>
                            <tfoot className="bg-slate-900 text-white">
                                <tr>
                                    <td className="px-4 py-4 font-bold text-lg">Grand Total (All Inclusive)</td>
                                    <td className="px-4 py-4 text-right font-bold text-lg">
                                        {formatCurrency(sheet.grandTotal)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Controls */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Apply Discount</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                                <input
                                    type="number"
                                    className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 font-medium"
                                    placeholder="Enter Amount"
                                    value={discount || ''}
                                    onChange={(e) => setDiscount(Number(e.target.value))}
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">Requires Manager Approval if &gt; 2 Lakhs</p>
                        </div>

                        <div className="flex items-end justify-end">
                            <div className="text-right">
                                <div className="text-xs text-slate-500">Booking Amount (5%)</div>
                                <div className="text-xl font-bold text-emerald-600">{formatCurrency(sheet.grandTotal * 0.05)}</div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg">
                        Cancel
                    </button>
                    <button className="px-4 py-2 border border-indigo-200 text-indigo-700 font-medium rounded-lg hover:bg-indigo-50 flex items-center gap-2">
                        <Download size={18} /> PDF Preview
                    </button>
                    <button
                        className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center gap-2"
                        onClick={() => { setIsGenerated(true); setTimeout(onClose, 1000); }}
                    >
                        {isGenerated ? <CheckCircle size={18} /> : <Send size={18} />}
                        {isGenerated ? 'Sent to Customer' : 'Send Offer'}
                    </button>
                </div>
            </div>
        </div>
    );
}
