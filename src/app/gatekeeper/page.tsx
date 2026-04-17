"use client";

import { useState } from "react";
import { Scan, CheckCircle, XCircle, Search, Clock, ShieldCheck } from "lucide-react";

export default function GatekeeperPage() {
    const [scanId, setScanId] = useState("");
    const [status, setStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [visitor, setVisitor] = useState<any>(null);

    const handleScan = () => {
        // Mock Validation Logic
        if (scanId.toLowerCase().includes("visit")) {
            setVisitor({
                name: "Rahul Deshmukh",
                project: "Skyline Towers",
                count: 3,
                time: "10:30 AM",
                agent: "Sarah Wilson"
            });
            setStatus('SUCCESS');
        } else {
            setStatus('ERROR');
        }
    };

    const reset = () => {
        setScanId("");
        setStatus('IDLE');
        setVisitor(null);
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans">

            {/* Header */}
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="text-emerald-400" size={24} />
                    <div>
                        <h1 className="font-bold text-lg leading-none">GateKeeper</h1>
                        <p className="text-[10px] text-slate-400">Security Access Control</p>
                    </div>
                </div>
                <div className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded font-mono">
                    GATE-01
                </div>
            </div>

            <div className="flex-1 flex flex-col p-6">

                {status === 'IDLE' && (
                    <div className="flex-1 flex flex-col justify-center items-center space-y-8">
                        <div className="relative">
                            <div className="w-64 h-64 border-2 border-dashed border-slate-600 rounded-2xl flex items-center justify-center bg-slate-800/50 relative overflow-hidden">
                                <Scan size={64} className="text-slate-400 opacity-50" />
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent animate-scan"></div>
                            </div>
                        </div>

                        <div className="w-full max-w-xs">
                            <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">Enter Pass ID / Scan QR</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-emerald-500 font-mono text-center tracking-widest uppercase"
                                    placeholder="VISIT-XXXX"
                                    value={scanId}
                                    onChange={(e) => setScanId(e.target.value)}
                                />
                                <button
                                    onClick={handleScan}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-lg font-bold"
                                >
                                    <Search size={20} />
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 mt-4 text-center">Use camera to scan Visitor QR Pass</p>
                        </div>
                    </div>
                )}

                {status === 'SUCCESS' && visitor && (
                    <div className="flex-1 flex flex-col justify-center items-center animate-in zoom-in duration-300">
                        <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/20">
                            <CheckCircle size={48} className="text-white" />
                        </div>

                        <h2 className="text-2xl font-bold text-emerald-400 mb-1">Access Granted</h2>
                        <p className="text-slate-400 text-sm mb-8">Visitor Verified Successfully</p>

                        <div className="w-full bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 bg-emerald-500/20 rounded-bl-xl">
                                <span className="text-xs font-bold text-emerald-400 uppercase">Valid Pass</span>
                            </div>

                            <div>
                                <label className="text-xs text-slate-500 uppercase">Visitor Name</label>
                                <div className="text-xl font-bold">{visitor.name}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase">Project</label>
                                    <div className="font-medium text-slate-200">{visitor.project}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase">Guests</label>
                                    <div className="font-medium text-slate-200">{visitor.count} Persons</div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-700">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                                        {visitor.agent.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase">Assigned Agent</div>
                                        <div className="font-bold text-sm">{visitor.agent}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button onClick={reset} className="mt-8 w-full py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-slate-400">
                            Scan Next Visitor
                        </button>
                    </div>
                )}

                {status === 'ERROR' && (
                    <div className="flex-1 flex flex-col justify-center items-center animate-in shake duration-300">
                        <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-red-500/20">
                            <XCircle size={48} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-red-400 mb-1">Access Denied</h2>
                        <p className="text-slate-400 text-sm mb-8">Invalid or Expired Pass ID</p>

                        <button onClick={reset} className="w-full max-w-xs py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-bold text-white">
                            Try Again
                        </button>
                    </div>
                )}

            </div>

            <div className="p-4 text-center text-[10px] text-slate-600">
                Powered by HyperSell OS • Security Module
            </div>

        </div>
    );
}
