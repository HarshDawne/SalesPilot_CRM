"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    BarChart3,
    Users,
    Phone,
    Building2,
    ClipboardCheck,
    Settings,
    LogOut,
    LayoutDashboard,
    Megaphone
} from "lucide-react";

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Leads', href: '/leads', icon: Users },
    { name: 'Communication Engine', href: '/communication', icon: Megaphone },
    { name: 'Inventory', href: '/properties', icon: Building2 },
    { name: 'Calendar', href: '/calendar', icon: ClipboardCheck }, // Added Calendar
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex flex-col h-full w-64 bg-slate-900 text-white border-r border-slate-800">
            {/* Branding */}
            <div className="h-16 flex items-center px-6 border-b border-slate-800">
                <div className="bg-indigo-600 p-1.5 rounded-lg mr-3">
                    <Building2 size={24} className="text-white" />
                </div>
                <div>
                    <h1 className="font-bold text-lg tracking-tight">Lead OS</h1>
                    <p className="text-xs text-slate-400">Enterprise Edition</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
                    Main Menu
                </div>
                {navigation.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`
                group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                ${isActive
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }
              `}
                        >
                            <item.icon
                                className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}
                            />
                            {item.name}
                        </Link>
                    );
                })}

                <div className="mt-8 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
                    System
                </div>
                <Link
                    href="/settings"
                    className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                    <Settings className="mr-3 h-5 w-5 text-slate-400 group-hover:text-white" />
                    Settings
                </Link>
            </nav>

            {/* User Footer */}
            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold">
                        JD
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate">John Doe</p>
                        <p className="text-xs text-slate-400 truncate">Sales Manager</p>
                    </div>
                    <button className="text-slate-400 hover:text-white">
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
