"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PropertyForm from "@/components/properties/PropertyForm";
import { Property } from "@/types/property";

export default function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProperty();
    }, [id]);

    const fetchProperty = async () => {
        try {
            const res = await fetch(`/api/properties/${id}`);
            const data = await res.json();
            if (data.success) {
                // Ensure array fields initialized
                const p = data.data;
                setProperty({
                    ...p,
                    highlights: p.highlights || [],
                    amenities: p.amenities || []
                });
            }
        } catch (error) {
            console.error("Failed to fetch property", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!property) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col gap-4">
                <p className="text-slate-500">Property not found</p>
                <Link href="/properties" className="text-indigo-600 hover:underline">Back to Properties</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href={`/properties/${id}`} className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-600">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 font-heading">Edit Property</h1>
                        <p className="text-slate-500 text-sm">Update property details.</p>
                    </div>
                </div>

                <PropertyForm initialData={property} isEditMode={true} />
            </div>
        </div>
    );
}
