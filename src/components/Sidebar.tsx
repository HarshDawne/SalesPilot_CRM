"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Calendar, Settings, LogOut, Menu, Database, Phone, Building2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
    return (
        <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col border-r border-slate-800 shadow-2xl z-10">
            <div className="p-6 border-b border-slate-800/50">
                <h1 className="text-2xl font-bold font-heading tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                    HyperSell
                </h1>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                <NavLink href="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
                <NavLink href="/leads" icon={<Users size={20} />} label="Leads" />
                <NavLink href="/communication" icon={<Phone size={20} />} label="Communication Engine" />
                <NavLink href="/calendar" icon={<Calendar size={20} />} label="Calendar" />
                <NavLink href="/properties" icon={<Building2 size={20} />} label="Properties" />
                <NavLink href="/properties/intelligence" icon={<TrendingUp size={20} />} label="Intelligence" />
                <NavLink href="/settings" icon={<Settings size={20} />} label="Settings" />
                <NavLink href="/debug" icon={<Database size={20} />} label="Debug Data" />
            </nav>

            <div className="p-4 border-t border-slate-800/50">
                <button className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all group">
                    <LogOut size={20} className="group-hover:text-red-400 transition-colors" />
                    <span className="font-medium">Sign Out</span>
                </button>
            </div>
        </aside>
    );
}

export function MobileHeader() {
    return (
        <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-20 shadow-md">
            <h1 className="text-lg font-bold font-heading bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">HyperSell</h1>
            <button className="p-2 text-slate-300 hover:text-white"><Menu size={24} /></button>
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
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                isActive
                    ? "text-indigo-100 bg-indigo-500/10 border border-indigo-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            )}
        >
            <span className={cn("transition-colors", isActive ? "text-indigo-400" : "group-hover:text-indigo-400")}>
                {icon}
            </span>
            <span className="font-medium">{label}</span>
        </Link>
    );
}
