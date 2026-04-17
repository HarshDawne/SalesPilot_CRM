"use client";

import React, { useState, useRef } from 'react';
import { X, Upload, Check, Loader2, Image as ImageIcon, Video, Phone, Mail, User, Info } from 'lucide-react';
import { RenderType, RenderMedia } from '@/types/render';

// Assuming these types are defined elsewhere or need to be added.
// For the purpose of this edit, we'll assume they exist or are placeholders.
type BlueprintUnit = any; // Placeholder
type RenderAsset = any; // Placeholder
type RenderRequest = any; // Placeholder

interface RequestRenderModalProps {
    propertyId: string;
    towerId?: string;
    unitId?: string;
    sourceType: 'PROPERTY' | 'TOWER' | 'UNIT';
    propertyName: string;
    unitName?: string;
    builderName: string;
    onClose: () => void;
    onSuccess?: (data: any) => void;
    // New fields added as per instruction
    units?: BlueprintUnit[];
    status?: 'Planning' | 'Construction' | 'Completed';
    possessionDate?: string;
    renders?: RenderAsset[];
    renderRequests?: RenderRequest[];
}

export function RequestRenderModal({
    propertyId,
    towerId,
    unitId,
    sourceType,
    propertyName,
    unitName,
    builderName,
    onClose,
    onSuccess
}: RequestRenderModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Form State
    const [contactName, setContactName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [selectedTypes, setSelectedTypes] = useState<RenderType[]>([]);
    const [notes, setNotes] = useState('');
    const [media, setMedia] = useState<File[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const toggleType = (type: RenderType) => {
        if (selectedTypes.includes(type)) {
            setSelectedTypes(selectedTypes.filter(t => t !== type));
        } else {
            setSelectedTypes([...selectedTypes, type]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setMedia([...media, ...Array.from(e.target.files)]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        setIsSubmitting(true);

        try {
            // 1. Upload Media First (Local API)
            console.log('[RENDER-REQUEST] Uploading media files:', media.map(f => f.name));
            const formData = new FormData();
            media.forEach(file => formData.append('files', file));
            
            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const uploadData = await uploadRes.json();
            
            console.log('[RENDER-REQUEST] Upload response:', uploadData);
            if (!uploadData.success) {
                const errorMsg = uploadData.error || 'Upload failed';
                console.error('[RENDER-REQUEST] Upload failed:', errorMsg);
                throw new Error(errorMsg);
            }

            const mediaUrls = uploadData.urls;

            // 2. Submit Render Request
            const requestData = {
                sourceType,
                propertyId,
                towerId,
                unitId,
                contactDetails: {
                    name: contactName,
                    phone,
                    email
                },
                propertyName,
                builderName,
                requestedRenderTypes: selectedTypes,
                instructions: notes,
                mediaUrls
            };

            console.log('[RENDER-REQUEST] Submitting render request:', requestData);
            const response = await fetch('/api/render-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();
            console.log('[RENDER-REQUEST] Submission response:', { status: response.status, data });
            
            if (data.success) {
                setIsSubmitted(true);
                if (onSuccess) onSuccess(data.data);
            } else {
                const errorMsg = data.error || 'Failed to submit request';
                console.error('[RENDER-REQUEST] Backend error:', errorMsg);
                alert(`Error: ${errorMsg}`);
            }
        } catch (error: any) {
            console.error('[RENDER-REQUEST] CRITICAL ERROR in handleSubmit:', error);
            alert(error.message || 'An error occurred. Please check console for details.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
                <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center animate-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Request Submitted!</h3>
                    <p className="text-slate-500 mb-8 px-4">
                        Your 3D render request for <span className="font-bold text-slate-700">{propertyName}</span> has been received. Our team will contact you shortly to discuss requirements.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    const canSubmit = contactName && phone && email && selectedTypes.length > 0 && media.length > 0;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Request 3D Render</h3>
                        <p className="text-xs text-slate-500 mt-1">Submit property details for high-fidelity 3D visualization</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors bg-white rounded-full border border-slate-100 shadow-sm">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form id="request-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
                    {/* Basic Info (Read-onlyish) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Property Name</label>
                            <div className="text-sm font-bold text-slate-700">{propertyName}</div>
                        </div>
                        <div className="space-y-1.5 p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{unitName ? 'Unit' : 'Builder'}</label>
                            <div className="text-sm font-bold text-slate-700">{unitName || builderName}</div>
                        </div>
                    </div>

                    {/* Contact Person */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-4 h-[1px] bg-slate-200" /> Contact Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                    <User size={14} className="text-slate-400" /> Full Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={contactName}
                                    onChange={(e) => setContactName(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-copper/10 focus:border-copper outline-none transition-all placeholder:text-slate-300"
                                    placeholder="e.g. Rajat Saxena"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                    <Phone size={14} className="text-slate-400" /> Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-copper/10 focus:border-copper outline-none transition-all placeholder:text-slate-300"
                                    placeholder="+91 9876543210"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                    <Mail size={14} className="text-slate-400" /> Business Email *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-copper/10 focus:border-copper outline-none transition-all placeholder:text-slate-300"
                                    placeholder="rajat@builder.com"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Render Types */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-4 h-[1px] bg-slate-200" /> Required Render Types *
                        </h4>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {(['EXTERIOR', 'INTERIOR', 'UNIT_LEVEL', 'AMENITY'] as RenderType[]).map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => toggleType(type)}
                                    className={`p-3 rounded-xl border-2 font-bold text-xs transition-all ${selectedTypes.includes(type)
                                            ? 'bg-copper text-white border-copper shadow-md'
                                            : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300 shadow-sm'
                                        }`}
                                >
                                    {type.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Media Upload */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-4 h-[1px] bg-slate-200" /> Reference Media *
                        </h4>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="group border-2 border-dashed border-slate-200 hover:border-copper/50 hover:bg-copper/5 rounded-2xl p-10 text-center cursor-pointer transition-all"
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                multiple
                                accept="image/*,video/*"
                            />
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-100 group-hover:bg-copper/10 group-hover:text-copper mb-4 transition-colors">
                                <Upload size={28} />
                            </div>
                            <div className="text-sm font-bold text-slate-900 mb-1">Upload Site Photos & Videos</div>
                            <p className="text-xs text-slate-400 max-w-xs mx-auto">
                                Provide photos from all sides (front, back, interior) for accurate rendering.
                            </p>

                            {media.length > 0 && (
                                <div className="mt-6 flex flex-wrap justify-center gap-2">
                                    {media.map((f, i) => (
                                        <div key={i} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 flex items-center gap-2 shadow-sm">
                                            {f.type.startsWith('video') ? <Video size={12} className="text-copper" /> : <ImageIcon size={12} className="text-blue-500" />}
                                            <span className="truncate max-w-[120px]">{f.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                            Specific Instructions (Optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full p-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-copper/10 focus:border-copper outline-none transition-all placeholder:text-slate-300 min-h-[100px]"
                            placeholder="Add details about lighting, materials, specific view angles, etc."
                        />
                    </div>
                </form>

                {/* Footer */}
                <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between sticky bottom-0 z-10">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Info size={14} />
                        <span className="text-[10px] font-medium leading-tight">These details are for manual review. <br />Our team will contact you within 24h.</span>
                    </div>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="request-form"
                            disabled={!canSubmit || isSubmitting}
                            onClick={handleSubmit}
                            className={`px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg transition-all ${canSubmit && !isSubmitting
                                    ? 'bg-copper text-white hover:bg-copper-600 scale-100'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed scale-95'
                                }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" /> Submitting...
                                </>
                            ) : (
                                <>
                                    Submit Request
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
