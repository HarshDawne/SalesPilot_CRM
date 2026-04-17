"use client";

import { useState, useEffect } from "react";
import { Phone, MessageCircle, X, Mic, Send, Minimize2, Sparkles, AlertCircle } from "lucide-react";

interface CommunicationConsoleProps {
    leadName?: string;
    leadPhone?: string;
    isOpen: boolean;
    onClose: () => void;
}

export function CommunicationConsole({ leadName, leadPhone, isOpen, onClose }: CommunicationConsoleProps) {
    const [isMinimized, setIsMinimized] = useState(false);
    const [mode, setMode] = useState<'CALL' | 'WHATSAPP' | 'AI_ASSISTANT'>('CALL');
    const [aiScript, setAiScript] = useState("Generating personalized script...");
    const [loadingScript, setLoadingScript] = useState(false);

    // Fetch AI Script when AI tab is opened
    useEffect(() => {
        if (mode === 'AI_ASSISTANT' && leadName) {
            setLoadingScript(true);
            setAiScript("Analyzing lead profile and generating script...");

            // Dynamic import to avoid loading AI service if not used
            import('@/modules/ai/ai-service').then(async (mod) => {
                try {
                    const script = await mod.AIService.generateScript({
                        name: leadName,
                        preferences: { configuration: '3BHK' } // Mock context
                    }, 'INTRO');
                    setAiScript(script);
                } catch (e) {
                    setAiScript("Failed to generate script. Please try again.");
                } finally {
                    setLoadingScript(false);
                }
            });
        }
    }, [mode, leadName]);

    if (!isOpen) return null;

    if (isMinimized) {
        return (
            <div className="fixed bottom-4 right-4 bg-indigo-600 text-white p-3 rounded-full shadow-lg cursor-pointer flex items-center gap-2 z-50 animate-bounce" onClick={() => setIsMinimized(false)}>
                <Phone size={20} />
                <span className="font-bold text-sm">On Call: {leadName}</span>
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden max-h-[600px] animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
                <div>
                    <h3 className="font-bold">{leadName || 'Unknown Lead'}</h3>
                    <p className="text-xs text-slate-400">{leadPhone}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsMinimized(true)} className="p-1 hover:bg-slate-800 rounded"><Minimize2 size={16} /></button>
                    <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded"><X size={16} /></button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 shrink-0">
                <button
                    className={`flex-1 p-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${mode === 'CALL' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
                    onClick={() => setMode('CALL')}
                >
                    <Phone size={16} /> Call
                </button>
                <button
                    className={`flex-1 p-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${mode === 'WHATSAPP' ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
                    onClick={() => setMode('WHATSAPP')}
                >
                    <MessageCircle size={16} /> Chat
                </button>
                <button
                    className={`flex-1 p-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${mode === 'AI_ASSISTANT' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
                    onClick={() => setMode('AI_ASSISTANT')}
                >
                    <Sparkles size={16} /> AI
                </button>
            </div>

            {/* Content */}
            <div className="p-4 bg-slate-50 flex-1 overflow-y-auto min-h-[300px]">
                {mode === 'CALL' && (
                    <div className="flex flex-col items-center justify-center h-full space-y-6">
                        <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center animate-pulse">
                            <Phone size={40} className="text-indigo-600" />
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-bold text-slate-900">Calling...</p>
                            <p className="text-sm text-slate-500">Connecting via Cloud Telephony</p>
                        </div>
                        <div className="flex gap-4">
                            <button className="p-4 bg-slate-200 rounded-full hover:bg-slate-300 text-slate-600"><Mic size={24} /></button>
                            <button className="p-4 bg-red-500 rounded-full hover:bg-red-600 text-white shadow-lg shadow-red-200" onClick={onClose}><Phone size={24} className="rotate-135" /></button>
                        </div>

                        <div className="w-full mt-4">
                            <textarea placeholder="Call Notes..." className="w-full p-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-500" rows={3}></textarea>
                        </div>
                    </div>
                )}

                {mode === 'WHATSAPP' && (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 space-y-2 mb-4 overflow-y-auto max-h-[200px]">
                            <div className="bg-white p-2 rounded-lg text-xs text-slate-500 shadow-sm border border-slate-100">
                                <strong>Template: Introduction</strong><br />
                                Hi {leadName}, this is from Premium Estates. Saw your enquiry for 3BHK...
                            </div>
                        </div>
                        <div className="mt-auto">
                            <select className="w-full mb-2 p-2 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:ring-1 focus:ring-green-500">
                                <option>Select Template...</option>
                                <option>Project Brochure</option>
                                <option>Site Visit Invite</option>
                                <option>Price Sheet</option>
                            </select>
                            <div className="relative">
                                <input type="text" placeholder="Type message..." className="w-full p-2 pr-10 border border-slate-200 rounded-lg outline-none focus:border-green-500" />
                                <button className="absolute right-2 top-2 text-green-600 hover:text-green-700">
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {mode === 'AI_ASSISTANT' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl text-sm text-purple-900 shadow-sm">
                            <div className="flex items-center gap-2 mb-2 font-bold text-purple-700">
                                <Sparkles size={14} /> AI Suggested Script
                            </div>
                            <p className="italic opacity-90 leading-relaxed font-medium">
                                {loadingScript ? "Thinking..." : `"${aiScript}"`}
                            </p>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                                <AlertCircle size={12} /> Objection Handling
                            </h4>
                            <div className="space-y-2">
                                <button className="w-full text-left p-3 bg-white border border-slate-200 rounded-lg text-xs font-medium hover:border-purple-300 hover:bg-purple-50 transition-colors text-slate-700">
                                    "Price is too high" → Compare with market avg
                                </button>
                                <button className="w-full text-left p-3 bg-white border border-slate-200 rounded-lg text-xs font-medium hover:border-purple-300 hover:bg-purple-50 transition-colors text-slate-700">
                                    "Not interested now" → Ask for callback time
                                </button>
                                <button className="w-full text-left p-3 bg-white border border-slate-200 rounded-lg text-xs font-medium hover:border-purple-300 hover:bg-purple-50 transition-colors text-slate-700">
                                    "Send details" → Trigger WhatsApp Brochure
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
