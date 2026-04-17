"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Calendar, Settings, LogOut, Menu, Database, Phone, Building2, TrendingUp, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
    return (
        <aside className="w-72 gradient-dark-emerald text-white hidden md:flex flex-col border-r border-emerald-900/30 shadow-2xl z-10">
            <div className="p-6 border-b border-emerald-900/20">
                <h1 className="text-2xl font-bold font-heading tracking-tight text-gradient-emerald">
                    HyperSell
                </h1>
                <p className="text-emerald-100/60 text-xs mt-1 font-medium">Enterprise CRM</p>
            </div>

            <nav className="flex-1 p-5 space-y-1.5">
                <div className="text-[10px] uppercase tracking-widest text-emerald-400/50 font-bold px-4 mb-3">
                    Main Menu
                </div>
                <NavLink href="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
                <NavLink href="/leads" icon={<Users size={20} />} label="Leads" />
                <NavLink href="/communication" icon={<Phone size={20} />} label="Communication" />
                <NavLink href="/calendar" icon={<Calendar size={20} />} label="Calendar" />

                <div className="pt-4 pb-2">
                    <div className="text-[10px] uppercase tracking-widest text-emerald-400/50 font-bold px-4 mb-3">
                        Inventory
                    </div>
                </div>
                <NavLink href="/properties" icon={<Building2 size={20} />} label="Properties" />
                <NavLink href="/properties/intelligence" icon={<TrendingUp size={20} />} label="Intelligence" />

                <div className="pt-4 pb-2">
                    <div className="text-[10px] uppercase tracking-widest text-emerald-400/50 font-bold px-4 mb-3">
                        System
                    </div>
                </div>
                <NavLink href="/settings" icon={<Settings size={20} />} label="Settings" />
                <NavLink href="/debug" icon={<Database size={20} />} label="Debug Data" />

                <div className="pt-4 pb-2">
                    <div className="text-[10px] uppercase tracking-widest text-emerald-400/50 font-bold px-4 mb-3">
                        Studio Admin
                    </div>
                </div>
                <NavLink href="/admin/renders" icon={<LayoutGrid size={20} />} label="3D Renders" />
            </nav>

            <div className="p-5 border-t border-emerald-900/20">
                <button className="flex items-center gap-3 px-4 py-3 w-full text-slate-300 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all group">
                    <LogOut size={20} className="group-hover:text-red-400 transition-colors" />
                    <span className="font-semibold">Sign Out</span>
                </button>
            </div>
        </aside>
    );
}

export function MobileHeader() {
    return (
        <div className="md:hidden gradient-dark-emerald text-white p-4 flex items-center justify-between sticky top-0 z-20 shadow-lg border-b border-emerald-900/20">
            <div>
                <h1 className="text-lg font-bold font-heading text-gradient-emerald">HyperSell</h1>
                <p className="text-emerald-100/50 text-[10px] font-medium">Enterprise CRM</p>
            </div>
            <button className="p-2 text-emerald-200 hover:text-white hover:bg-emerald-800/30 rounded-lg transition-all">
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
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative",
                isActive
                    ? "text-white bg-emerald-600/20 border-l-4 border-l-emerald-500 shadow-[0_0_20px_rgba(5,150,105,0.15)]"
                    : "text-emerald-100/70 hover:text-white hover:bg-emerald-800/20 border-l-4 border-l-transparent hover:border-l-emerald-700/30"
            )}
        >
            <span className={cn(
                "transition-all duration-150 icon-hover",
                isActive ? "text-emerald-400" : "text-emerald-300/70 group-hover:text-emerald-400"
            )}>
                {icon}
            </span>
            <span className="font-semibold text-sm">{label}</span>
            {isActive && (
                <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-glow-pulse"></span>
            )}
        </Link>
    );
}
