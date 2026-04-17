"use client";

import { User, Phone, Mail, Building, Briefcase, MapPin, Award, Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Double check auth locally if navigated directly
        const token = localStorage.getItem("salespilot_token");
        if (!token) {
            router.replace("/login");
        } else {
            setIsLoading(false);
        }
    }, [router]);

    if (isLoading) return null;

    return (
        <div className="max-w-4xl mx-auto p-6 lg:p-10 space-y-8 animate-in fade-in duration-500">
            {/* Header / Banner */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 shadow-xl border border-border-subtle">
                <div className="h-32 bg-gradient-to-r from-primary via-[#011B42] to-ai-accent/30 relative">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                </div>
                
                <div className="px-8 pb-8 pt-0 relative flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:-mt-12">
                    <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg border-4 border-slate-900 shrink-0">
                        <div className="w-full h-full rounded-xl bg-primary flex items-center justify-center overflow-hidden">
                             <img src="https://ui-avatars.com/api/?name=Admin&background=023A8F&color=fff&size=128" alt="User" />
                        </div>
                    </div>
                    
                    <div className="flex-1 text-center sm:text-left mb-2">
                        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                            <h1 className="text-2xl font-black text-white">Admin User</h1>
                            <div className="w-2 h-2 rounded-full bg-ai-accent animate-pulse shadow-[0_0_10px_rgba(0,220,245,0.8)]"></div>
                        </div>
                        <p className="text-secondary font-bold uppercase tracking-widest text-[11px]">Strategic Admin • Senior Closer</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-all border border-white/10">
                            Edit Profile
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Left Column: Personal Info */}
                <div className="space-y-6">
                    <div className="card-premium p-6">
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <User size={16} className="text-primary" /> Core Details
                        </h2>
                        
                        <div className="space-y-4">
                            <InfoRow icon={<Mail size={14} />} label="Email" value="admin@salespilot.com" />
                            <InfoRow icon={<Phone size={14} />} label="Direct Line" value="+91 98765 43210" />
                            <InfoRow icon={<MapPin size={14} />} label="Territory" value="Mumbai South" />
                            <InfoRow icon={<Building size={14} />} label="Department" value="Elite Sales Squad" />
                        </div>
                    </div>

                    <div className="card-premium p-6">
                         <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Award size={16} className="text-ai-accent" /> Specializations
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            <Badge text="Luxury Penthouses" />
                            <Badge text="Pre-Launch Strategy" />
                            <Badge text="Bulk Deals" />
                            <Badge text="HNI Client handling" />
                        </div>
                    </div>
                </div>

                {/* Right Column: Performance Stats */}
                <div className="md:col-span-2 space-y-6">
                    <div className="card-premium p-6">
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Activity size={16} className="text-emerald-500" /> Operational Metrics
                        </h2>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 border border-border-subtle rounded-xl text-center">
                                <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">YTD Revenue Orchestrated</p>
                                <p className="text-2xl font-black text-slate-900">₹ 142 Cr</p>
                            </div>
                            <div className="p-4 bg-slate-50 border border-border-subtle rounded-xl text-center">
                                <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Active Pipeline</p>
                                <p className="text-2xl font-black text-slate-900">₹ 35 Cr</p>
                            </div>
                            <div className="p-4 bg-slate-50 border border-border-subtle rounded-xl text-center">
                                <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Conversion Velocity</p>
                                <p className="text-2xl font-black text-emerald-600">Avg 14 Days</p>
                            </div>
                            <div className="p-4 bg-slate-50 border border-border-subtle rounded-xl text-center">
                                <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Assigned Projects</p>
                                <p className="text-2xl font-black text-primary">4 Active</p>
                            </div>
                        </div>
                    </div>

                    <div className="card-premium p-6">
                         <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Briefcase size={16} className="text-secondary" /> Account Status
                        </h2>
                        
                        <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white mb-4">
                            <div>
                                <p className="font-bold text-sm text-slate-900">Two-Factor Authentication</p>
                                <p className="text-xs text-slate-500">Secured via SalesPilot Authenticator App.</p>
                            </div>
                            <div className="w-10 h-6 bg-emerald-500 rounded-full relative shadow-inner">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                            </div>
                        </div>

                         <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white">
                            <div>
                                <p className="font-bold text-sm text-slate-900">Current Session</p>
                                <p className="text-xs text-slate-500">Windows 11 • Last active: Just now</p>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded uppercase">
                                Active
                            </span>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="text-slate-400">{icon}</div>
            <div className="flex-1">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{label}</p>
                <p className="text-sm font-semibold text-slate-900">{value}</p>
            </div>
        </div>
    );
}

function Badge({ text }: { text: string }) {
    return (
        <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200">
            {text}
        </span>
    );
}
