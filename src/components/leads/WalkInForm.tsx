"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Phone, Mail, MapPin, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { LeadSource } from "@/modules/leads/types";

export function WalkInForm() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = async (data: any) => {
        setSubmitting(true);
        setError(null);
        try {
            const payload = {
                ...data,
                source: LeadSource.WALK_IN,
                status: 'NEW',
                metadata: {
                    walkInTime: new Date().toISOString(),
                    receptionistNote: data.notes
                }
            };

            const res = await fetch('/api/leads/ingest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await res.json();

            if (!res.ok) throw new Error(result.error || 'Failed to create lead');

            setSuccess(true);
            setTimeout(() => {
                router.push('/leads');
            }, 2000); // Redirect after success
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="bg-green-100 p-4 rounded-full mb-4">
                    <CheckCircle className="text-green-600" size={48} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Lead Registered!</h3>
                <p className="text-slate-500 mt-2">Redirecting to leads dashboard...</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <div className="border-b border-slate-100 pb-6 mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Users className="text-indigo-600" />
                    Walk-in Registration
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                    Enter details for visitors at the site office/sales gallery.
                </p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 text-sm">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                    <div className="relative">
                        <Users className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input
                            {...register("name", { required: "Name is required" })}
                            className="pl-10 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="John Doe"
                        />
                    </div>
                    {errors.name && <span className="text-xs text-red-500 mt-1">{String(errors.name.message)}</span>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input
                            {...register("phone", { required: "Phone is required", pattern: { value: /^[0-9]{10}$/, message: "Valid 10-digit number required" } })}
                            className="pl-10 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="9876543210"
                        />
                    </div>
                    {errors.phone && <span className="text-xs text-red-500 mt-1">{String(errors.phone.message)}</span>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email (Optional)</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input
                            {...register("email")}
                            className="pl-10 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="john@example.com"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Configuration</label>
                    <select
                        {...register("preferences.configuration")}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                        <option value="">Select...</option>
                        <option value="1BHK">1 BHK</option>
                        <option value="2BHK">2 BHK</option>
                        <option value="3BHK">3 BHK</option>
                        <option value="4BHK">4 BHK</option>
                        <option value="Villa">Villa</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Receptionist Notes</label>
                <textarea
                    {...register("notes")}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px]"
                    placeholder="Visitor showed interest in the park-facing unit..."
                />
            </div>

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={submitting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
                >
                    {submitting && <Loader2 className="animate-spin" size={18} />}
                    {submitting ? 'Registering...' : 'Register Walk-in'}
                </button>
            </div>
        </form>
    );
}
