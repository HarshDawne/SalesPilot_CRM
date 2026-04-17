"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { ArrowLeft, Building2, MapPin, CheckCircle2, Calendar, FileText, Tag, Banknote, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { Property, ProjectStatus } from "@/types/property";

interface PropertyFormProps {
    initialData?: Partial<Property>;
    isEditMode?: boolean;
}

// Simple Zod-like validation or just react-hook-form validation
// For minimizing dependencies, I'll stick to standard react-hook-form validation rules.

export default function PropertyForm({ initialData, isEditMode = false }: PropertyFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const { register, handleSubmit, control, watch, setValue, formState: { errors }, reset } = useForm<Property>({
        defaultValues: {
            isActive: true,
            totalTowers: 1,
            totalUnits: 0,
            gstIncluded: true,
            highlights: [],
            amenities: [],
            ...initialData
        }
    });

    const onSubmit = async (data: Property) => {
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // With z.coerce in the schema, we can send data directly
            // No need for manual number conversion anymore
            const payload = data;

            const url = isEditMode && initialData?.id ? `/api/properties/${initialData.id}` : '/api/properties';
            const method = isEditMode ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (!res.ok || !result.success) {
                // If there are validation details, format them nicely
                if (result.details && Array.isArray(result.details)) {
                    const fieldErrors = result.details
                        .map((detail: any) => {
                            const path = Array.isArray(detail.path) ? detail.path.join('.') : detail.path;
                            return `• ${path}: ${detail.message}`;
                        })
                        .join('\n');

                    throw new Error(`Validation errors:\n${fieldErrors}`);
                }

                throw new Error(result.error || 'Failed to save property');
            }

            // Success Redirect
            router.push(isEditMode ? `/properties/${initialData?.id}` : `/properties/${result.data.id}`);
            router.refresh();

        } catch (err: any) {
            console.error('Form submission error:', err);
            setSubmitError(err.message || "An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper for Amenities/Highlights Input (Simple comma separated for now to array)
    // Actually, let's make it a simple text area that splits by newline or comma

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

            {/* --- SECTION A: BASIC INFO --- */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50/50 p-4 px-6 flex items-center gap-2">
                    <Building2 size={18} className="text-slate-400" />
                    <span className="font-semibold text-slate-700">Basic Information</span>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Property Name <span className="text-red-500">*</span></label>
                        <input
                            {...register("name", { required: "Name is required" })}
                            type="text"
                            placeholder="e.g. Skyline Towers"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        />
                        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Developer Name <span className="text-red-500">*</span></label>
                        <input
                            {...register("developerName", { required: "Developer name is required" })}
                            type="text"
                            placeholder="e.g. Prestige Group"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        />
                        {errors.developerName && <p className="text-xs text-red-500">{errors.developerName.message}</p>}
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Property Type <span className="text-red-500">*</span></label>
                        <select
                            {...register("propertyType", { 
                                required: "Type is required",
                                onChange: (e) => {
                                    // Sync legacy field for backward compatibility
                                    const val = e.target.value;
                                    let legacyVal: any = 'RESIDENTIAL';
                                    if (val === 'Commercial') legacyVal = 'COMMERCIAL';
                                    if (val === 'Mixed-Use') legacyVal = 'MIXED_USE';
                                    setValue('projectType', legacyVal);
                                }
                            })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        >
                            <option value="Residential">Residential</option>
                            <option value="Commercial">Commercial</option>
                            <option value="Mixed-Use">Mixed-Use</option>
                        </select>
                        <input type="hidden" {...register("projectType")} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Construction Status <span className="text-red-500">*</span></label>
                        <select
                            {...register("constructionStatus", { 
                                required: "Status is required",
                                onChange: (e) => {
                                    // Sync legacy field for backward compatibility
                                    const val = e.target.value;
                                    let legacyVal: any = 'PLANNING';
                                    if (val === 'Under Development') legacyVal = 'UNDER_CONSTRUCTION';
                                    if (val === 'Ready for Possession') legacyVal = 'ACTIVE';
                                    setValue('status', legacyVal);
                                }
                            })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        >
                            <option value="Pre-Launch">Pre-Launch</option>
                            <option value="Under Development">Under Development</option>
                            <option value="Ready for Possession">Ready for Possession</option>
                        </select>
                        <input type="hidden" {...register("status")} />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                        <label className="text-sm font-medium text-slate-700">Tagline (Marketing Title)</label>
                        <input
                            {...register("tagline")}
                            type="text"
                            placeholder="e.g. Luxury Living in the Heart of the City"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-sm font-medium text-slate-700">Description</label>
                        <textarea
                            {...register("description")}
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none resize-none"
                            placeholder="Project description, key selling points..."
                        />
                    </div>
                </div>
            </div>

            {/* --- SECTION B: LOCATION --- */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50/50 p-4 px-6 flex items-center gap-2">
                    <MapPin size={18} className="text-slate-400" />
                    <span className="font-semibold text-slate-700">Location</span>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">City <span className="text-red-500">*</span></label>
                        <select
                            {...register("location.city", { required: "City is required" })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none bg-white"
                        >
                            <option value="">Select City</option>
                            <option value="Mumbai">Mumbai</option>
                            <option value="Pune">Pune</option>
                            <option value="Bangalore">Bangalore</option>
                            <option value="Delhi">Delhi</option>
                            <option value="Hyderabad">Hyderabad</option>
                        </select>
                        {errors.location?.city && <p className="text-xs text-red-500">{errors.location.city.message}</p>}
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Locality / Area <span className="text-red-500">*</span></label>
                        <input
                            {...register("location.locality", { required: "Area is required" })}
                            placeholder="e.g. Bandra West"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        />
                        {errors.location?.locality && <p className="text-xs text-red-500">{errors.location.locality.message}</p>}
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Pincode <span className="text-red-500">*</span></label>
                        <input
                            {...register("location.pincode", { required: "Pincode is required" })}
                            placeholder="e.g. 400050"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        />
                        {errors.location?.pincode && <p className="text-xs text-red-500">{errors.location.pincode.message}</p>}
                    </div>

                    <div className="md:col-span-3 space-y-1">
                        <label className="text-sm font-medium text-slate-700">Full Address <span className="text-red-500">*</span></label>
                        <textarea
                            {...register("location.fullAddress", { required: "Address is required" })}
                            rows={2}
                            placeholder="Complete street address"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none resize-none"
                        />
                        {errors.location?.fullAddress && <p className="text-xs text-red-500">{errors.location.fullAddress.message}</p>}
                    </div>
                    <div className="md:col-span-3 space-y-1">
                        <label className="text-sm font-medium text-slate-700">Google Maps URL</label>
                        <input
                            {...register("location.googleMapsUrl")}
                            placeholder="https://maps.google.com/..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* --- SECTION C: INVENTORY CONFIG --- */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50/50 p-4 px-6 flex items-center gap-2">
                    <Building2 size={18} className="text-slate-400" />
                    <span className="font-semibold text-slate-700">Inventory Configuration</span>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Total Towers <span className="text-red-500">*</span></label>
                        <input
                            {...register("totalTowers", { required: "Required" })}
                            type="text"
                            inputMode="numeric"
                            placeholder="1"
                            onInput={(e) => {
                                (e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.replace(/\D/g, '');
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none appearance-none"
                        />
                        {errors.totalTowers && <p className="text-xs text-red-500">{errors.totalTowers.message}</p>}
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Total Units <span className="text-red-500">*</span></label>
                        <input
                            {...register("totalUnits", { required: "Required" })}
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            onInput={(e) => {
                                (e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.replace(/\D/g, '');
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none appearance-none"
                        />
                        {errors.totalUnits && <p className="text-xs text-red-500">{errors.totalUnits.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Min Bedrooms</label>
                        <input
                            {...register("minBedrooms")}
                            type="text"
                            inputMode="numeric"
                            placeholder="e.g. 2"
                            onInput={(e) => {
                                (e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.replace(/\D/g, '');
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none appearance-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Max Bedrooms</label>
                        <input
                            {...register("maxBedrooms")}
                            type="text"
                            inputMode="numeric"
                            placeholder="e.g. 5"
                            onInput={(e) => {
                                (e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.replace(/\D/g, '');
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none appearance-none"
                        />
                    </div>
                </div>
            </div>

            {/* --- SECTION D: REGULATORY & DATES --- */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50/50 p-4 px-6 flex items-center gap-2">
                    <Calendar size={18} className="text-slate-400" />
                    <span className="font-semibold text-slate-700">Regulatory & Dates</span>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">RERA ID <span className="text-red-500">*</span></label>
                        <input
                            {...register("reraId", { required: "RERA ID is required" })}
                            type="text"
                            placeholder="P5180000..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-mono uppercase"
                        />
                        {errors.reraId && <p className="text-xs text-red-500">{errors.reraId.message}</p>}
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Launch Date <span className="text-red-500">*</span></label>
                        <input
                            {...register("launchDate", { required: "Launch Date is required" })}
                            type="date"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        />
                        {errors.launchDate && <p className="text-xs text-red-500">{errors.launchDate.message}</p>}
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Expected Completion <span className="text-red-500">*</span></label>
                        <input
                            {...register("expectedCompletion", { required: "Expected Complt. is required" })}
                            type="date"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        />
                        {errors.expectedCompletion && <p className="text-xs text-red-500">{errors.expectedCompletion.message}</p>}
                    </div>
                </div>
            </div>

            {/* --- SECTION E: PRICING & FINANCE --- */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50/50 p-4 px-6 flex items-center gap-2">
                    <Banknote size={18} className="text-slate-400" />
                    <span className="font-semibold text-slate-700">Pricing & Finance</span>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Starting Price (₹)</label>
                        <input
                            {...register("startingPrice")}
                            type="text"
                            inputMode="numeric"
                            placeholder="e.g. 15000000 for 1.5 Cr"
                            onInput={(e) => {
                                (e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.replace(/\D/g, '');
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none appearance-none"
                        />
                        <p className="text-xs text-slate-400">Enter full amount without commas</p>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Booking Amount (₹)</label>
                        <input
                            {...register("bookingAmount")}
                            type="text"
                            inputMode="numeric"
                            placeholder="e.g. 500000"
                            onInput={(e) => {
                                (e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.replace(/\D/g, '');
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none appearance-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Payment Plan</label>
                        <select
                            {...register("paymentPlanType")}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none bg-white"
                        >
                            <option value="">Select Plan Type</option>
                            <option value="CONSTRUCTION_LINKED">Construction Linked (CLP)</option>
                            <option value="TIME_LINKED">Time Linked</option>
                            <option value="DOWN_PAYMENT">Down Payment</option>
                            <option value="FLEXI">Flexi Plan</option>
                        </select>
                    </div>
                </div>
            </div>


            {/* --- SECTION F: MARKETING --- */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50/50 p-4 px-6 flex items-center gap-2">
                    <ImageIcon size={18} className="text-slate-400" />
                    <span className="font-semibold text-slate-700">Marketing Assets</span>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Primary Image URL</label>
                        <input
                            {...register("primaryImageUrl")}
                            type="text"
                            placeholder="https://..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">Amenities (Comma separated)</label>
                            <Controller
                                name="amenities"
                                control={control}
                                render={({ field }) => (
                                    <textarea
                                        rows={3}
                                        placeholder="Gym, Swimming Pool, Club House..."
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                        value={field.value?.join(", ") || ""}
                                        onChange={(e) => field.onChange(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                                    />
                                )}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">Highlights (Comma separated)</label>
                            <Controller
                                name="highlights"
                                control={control}
                                render={({ field }) => (
                                    <textarea
                                        rows={3}
                                        placeholder="Sea View, 5 mins from Metro..."
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                        value={field.value?.join(", ") || ""}
                                        onChange={(e) => field.onChange(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                                    />
                                )}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {submitError && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
                    <pre className="whitespace-pre-wrap font-sans">{submitError}</pre>
                </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200">
                <Link
                    href={isEditMode && initialData?.id ? `/properties/${initialData.id}` : "/properties"}
                    className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                    Cancel
                </Link>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:shadow-none flex items-center gap-2"
                >
                    {isSubmitting ? (
                        <>Saving...</>
                    ) : (
                        <>
                            <CheckCircle2 size={18} /> {isEditMode ? "Update Property" : "Create Property"}
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
