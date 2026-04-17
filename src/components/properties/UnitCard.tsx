"use client";

import React, { useState } from 'react';
import { Check, Lock, XCircle, FileText, X, Download, File, Info, Clock } from 'lucide-react';
import { UNIT_STATUS_CONFIG } from '@/lib/types/properties';

export function UnitCard({ unit, towerName }: { unit: any, towerName?: string }) {
    const [showDocs, setShowDocs] = useState(false);

    const normalizedStatus = (unit.status || 'available').toLowerCase() as keyof typeof UNIT_STATUS_CONFIG;
    const config = UNIT_STATUS_CONFIG[normalizedStatus] || UNIT_STATUS_CONFIG.available;

    const statusIcons = {
        available: <Check size={12} className="text-emerald-600" />,
        booked: <Clock size={12} className="text-blue-600" />,
        sold: <XCircle size={12} className="text-slate-400" />,
        blocked: <Lock size={12} className="text-amber-600" />
    };

    const icon = statusIcons[normalizedStatus] || statusIcons.available;

    return (
        <>
            <div className={`
                relative group rounded-lg border p-3 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 bg-white
                ${config.bg} ${config.border} ${config.text}
            `}>
                <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm tracking-tight">{unit.unitNo}</span>
                    {icon}
                </div>

                <div className="text-xs font-medium opacity-80 mb-3">{unit.bhk}</div>

                {/* Builder Action: View Docs */}
                <button
                    onClick={(e) => { e.stopPropagation(); setShowDocs(true); }}
                    className="w-full py-1.5 px-2 bg-white/50 hover:bg-white border border-black/5 hover:border-black/20 rounded text-[10px] font-bold uppercase tracking-wide text-slate-600 transition-colors flex items-center justify-center gap-1.5"
                >
                    <FileText size={10} /> View Docs
                </button>

                {/* Tooltip */}
                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 text-white text-xs p-3 rounded-lg shadow-xl pointer-events-none z-20">
                    <div className="font-bold text-sm mb-1">{unit.unitNo} • {unit.bhk}</div>
                    <div className="space-y-1 opacity-90">
                        <div className="flex justify-between text-slate-500"><span>Area:</span> <span className="text-slate-200">{unit.carpetArea} sqft</span></div>
                        <div className="flex justify-between text-slate-500"><span>Price:</span> <span className="text-emerald-400">₹ {(unit.price / 10000000).toFixed(2)} Cr</span></div>
                        <div className="flex justify-between text-slate-500"><span>Facing:</span> <span className="text-slate-200">{unit.facing}</span></div>
                        <div className="pt-1 mt-1 border-t border-slate-800 font-bold uppercase text-[10px] tracking-wider text-center">
                            {unit.status}
                        </div>
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                </div>
            </div>

            {/* Document Drawer Modal */}
            {showDocs && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowDocs(false)}></div>
                    <div className="relative w-full max-w-md bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                            <div>
                                <div className="text-xs font-bold text-copper uppercase tracking-wider mb-1">{towerName || 'Tower Inventory'}</div>
                                <h2 className="text-2xl font-bold text-slate-900 font-heading">Unit {unit.unitNo}</h2>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-xs font-bold">{unit.bhk}</span>
                                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-xs font-bold">{unit.carpetArea} sqft</span>
                                </div>
                            </div>
                            <button onClick={() => setShowDocs(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Documents</h3>
                            <div className="space-y-3">
                                {(!unit.documents || unit.documents.length === 0) ? (
                                    <div className="text-center py-8 border border-dashed border-slate-200 rounded-lg">
                                        <div className="text-slate-400 text-xs">No documents available</div>
                                    </div>
                                ) : (
                                    unit.documents.map((doc: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-copper/40 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500"><File size={20} /></div>
                                                <div className="overflow-hidden">
                                                    <div className="font-bold text-slate-800 text-sm truncate max-w-[180px]" title={doc.name}>{doc.name}</div>
                                                    <div className="text-xs text-slate-400 flex items-center gap-1">
                                                        <span>{doc.type}</span>
                                                        {doc.docType && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="truncate max-w-[120px]" title={doc.docType}>{doc.docType}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="p-2 text-slate-400 hover:text-copper"><Download size={16} /></button>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <h4 className="font-bold text-slate-900 text-xs mb-2 flex items-center gap-2"><Info size={14} className="text-copper" /> Internal Notes</h4>
                                <p className="text-xs text-slate-500">Verify documents before sharing with external agents.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
