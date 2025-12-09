"use client";

import { useState, useEffect } from 'react';
import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Sparkles, AlertCircle } from "lucide-react";
import PropertyForm from "@/components/properties/PropertyForm";
import { BrochureExtractedData } from '@/types/brochure-extraction';

export default function NewPropertyPage() {
    const searchParams = useSearchParams();
    const extractionId = searchParams.get('extractionId');
    
    const [prefillData, setPrefillData] = useState<Partial<any> | null>(null);
    const [loading, setLoading] = useState(!!extractionId);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (extractionId) {
            fetchExtractedData(extractionId);
        }
    }, [extractionId]);

    const fetchExtractedData = async (id: string) => {
        try {
            const response = await fetch(`/api/properties/import?extractionId=${id}`);
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to load extraction data');
            }

            // Map extracted data to property form format
            const mapped = mapExtractedDataToForm(result.data);
            setPrefillData(mapped);
        } catch (err: any) {
            console.error('Failed to fetch extraction:', err);
            setError(err.message || 'Could not load AI-extracted data');
        } finally {
            setLoading(false);
        }
    };

    const mapExtractedDataToForm = (data: BrochureExtractedData): Partial<any> => {
        return {
            // Basic Info
            name: data.name,
            developerName: data.developerName,
            tagline: data.tagline,
            description: data.description,
            projectType: data.projectType,
            status: data.status || 'UNDER_CONSTRUCTION',
            
            // Location
            location: {
                city: data.city,
                locality: data.locality,
                pincode: data.pincode,
                fullAddress: data.fullAddress,
                landmark: data.landmark,
                googleMapsUrl: data.googleMapsUrl,
            },
            
            // Inventory
            totalTowers: data.totalTowers,
            totalUnits: data.totalUnits,
            minBedrooms: data.minBedrooms,
            maxBedrooms: data.maxBedrooms,
            minAreaSqft: data.minAreaSqft,
            maxAreaSqft: data.maxAreaSqft,
            
            // Regulatory
            reraId: data.reraId,
            reraUrl: data.reraUrl,
            expectedCompletion: data.expectedCompletion,
            launchDate: data.launchDate,
            possessionFrom: data.possessionFrom,
            
            // Pricing
            startingPrice: data.startingPrice,
            pricePerSqftFrom: data.pricePerSqftFrom,
            pricePerSqftTo: data.pricePerSqftTo,
            bookingAmount: data.bookingAmount,
            paymentPlanType: data.paymentPlanType,
            
            // Marketing
            brochureUrl: data.brochureUrl,
            amenities: data.amenities || [],
            highlights: data.highlights || [],
        };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-slate-600 font-medium">Loading AI-extracted data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/properties" className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-600">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 font-heading">Add New Property</h1>
                        <p className="text-slate-500 text-sm">Create a new real estate project in your inventory.</p>
                    </div>
                </div>

                {/* AI Pre-fill Banner */}
                {extractionId && prefillData && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-indigo-900">Pre-filled from AI Brochure Extraction</h3>
                            <p className="text-sm text-indigo-700 mt-1">
                                We've automatically filled in the details from your brochure. Please review all fields carefully before saving.
                            </p>
                        </div>
                    </div>
                )}

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-red-900">Could not load extraction data</h3>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                            <p className="text-sm text-red-600 mt-2">You can still fill the form manually.</p>
                        </div>
                    </div>
                )}

                {/* Form */}
                <PropertyForm initialData={prefillData || undefined} />
            </div>
        </div>
    );
}
