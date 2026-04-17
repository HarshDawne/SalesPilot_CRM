"use client";

import { Sparkles, TrendingUp, Zap, Target, ArrowUpRight } from "lucide-react";

export function RightIntelligencePanel() {
    return (
        <aside className="w-80 border-l border-border-subtle bg-bg-muted hidden xl:flex flex-col h-screen h-sticky top-0 overflow-y-auto">
            <div className="p-6 border-b border-border-subtle bg-white">
                <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={16} className="text-ai-accent" />
                    <h2 className="text-sm font-bold text-text-main uppercase tracking-wider">Intelligence Layer</h2>
                </div>
                <p className="text-[11px] text-text-secondary font-medium">Context-aware predictive signals</p>
            </div>

            <div className="p-5 space-y-6">
                {/* AI Score Card */}
                <div className="p-4 bg-linear-to-br from-primary/5 to-ai-accent/5 border border-ai-accent/10 rounded-xl relative overflow-hidden group hover:border-ai-accent/30 transition-all">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:rotate-12 transition-transform">
                        <Zap size={40} className="text-ai-accent" />
                    </div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3">Lead Intent Score</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-text-main tracking-tighter">94</span>
                        <span className="text-xs font-bold text-ai-accent">/ 100</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-ai-accent animate-pulse"></div>
                            <span className="text-[10px] font-bold text-text-secondary">High Velocity Intent</span>
                        </div>
                        <ArrowUpRight size={14} className="text-slate-400" />
                    </div>
                </div>

                {/* Suggested Action */}
                <div className="space-y-3">
                    <h3 className="text-[11px] font-black text-text-secondary uppercase tracking-widest px-1">Suggested Next Step</h3>
                    <button className="w-full card-premium p-4 text-left group hover:border-ai-accent/40 hover:bg-white transition-all">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-blue-50 rounded-lg text-primary">
                                <TrendingUp size={14} />
                            </div>
                            <span className="text-xs font-bold text-text-main">Trigger Negotiation Logic</span>
                        </div>
                        <p className="text-[11px] text-text-secondary leading-relaxed">
                            Lead has viewed the pricing table 4 times in 10 minutes. Send high-intent WhatsApp offer?
                        </p>
                        <div className="mt-3 flex gap-2">
                            <span className="px-2 py-1 bg-ai-accent/10 text-ai-accent text-[9px] font-bold rounded-md uppercase">WhatsApp</span>
                            <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[9px] font-bold rounded-md uppercase underline">Draft Message</span>
                        </div>
                    </button>
                </div>

                {/* Live Performance Stats (Technical Feed) */}
                <div className="space-y-4">
                    <h3 className="text-[11px] font-black text-text-secondary uppercase tracking-widest px-1">Predictive Analytics</h3>
                    <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-[11px] font-medium text-text-secondary">Closure Probability</span>
                                <span className="text-[11px] font-bold text-text-main">82%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: '82%' }}></div>
                            </div>
                    </div>
                    <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-[11px] font-medium text-text-secondary">Engagement Depth</span>
                                <span className="text-[11px] font-bold text-text-main">High</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-ai-accent rounded-full transition-all duration-1000" style={{ width: '92%' }}></div>
                            </div>
                    </div>
                </div>

                {/* Audit Signals */}
                <div className="pt-4 border-t border-border-subtle">
                    <div className="flex items-center gap-2 mb-4">
                        <Target size={14} className="text-slate-400" />
                        <span className="text-[11px] font-bold text-text-secondary uppercase tracking-widest">Active signals</span>
                    </div>
                    <div className="space-y-3">
                        <Signal text="Microsite Session Active" time="Live" active />
                        <Signal text="Price List Downloaded" time="2m ago" />
                        <Signal text="AI Call 12-min Engaged" time="15m ago" />
                    </div>
                </div>
            </div>
        </aside>
    );
}

function Signal({ text, time, active }: { text: string; time: string; active?: boolean }) {
    return (
        <div className="flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-ai-accent animate-pulse' : 'bg-slate-300'}`}></div>
                <span className="text-[11px] font-medium text-text-secondary group-hover:text-text-main transition-colors">{text}</span>
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{time}</span>
        </div>
    );
}
