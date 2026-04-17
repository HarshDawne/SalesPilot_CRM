"use client";

import { useState } from "react";
import { Activity } from "@/lib/db";
import { Phone, MessageSquare, Calendar, StickyNote, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityComposerProps {
    leadId: string;
    onActivityAdded: (activity: Activity) => void;
}

export default function ActivityComposer({ leadId, onActivityAdded }: ActivityComposerProps) {
    const [activeTab, setActiveTab] = useState<"note" | "call" | "whatsapp">("note");
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

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
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-100">
                <button
                    onClick={() => setActiveTab("note")}
                    className={cn("flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors", activeTab === "note" ? "bg-gray-50 text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:bg-gray-50")}
                >
                    <StickyNote size={16} /> Note
                </button>
                <button
                    onClick={() => setActiveTab("call")}
                    className={cn("flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors", activeTab === "call" ? "bg-gray-50 text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:bg-gray-50")}
                >
                    <Phone size={16} /> Log Call
                </button>
                <button
                    onClick={() => setActiveTab("whatsapp")}
                    className={cn("flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors", activeTab === "whatsapp" ? "bg-gray-50 text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:bg-gray-50")}
                >
                    <MessageSquare size={16} /> WhatsApp
                </button>
            </div>
            <div className="p-4">
                <textarea
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
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {submitting ? "Saving..." : <>Save <Send size={14} /></>}
                    </button>
                </div>
            </div>
        </div>
    );
}
