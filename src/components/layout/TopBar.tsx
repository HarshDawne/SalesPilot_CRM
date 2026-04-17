"use client";

import { Search, Bell, Sparkles, Command } from "lucide-react";

export function TopBar() {
    return (
        <header className="h-14 border-b border-border-subtle bg-white/80 backdrop-blur-md sticky top-0 z-20 px-6 flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
                {/* Global Command Trigger */}
                <button className="flex items-center gap-3 px-3 py-1.5 bg-slate-100/50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 transition-all w-full max-w-md group">
                    <Search size={16} className="group-hover:text-primary transition-colors" />
                    <span className="text-xs font-medium">Search anything or trigger action...</span>
                    <div className="ml-auto flex items-center gap-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-400">
                        <Command size={10} />
                        <span>K</span>
                    </div>
                </button>
            </div>

            <div className="flex items-center gap-3">
                <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>

                <div className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-[10px] text-text-secondary border border-border-subtle group-hover:bg-primary/5 transition-colors">HD</div>
                </div>
            </div>
        </header>
    );
}
