"use client";

import { Wallet, Users, ChevronRight, CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function CPDashboard() {
    return (
        <div className="space-y-8">

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Total Commision</p>
                        <h2 className="text-3xl font-bold text-slate-900 mt-1">₹ 4.5 L</h2>
                        <p className="text-xs text-emerald-600 font-bold mt-2">+ ₹50k Pending</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                        <Wallet size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Active Leads</p>
                        <h2 className="text-3xl font-bold text-slate-900 mt-1">14</h2>
                        <p className="text-xs text-blue-600 font-bold mt-2">2 Site Visits Today</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <Users size={24} />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-xl shadow-lg text-white">
                    <h3 className="font-bold text-lg mb-2">Register New Lead</h3>
                    <p className="text-indigo-100 text-sm mb-4">Protect your leads for 90 days. Get instant confirmation.</p>
                    <button className="w-full py-2 bg-white text-indigo-700 font-bold rounded-lg text-sm hover:bg-indigo-50 transition-colors">
                        Add Lead Now
                    </button>
                </div>
            </div>

            {/* My Leads Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800">My Leads Status</h3>
                    <button className="text-sm text-indigo-600 font-medium hover:underline">View All</button>
                </div>

                <div className="divide-y divide-slate-100">
                    {[
                        { name: 'Sameer Khan', date: 'Today', status: 'Site Visit Scheduled', color: 'text-purple-600 bg-purple-50' },
                        { name: 'Anjali Gupta', date: 'Yesterday', status: 'Verification Pending', color: 'text-amber-600 bg-amber-50' },
                        { name: 'Raj Malhotra', date: '12 Dec', status: 'Booking Done', color: 'text-emerald-600 bg-emerald-50' },
                        { name: 'Vivek Oberoi', date: '10 Dec', status: 'Not Interested', color: 'text-slate-500 bg-slate-100' },
                    ].map((lead, i) => (
                        <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-sm">
                                    {lead.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm">{lead.name}</h4>
                                    <p className="text-xs text-slate-500">Reg: {lead.date}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${lead.color}`}>
                                    {lead.status}
                                </span>
                                <ChevronRight size={16} className="text-slate-300" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
