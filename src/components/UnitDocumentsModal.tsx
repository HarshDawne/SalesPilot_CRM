"use client";

import { FileText, X, Download, Eye, ShieldCheck, Clock, User } from "lucide-react";
import { PropertyDocument } from "@/types/property";

interface UnitDocumentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    unit: any;
    documents?: PropertyDocument[]; // Support passing real docs later
}

export default function UnitDocumentsModal({ isOpen, onClose, unit, documents = [] }: UnitDocumentsModalProps) {
    if (!isOpen || !unit) return null;

    // Use passed documents or fallback to mock if empty (for dev/preview)
    const displayDocs = documents.length > 0 ? documents : [
        { id: '1', name: "Booking Application Form", category: "OTHER", fileSize: 2400000, uploadedAt: "2024-10-12", status: "Verified" },
        { id: '2', name: "Payment Receipt - Token", category: "OTHER", fileSize: 1100000, uploadedAt: "2024-10-12", status: "Verified" },
        { id: '3', name: "KYC Documents", category: "OTHER", fileSize: 4500000, uploadedAt: "2024-10-13", status: "Pending" },
        { id: '4', name: "Allotment Letter", category: "OTHER", fileSize: 1800000, uploadedAt: "2024-10-15", status: "Draft" },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="border-b border-slate-100 p-6 flex justify-between items-start bg-slate-50/30">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-xl font-bold text-slate-900">Unit {unit.unitNumber} Documents</h2>
                            <span className="badge-pill bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20">
                                {unit.status}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 flex items-center gap-2">
                            <User size={14} />
                            Booked by: <span className="font-medium text-slate-700">{unit.reservation?.reservedBy || "Unknown Lead"}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {displayDocs.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p>No documents uploaded yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {displayDocs.map((doc: any) => (
                                <div key={doc.id || doc.name} className="group flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-slate-50/50 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium text-slate-900">{doc.name}</h3>
                                                {doc.status === 'Verified' && (
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wide flex items-center gap-1">
                                                        <ShieldCheck size={10} /> Verified
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                                                <span>{doc.type || 'PDF'}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                <span>{doc.fileSize ? (doc.fileSize / 1024 / 1024).toFixed(1) : '0'} MB</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                <span className="flex items-center gap-1">
                                                    <Clock size={10} /> {new Date(doc.uploadedAt || Date.now()).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors" title="View">
                                            <Eye size={18} />
                                        </button>
                                        <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors" title="Download">
                                            <Download size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
