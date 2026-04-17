"use client";

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface UnsavedChangesModalProps {
    isOpen: boolean;
    onDiscard: () => void;
    onSave: () => void;
    onCancel: () => void;
}

export function UnsavedChangesModal({ isOpen, onDiscard, onSave, onCancel }: UnsavedChangesModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onCancel} />

            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-4 mx-auto">
                        <AlertTriangle size={24} />
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Unsaved Changes</h3>
                    <p className="text-sm text-slate-500 text-center leading-relaxed">
                        You have unsaved changes in this blueprint. Leaving now will discard your progress.
                    </p>
                </div>

                <div className="p-6 pt-0 flex flex-col gap-3">
                    <button
                        onClick={onSave}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-900/10"
                    >
                        Save Draft & Leave
                    </button>
                    <button
                        onClick={onDiscard}
                        className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors"
                    >
                        Discard Changes
                    </button>
                    <button
                        onClick={onCancel}
                        className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
