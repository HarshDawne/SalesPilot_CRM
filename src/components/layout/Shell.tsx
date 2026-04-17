"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function Shell({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Sidebar - Desktop */}
            <div className="hidden lg:block shrink-0">
                <Sidebar />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
                <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

                <main className="flex-1 overflow-auto p-0 relative">
                    {children}
                </main>
            </div>

            {/* Mobile Sidebar Overlay (Placeholder for future mobile logic) */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden flex">
                    <div className="relative flex-1 w-full max-w-xs">
                        <Sidebar />
                    </div>
                    <div
                        className="bg-black/50 flex-1 backdrop-blur-sm"
                        onClick={() => setSidebarOpen(false)}
                    />
                </div>
            )}
        </div>
    );
}
