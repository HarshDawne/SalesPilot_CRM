"use client";

import { QrCode, Calendar, MapPin, Clock } from "lucide-react";

export default function LeadVisitPass() {
    return (
        <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl overflow-hidden border-x border-slate-100 flex flex-col">
            <div className="bg-indigo-600 px-6 pt-8 pb-16 relative">
                <div className="flex justify-between items-center text-white mb-6">
                    <span className="font-bold text-lg tracking-tight">Premium Estates</span>
                    <span className="text-indigo-200 text-xs font-mono border border-indigo-400 px-2 py-0.5 rounded">PASSPORT</span>
                </div>
                <h1 className="text-2xl font-bold text-white mb-1">Site Visit Pass</h1>
                <p className="text-indigo-200 text-sm">Please show this at the security gate.</p>
            </div>

            <div className="px-6 -mt-10 flex-1">
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-100 flex flex-col items-center text-center space-y-6">

                    <div className="w-48 h-48 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-inner">
                        <QrCode size={120} />
                    </div>
                    <p className="font-mono text-sm tracking-widest text-slate-500 font-bold">VISIT-8X29-WING-A</p>

                    <div className="w-full border-t border-slate-100 pt-6 space-y-4">
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase">Date</p>
                                <p className="font-bold text-slate-900">Sat, 14 Dec 2024</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-left">
                            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
                                <Clock size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase">Time</p>
                                <p className="font-bold text-slate-900">10:30 AM - 12:00 PM</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-left">
                            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
                                <MapPin size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase">Location</p>
                                <p className="font-bold text-slate-900">Skyline Towers, Downtown</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center space-y-2">
                    <p className="text-sm text-slate-500">Need help with directions?</p>
                    <button className="text-indigo-600 font-bold text-sm hover:underline">Open in Google Maps</button>
                </div>
            </div>

        </div>
    );
}
