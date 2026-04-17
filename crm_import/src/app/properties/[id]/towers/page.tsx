"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, Calendar, LayoutGrid } from 'lucide-react';
import { DEMO_PROPERTIES } from '@/data/demoProperties';

export default function TowerListPage() {
    const params = useParams();
    const propertyId = params.id as string;
    const [property, setProperty] = useState<any>(null);

    useEffect(() => {
        // Load from Demo Data
        const prop = DEMO_PROPERTIES.find(p => p.id === propertyId);
        if (prop) setProperty(prop);
    }, [propertyId]);

    if (!property) return <div className="p-12 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <Link href={`/properties/${propertyId}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-4 text-sm font-medium transition-colors">
                        <ArrowLeft size={16} /> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-900 font-heading flex items-center gap-3">
                        <Building2 className="text-copper" size={32} />
                        {property.name} Towers
                    </h1>
                    <p className="text-slate-500 mt-2">Select a tower to view floor plans and unit inventory.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {property.towers.map((tower: any) => (
                        <Link
                            key={tower.id}
                            href={`/properties/${propertyId}/towers/${tower.id}`}
                            className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all p-6 group block"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xl group-hover:bg-copper group-hover:text-white transition-colors">
                                    {tower.name.substring(0, 1)}
                                </div>
                                <span className="px-2 py-1 rounded bg-slate-100 text-xs font-bold uppercase text-slate-600">
                                    {tower.status}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-copper transition-colors">{tower.name}</h3>

                            <div className="space-y-2 text-sm text-slate-500 mb-6">
                                <div className="flex justify-between">
                                    <span>Total Floors</span>
                                    <span className="font-bold text-slate-700">{tower.floors}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Possession</span>
                                    <span className="font-bold text-slate-700">{new Date(tower.possessionDate).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-medium text-copper">
                                <span>View Inventory</span>
                                <ArrowLeft className="rotate-180" size={16} />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
