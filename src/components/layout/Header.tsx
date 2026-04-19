"use client";

import { Bell, Search, Menu, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
    const router = useRouter();

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
            {/* Left Nav */}
            <div className="flex items-center gap-4 flex-1">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md"
                >
                    <Menu size={20} />
                </button>
                <button 
                    onClick={() => router.back()}
                    className="hidden lg:flex p-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
                >
                    <ArrowLeft size={18} />
                </button>
            </div>

            {/* Center Search */}
            <div className="flex-none flex justify-center">
                <button 
                    onClick={() => window.dispatchEvent(new Event('openCommandCenter'))}
                    className="hidden md:flex items-center bg-slate-100/50 hover:bg-slate-100 rounded-lg px-3 py-2 w-96 border border-slate-200 transition-all text-left"
                >
                    <Search size={18} className="text-slate-400 mr-2" />
                    <span className="text-sm w-full text-slate-500">Search leads, inventory, or campaigns...</span>
                    <span className="text-xs font-bold text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5 ml-auto">⌘K</span>
                </button>
            </div>

            {/* Right Profile */}
            <div className="flex items-center justify-end gap-4 flex-1">
                <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
                </button>
            </div>
        </header>
    );
}
