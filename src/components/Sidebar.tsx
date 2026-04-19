"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    LayoutDashboard, Users, Calendar, LogOut, 
    Menu, Building2, TrendingUp, Phone, Sparkles, Search, Bell
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
    return (
        <aside className="w-64 bg-[#011B42] border-r border-[#0A2E63] flex flex-col z-10 relative overflow-hidden h-screen transition-all duration-300">
            {/* Subtle Gradient Glow */}
            <div className="absolute top-0 -left-20 w-40 h-40 bg-secondary/10 blur-[100px] rounded-full pointer-events-none"></div>
            
            <div className="p-6 border-b border-white/5 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-linear-to-br from-secondary to-ai-accent flex items-center justify-center shadow-lg shadow-secondary/20">
                        <TrendingUp size={20} className="text-[#011B42]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold font-heading tracking-tighter text-white">
                            HyperSell
                        </h1>
                        <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-secondary/70">Sales OS 3.0</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                <div className="text-[10px] uppercase tracking-widest text-[#475569] font-bold px-3 mb-4 mt-2">
                    Orchestration
                </div>
                <NavLink href="/" icon={<LayoutDashboard size={18} />} label="Command Center" />
                <NavLink href="/leads" icon={<Users size={18} />} label="Lead Pipeline" />
                <NavLink href="/communication" icon={<Phone size={18} />} label="Campaign Logic" />
                <NavLink href="/calendar" icon={<Calendar size={18} />} label="Visit Calendar" />

                <div className="pt-6 pb-2">
                    <div className="text-[10px] uppercase tracking-widest text-[#475569] font-bold px-3 mb-4">
                        Inventory
                    </div>
                </div>
                <NavLink href="/properties" icon={<Building2 size={18} />} label="PropCatalog" />

            </nav>

            <div className="p-4 border-t border-white/5 bg-black/10 backdrop-blur-sm relative z-10">
                <Link href="/profile" className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 mb-4 group/user cursor-pointer hover:bg-white/10 transition-all">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center border border-white/10 group-hover:border-ai-accent/40 transition-colors overflow-hidden">
                        <img src="https://ui-avatars.com/api/?name=Admin&background=023A8F&color=fff" alt="User" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-bold text-white truncate">Admin User</p>
                        <p className="text-[9px] text-secondary font-bold uppercase tracking-wider">Strategic Admin</p>
                    </div>
                </Link>

                <button 
                    onClick={() => {
                        localStorage.removeItem("salespilot_token");
                        window.location.href = "/login";
                    }}
                    className="flex items-center justify-center gap-2.5 px-3 py-2.5 w-full bg-red-500/5 hover:bg-red-500/10 text-red-400/70 hover:text-red-400 border border-red-500/10 rounded-lg transition-all font-bold text-[10px] group/logout"
                >
                    <LogOut size={14} className="group-hover:logout:-translate-x-1 transition-transform" />
                    <span>TERMINATE OPS</span>
                </button>
            </div>
        </aside>
    );
}

export function MobileHeader() {
    return (
        <div className="md:hidden bg-[#011B42] text-white p-4 flex items-center justify-between sticky top-0 z-20 shadow-lg border-b border-primary/20">
            <div>
                <h1 className="text-lg font-bold font-heading">HyperSell</h1>
                <p className="text-secondary/50 text-[10px] font-medium tracking-widest">REAL ESTATE OS</p>
            </div>
            <button className="p-2 text-secondary hover:text-white hover:bg-white/5 rounded-lg transition-all">
                <Menu size={24} />
            </button>
        </div>
    );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    const pathname = usePathname();
    const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));

    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative text-sm",
                isActive
                    ? "text-white bg-secondary/10"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
        >
            {/* Active Indicator Bar */}
            <div className={cn(
                "absolute left-0 w-1 h-4 rounded-r-full transition-all duration-300",
                isActive ? "bg-ai-accent shadow-[0_0_10px_rgba(0,220,245,0.5)]" : "bg-transparent"
            )} />

            <span className={cn(
                "transition-all duration-200",
                isActive ? "text-ai-accent scale-105" : "text-slate-500 group-hover:text-secondary"
            )}>
                {icon}
            </span>
            <span className={cn(
                "font-bold transition-all",
                isActive ? "translate-x-0.5" : "group-hover:translate-x-0.5"
            )}>{label}</span>
            
            {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-ai-accent animate-pulse"></div>
            )}
        </Link>
    );
}
