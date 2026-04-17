"use client";

import React, { useState } from 'react';
import { BlueprintUnit, UnitStatus, BlueprintDocument } from '@/lib/types/blueprint';
import { X, Save, FileText, Trash2, Plus, LayoutGrid, Grid3X3 } from 'lucide-react';
import { ThreeDRenderSection } from '@/components/blueprint/ThreeDRenderSection';
import { RequestRenderModal } from '@/components/blueprint/RequestRenderModal';
import { ShareRenderModal } from '@/components/blueprint/ShareRenderModal';

interface UnitEditorModalProps {
    propertyId: string;
    towerId: string;
    unit: BlueprintUnit;
    onClose: () => void;
    onSave: (updates: Partial<BlueprintUnit>) => void;
    isReadOnly?: boolean;
}

export function UnitEditorModal({ propertyId, towerId, unit, onClose, onSave, isReadOnly = false }: UnitEditorModalProps) {
    const [form, setForm] = useState<BlueprintUnit>({ ...unit });
    const [requestModalOpen, setRequestModalOpen] = useState(false);
    const [shareModalRender, setShareModalRender] = useState<any>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const hasChanges = JSON.stringify(unit) !== JSON.stringify(form);

    const handleSave = () => {
        if (!hasChanges) return;
        onSave(form);
        onClose();
    };

    const handleAddDocClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const newDocs = Array.from(files).map(file => ({
            id: crypto.randomUUID(),
            name: file.name,
            type: file.type.includes('image') ? 'IMG' : 'PDF' as any,
            url: URL.createObjectURL(file)
        }));

        setForm(prev => ({
            ...prev,
            documents: [...prev.documents, ...newDocs]
        }));
        e.target.value = '';
    };

    const handleRemoveDoc = (docId: string) => {
        setForm(prev => ({
            ...prev,
            documents: prev.documents.filter(d => d.id !== docId)
        }));
    };

    const handleUpdateDoc = (docId: string, updates: Partial<BlueprintDocument>) => {
        setForm(prev => ({
            ...prev,
            documents: prev.documents.map(d => d.id === docId ? { ...d, ...updates } : d)
        }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-copper uppercase tracking-widest">Unit Configuration</span>
                        <h3 className="text-lg font-bold text-slate-900">{isReadOnly ? 'View' : 'Edit'} Unit {form.unitNumber}</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-800 transition-colors p-2 hover:bg-slate-200 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit Number</label>
                            <input
                                type="text"
                                value={form.unitNumber}
                                disabled={isReadOnly}
                                onChange={(e) => setForm({ ...form, unitNumber: e.target.value })}
                                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type</label>
                            <select
                                value={form.type}
                                disabled={isReadOnly}
                                onChange={(e) => setForm({ ...form, type: e.target.value })}
                                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                            >
                                <option value="Apartment">Apartment</option>
                                <option value="Studio">Studio</option>
                                <option value="Villa">Villa</option>
                                <option value="Penthouse">Penthouse</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
                            <select
                                value={form.status}
                                disabled={isReadOnly}
                                onChange={(e) => setForm({ ...form, status: e.target.value as UnitStatus })}
                                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                            >
                                <option value="AVAILABLE">Available</option>
                                <option value="BOOKED">Booked</option>
                                <option value="SOLD">Sold</option>
                                <option value="BLOCKED">Blocked</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Configuration</label>
                            <input
                                type="text"
                                value={form.configuration || ''}
                                disabled={isReadOnly}
                                onChange={(e) => setForm({ ...form, configuration: e.target.value })}
                                placeholder="e.g. 2 BHK"
                                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Carpet Area (Sq.ft)</label>
                            <SmartInput
                                value={form.areaSqft}
                                disabled={isReadOnly}
                                onChange={(val) => setForm({ ...form, areaSqft: val })}
                                className="w-full p-2 rounded-lg border border-slate-200 outline-none disabled:bg-slate-50"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Base Price (₹)</label>
                            <SmartInput
                                value={form.price || 0}
                                disabled={isReadOnly}
                                onChange={(val) => setForm({ ...form, price: val })}
                                className="w-full p-2 rounded-lg border border-slate-200 outline-none disabled:bg-slate-50"
                            />
                        </div>
                    </div>

                    {/* Documents Section */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-xs font-bold text-slate-500 uppercase">Documents</label>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                multiple
                            />
                            {!isReadOnly && (
                                <button onClick={handleAddDocClick} className="text-[10px] font-bold px-2 py-1 bg-slate-100 rounded hover:bg-slate-200 flex items-center gap-1">
                                    <Plus size={12} /> Add Doc
                                </button>
                            )}
                        </div>
                        <div className="space-y-3">
                            {form.documents.map((doc) => (
                                <div key={doc.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={doc.name}
                                            disabled={isReadOnly}
                                            onChange={(e) => handleUpdateDoc(doc.id, { name: e.target.value })}
                                            className="text-sm font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 disabled:text-slate-500"
                                        />
                                        <div className="text-[10px] text-slate-400">{doc.type}</div>
                                    </div>
                                    {!isReadOnly && (
                                        <button onClick={() => handleRemoveDoc(doc.id)} className="text-slate-300 hover:text-red-500">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <ThreeDRenderSection
                        renders={form.renders || []}
                        requests={form.renderRequests || []}
                        isReadOnly={isReadOnly}
                        onRequestNew={() => setRequestModalOpen(true)}
                        onView={(r) => r.media[0] && window.open(r.media[0].url, '_blank')}
                        onShare={(r) => setShareModalRender(r)}
                        onDeleteRequest={async (requestId) => {
                            try {
                                const response = await fetch(`/api/render-requests/${requestId}`, {
                                    method: 'DELETE'
                                });
                                const data = await response.json();
                                if (data.success) {
                                    const newRequests = (form.renderRequests || []).filter(r => r.id !== requestId);
                                    setForm(prev => ({ ...prev, renderRequests: newRequests }));
                                    // Propagate update immediately to parent
                                    onSave({ ...form, renderRequests: newRequests });
                                } else {
                                    alert(data.error || 'Failed to delete request');
                                }
                            } catch (error) {
                                console.error('Error deleting render request:', error);
                                alert('Failed to delete request');
                            }
                        }}
                    />
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-500">
                        {isReadOnly ? 'Close' : 'Cancel'}
                    </button>
                    {!isReadOnly && (
                        <button
                            onClick={handleSave}
                            disabled={!hasChanges}
                            className={`px-6 py-2 rounded-lg text-sm font-bold ${hasChanges ? 'bg-copper text-white shadow-lg' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                        >
                            <Save size={16} className="inline mr-2" /> Save Changes
                        </button>
                    )}
                </div>
            </div>

            {requestModalOpen && (
                <RequestRenderModal
                    propertyId={propertyId}
                    towerId={towerId}
                    unitId={form.id}
                    sourceType="UNIT"
                    propertyName="Property" 
                    unitName={form.unitNumber}
                    builderName="Developer"
                    onClose={() => setRequestModalOpen(false)}
                    onSuccess={(data) => {
                        setForm(prev => ({ ...prev, renderRequests: [...(prev.renderRequests || []), data as any] }));
                        onSave({ ...form, renderRequests: [...(form.renderRequests || []), data as any] });
                    }}
                />
            )}

            {shareModalRender && (
                <ShareRenderModal
                    render={shareModalRender}
                    onClose={() => setShareModalRender(null)}
                />
            )}
        </div>
    );
}

function SmartInput({ value, onChange, className, placeholder, disabled }: { value: number, onChange: (v: number) => void, className?: string, placeholder?: string, disabled?: boolean }) {
    const [localValue, setLocalValue] = React.useState(value.toString());
    React.useEffect(() => { setLocalValue(value.toString()); }, [value]);
    const handleBlur = () => {
        const num = parseInt(localValue.replace(/,/g, ''));
        if (!isNaN(num)) onChange(num);
        else setLocalValue(value.toString());
    };
    return (
        <input
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            className={className}
            placeholder={placeholder}
            disabled={disabled}
        />
    );
}
