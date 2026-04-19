"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
    Search, 
    Zap, 
    ArrowRight, 
    Users, 
    Building2, 
    Calendar, 
    MessageSquare, 
    LayoutDashboard,
    Plus,
    X,
    Sparkles,
    Hash
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
    id: string;
    label: string;
    description: string;
    icon: any;
    action: () => void;
    category: 'Navigation' | 'Actions' | 'Search';
}

export function CommandCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();

    const commands: CommandItem[] = [
        { id: 'dash', label: 'Go to Dashboard', description: 'Real-time performance metrics', icon: LayoutDashboard, category: 'Navigation', action: () => router.push('/') },
        { id: 'leads', label: 'Manage Pipeline', description: 'Access all lead nodes', icon: Users, category: 'Navigation', action: () => router.push('/leads') },
        { id: 'props', label: 'Inventory Nexus', description: 'View property portfolio', icon: Building2, category: 'Navigation', action: () => router.push('/properties') },
        { id: 'comm', label: 'Comms Engine', description: 'Trigger agent sequences', icon: MessageSquare, category: 'Navigation', action: () => router.push('/communication') },
        { id: 'cal', label: 'Temporal Hub', description: 'Visit scheduling & calendar', icon: Calendar, category: 'Navigation', action: () => router.push('/calendar') },
        
        { id: 'add-lead', label: 'Ingest New Lead', description: 'Create a lead node manually', icon: Plus, category: 'Actions', action: () => router.push('/leads/create') },
        { id: 'add-prop', label: 'Register Property', description: 'Add new asset to nexus', icon: Plus, category: 'Actions', action: () => router.push('/properties/create') },
        { id: 'ai-audit', label: 'Trigger AI Audit', description: 'Analyze global lead intent', icon: Sparkles, category: 'Actions', action: () => console.log('Audit triggered') },
    ];

    const filteredCommands = query === "" 
        ? commands 
        : commands.filter(c => 
            c.label.toLowerCase().includes(query.toLowerCase()) || 
            c.category.toLowerCase().includes(query.toLowerCase())
          );

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "k") {
            e.preventDefault();
            setIsOpen((prev) => !prev);
        }
        if (e.key === "Escape") {
            setIsOpen(false);
        }
    }, []);

    useEffect(() => {
        const handleCustomEvent = () => setIsOpen(true);
        window.addEventListener('openCommandCenter', handleCustomEvent);
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener('openCommandCenter', handleCustomEvent);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleKeyDown]);

    useEffect(() => {
        if (isOpen) {
            setSelectedIndex(0);
            setQuery("");
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
    }, [isOpen]);

    const executeCommand = (cmd: CommandItem) => {
        cmd.action();
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
            <div 
                className="absolute inset-0 bg-primary/20 backdrop-blur-md animate-in fade-in duration-300"
                onClick={() => setIsOpen(false)}
            />
            
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-primary/20 overflow-hidden relative animate-in zoom-in-95 duration-200">
                {/* Search Input Area */}
                <div className="flex items-center gap-4 px-6 py-5 border-b border-border-subtle bg-slate-50/50">
                    <Search className="text-primary" size={20} />
                    <input
                        autoFocus
                        type="text"
                        placeholder="Type a command or search context..."
                        className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-text-main placeholder:text-slate-400"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "ArrowDown") {
                                e.preventDefault();
                                setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
                            } else if (e.key === "ArrowUp") {
                                e.preventDefault();
                                setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
                            } else if (e.key === "Enter") {
                                executeCommand(filteredCommands[selectedIndex]);
                            }
                        }}
                    />
                    <div className="flex items-center gap-1">
                        <kbd className="px-2 py-1 bg-white border border-border-subtle rounded-md text-[10px] font-black text-text-secondary shadow-xs">ESC</kbd>
                    </div>
                </div>

                {/* Results Area */}
                <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                    {filteredCommands.length === 0 ? (
                        <div className="py-20 text-center space-y-3 opacity-60">
                            <Hash className="mx-auto text-slate-300" size={32} />
                            <p className="text-[10px] font-black uppercase tracking-widest">No matching command nodes found</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {/* Grouping Logic (Simplified) */}
                            {['Navigation', 'Actions'].map((cat) => {
                                const catItems = filteredCommands.filter(c => c.category === cat);
                                if (catItems.length === 0) return null;

                                return (
                                    <div key={cat} className="space-y-1">
                                        <h3 className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">{cat}</h3>
                                        {catItems.map((cmd) => {
                                            const globalIndex = filteredCommands.indexOf(cmd);
                                            const active = selectedIndex === globalIndex;
                                            
                                            return (
                                                <div
                                                    key={cmd.id}
                                                    className={cn(
                                                        "flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all",
                                                        active ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.01]" : "hover:bg-slate-50"
                                                    )}
                                                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                                                    onClick={() => executeCommand(cmd)}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                                            active ? "bg-white/20" : "bg-slate-100 text-slate-400"
                                                        )}>
                                                            <cmd.icon size={16} />
                                                        </div>
                                                        <div>
                                                            <p className={cn("text-xs font-black uppercase tracking-tight", active ? "text-white" : "text-text-main")}>{cmd.label}</p>
                                                            <p className={cn("text-[10px] font-medium", active ? "text-white/70" : "text-text-secondary")}>{cmd.description}</p>
                                                        </div>
                                                    </div>
                                                    {active && <ArrowRight size={14} className="text-ai-accent" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer Logic Bar */}
                <div className="p-4 border-t border-border-subtle bg-slate-50/50 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5"><kbd className="px-1 py-0.5 bg-white border border-border-subtle rounded shadow-xs">↑↓</kbd> Select</span>
                        <span className="flex items-center gap-1.5"><kbd className="px-1 py-0.5 bg-white border border-border-subtle rounded shadow-xs">ENTER</kbd> Activate</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Zap size={10} className="text-ai-accent" />
                        HyperSell Tactical OS
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #E2E8F0;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}
