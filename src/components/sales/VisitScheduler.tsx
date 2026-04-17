"use client";

import { useState } from "react";
import { Calendar, Clock, MapPin, Check, X } from "lucide-react";

interface VisitSchedulerProps {
    isOpen: boolean;
    onClose: () => void;
    leadName?: string;
    leadId?: string;
}

export function VisitScheduler({ isOpen, onClose, leadName }: VisitSchedulerProps) {
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [project, setProject] = useState("");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="font-bold text-lg text-slate-900">Schedule Site Visit</h3>
                        <p className="text-sm text-slate-500">For {leadName}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Project</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 text-slate-400" size={18} />
                            <select
                                className="w-full pl-10 p-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 appearance-none"
                                value={project}
                                onChange={(e) => setProject(e.target.value)}
                            >
                                <option value="">Select Project</option>
                                <option value="Skyline Towers">Skyline Towers</option>
                                <option value="Green Valley">Green Valley Villas</option>
                                <option value="Ocean Heights">Ocean Heights</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                <input
                                    type="date"
                                    className="w-full pl-10 p-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                <input
                                    type="time"
                                    className="w-full pl-10 p-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
                        <Clock size={14} className="mt-0.5 shrink-0" />
                        Note: Cab pickup will be auto-scheduled 1 hour prior to visit time.
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm flex items-center gap-2"
                        onClick={onClose}
                    >
                        <Check size={18} /> Confirm Visit
                    </button>
                </div>
            </div>
        </div>
    );
}
