"use client";

import { useState, useEffect, useRef } from "react";
import { Activity } from "@/lib/db";
import { Phone, MessageSquare, Calendar, StickyNote, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityComposerProps {
    leadId: string;
    onActivityAdded: (activity: Activity) => void;
    activeTab?: "note" | "call" | "whatsapp";
    onTabChange?: (tab: "note" | "call" | "whatsapp") => void;
}

export default function ActivityComposer({ 
    leadId, 
    onActivityAdded, 
    activeTab: externalTab, 
    onTabChange 
}: ActivityComposerProps) {
    const [localTab, setLocalTab] = useState<"note" | "call" | "whatsapp">("note");
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const activeTab = externalTab || localTab;

    useEffect(() => {
        if (externalTab && externalTab !== localTab) {
            setLocalTab(externalTab);
            // Optional: Focus textarea when tab is changed externally
            setTimeout(() => textareaRef.current?.focus(), 100);
        }
    }, [externalTab]);

    const handleTabClick = (tab: "note" | "call" | "whatsapp") => {
        if (onTabChange) {
            onTabChange(tab);
        } else {
            setLocalTab(tab);
        }
    };

    const handleSubmit = async () => {
        if (!note.trim()) return;
        setSubmitting(true);

        try {
            const typeMap = {
                note: "note",
                call: "manual_call",
                whatsapp: "whatsapp"
            };

            const res = await fetch(`/api/leads/${leadId}/activities`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: typeMap[activeTab],
                    summary: activeTab === "note" ? note : `${activeTab === "call" ? "Logged call" : "Sent WhatsApp"}: ${note}`,
                    payload: { text: note }
                })
            });

            if (res.ok) {
                const newActivity = await res.json();
                onActivityAdded(newActivity);
                setNote("");
            }
        } catch (error) {
            console.error("Failed to add activity", error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div id="activity-composer" className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-100">
                <button
                    onClick={() => handleTabClick("note")}
                    className={cn("flex-1 py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all", activeTab === "note" ? "bg-slate-50 text-blue-600 border-b-2 border-primary" : "text-slate-400 hover:bg-slate-50")}
                >
                    <StickyNote size={14} /> Note
                </button>
                <button
                    onClick={() => handleTabClick("call")}
                    className={cn("flex-1 py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all", activeTab === "call" ? "bg-slate-50 text-blue-600 border-b-2 border-primary" : "text-slate-400 hover:bg-slate-50")}
                >
                    <Phone size={14} /> Log Call
                </button>
                <button
                    onClick={() => handleTabClick("whatsapp")}
                    className={cn("flex-1 py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all", activeTab === "whatsapp" ? "bg-slate-50 text-blue-600 border-b-2 border-primary" : "text-slate-400 hover:bg-slate-50")}
                >
                    <MessageSquare size={14} /> WhatsApp
                </button>
            </div>
            <div className="p-4">
                <textarea
                    ref={textareaRef}
                    className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                    rows={3}
                    placeholder={activeTab === "note" ? "Add a note..." : activeTab === "call" ? "Call summary..." : "Message content..."}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                />
                <div className="flex justify-end mt-2">
                    <button
                        onClick={handleSubmit}
                        disabled={!note.trim() || submitting}
                        className="btn-primary py-2 px-6 text-xs flex items-center gap-2"
                    >
                        {submitting ? "SAVING..." : <>SAVE ENTRY <Send size={14} /></>}
                    </button>
                </div>
            </div>
        </div>
    );
}
