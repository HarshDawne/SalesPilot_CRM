"use client";

import React, { useState } from 'react';
import { X, Copy, Check, MessageSquareCode, Send, MessageCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { Render3D } from '@/types/render';

interface ShareRenderModalProps {
    render: Render3D;
    onClose: () => void;
}

export function ShareRenderModal({
    render,
    onClose
}: ShareRenderModalProps) {
    const [copied, setCopied] = useState(false);
    
    // In a real app, this would be a secure view-only URL
    const publicUrl = `https://crm.builder.com/view/render/${render.id}`;
    
    const handleCopy = () => {
        navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareWhatsApp = () => {
        const message = `Check out this 3D Render: ${render.name}\nView here: ${publicUrl}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };

    const shareTelegram = () => {
        const message = `Check out this 3D Render: ${render.name}`;
        window.open(`https://t.me/share/url?url=${encodeURIComponent(publicUrl)}&text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-copper/10 text-copper flex items-center justify-center">
                            <MessageSquareCode size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 leading-tight">Share 3D Render</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{render.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Visual Preview */}
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner">
                        <img 
                            src={render.thumbnailUrl || '/api/placeholder/800/450'} 
                            alt={render.name} 
                            className="w-full h-full object-cover opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white">
                                <ExternalLink size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Share Options */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={shareWhatsApp}
                            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold text-sm hover:bg-emerald-100 transition-all group"
                        >
                            <MessageCircle size={18} className="group-hover:scale-110 transition-transform" />
                            WhatsApp
                        </button>
                        <button
                            onClick={shareTelegram}
                            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 font-bold text-sm hover:bg-sky-100 transition-all group"
                        >
                            <Send size={18} className="group-hover:scale-110 transition-transform" />
                            Telegram
                        </button>
                    </div>

                    {/* Link Section */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Secure View-Only Link</label>
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                readOnly
                                value={publicUrl}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500 pr-24 outline-none font-medium"
                            />
                            <button
                                onClick={handleCopy}
                                className={`absolute right-1 text-xs font-bold px-4 py-2 rounded-lg transition-all flex items-center gap-2 h-[42px] ${
                                    copied ? 'bg-green-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
                                }`}
                            >
                                {copied ? (
                                    <>
                                        <Check size={14} /> Copied
                                    </>
                                ) : (
                                    <>
                                        <Copy size={14} /> Copy
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Notice */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
                    <ShieldCheck size={18} className="text-slate-400" />
                    <p className="text-[10px] text-slate-400 font-medium">
                        This link provides <span className="text-slate-600 font-bold">read-only access</span> to this specific render. Clients cannot modify or delete any property data.
                    </p>
                </div>
            </div>
        </div>
    );
}
