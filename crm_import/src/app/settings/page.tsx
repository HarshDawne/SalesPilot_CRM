"use client";

import { User, Bell, Shield, Smartphone } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold font-heading text-slate-900 mb-8">Settings</h1>

            <div className="space-y-6">
                {/* Profile Section */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <User size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Profile Settings</h3>
                            <p className="text-sm text-slate-500">Manage your account information</p>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <input type="text" defaultValue="Admin User" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input type="email" defaultValue="admin@hypersell.com" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                            </div>
                        </div>
                        <button className="btn-primary">Save Changes</button>
                    </div>
                </div>

                {/* Notifications */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                            <Bell size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Notifications</h3>
                            <p className="text-sm text-slate-500">Configure how you receive alerts</p>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-slate-900">Email Notifications</p>
                                <p className="text-sm text-slate-500">Receive daily summaries and alerts</p>
                            </div>
                            <input type="checkbox" defaultChecked className="toggle" />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-slate-900">WhatsApp Alerts</p>
                                <p className="text-sm text-slate-500">Get instant lead updates on WhatsApp</p>
                            </div>
                            <input type="checkbox" defaultChecked className="toggle" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
