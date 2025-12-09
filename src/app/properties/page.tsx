"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Sparkles } from 'lucide-react';
import { Property, ProjectStatus } from '@/types/property';
import BrochureImportModal from '@/components/properties/BrochureImportModal';

export default function PropertiesPage() {
    const router = useRouter();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [filter, setFilter] = useState({
        status: '',
        city: ''
    });

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            const res = await fetch('/api/properties');
            const data = await res.json();
            if (data.success && Array.isArray(data.data)) {
                setProperties(data.data);
            } else if (Array.isArray(data)) {
                setProperties(data);
            } else {
                console.error("API returned unexpected data structure:", data);
                setProperties([]);
            }
        } catch (error) {
            console.error('Failed to fetch properties:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: ProjectStatus) => {
        switch (status) {
            case ProjectStatus.ACTIVE: return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20';
            case ProjectStatus.UNDER_CONSTRUCTION: return 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20';
            case ProjectStatus.PLANNING: return 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20';
            case ProjectStatus.COMPLETED: return 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20';
            case ProjectStatus.ON_HOLD: return 'bg-red-50 text-red-700 ring-1 ring-red-600/20';
            default: return 'bg-slate-50 text-slate-700 ring-1 ring-slate-600/20';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
                        <p className="text-gray-600 mt-2">Manage your real estate inventory</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-all font-medium shadow-sm hover:shadow-md hover:border-indigo-300"
                        >
                            <Sparkles className="w-5 h-5" />
                            Import from Brochure (AI)
                        </button>
                        <Link
                            href="/properties/new"
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                        >
                            <Plus className="w-5 h-5" />
                            Add Property
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="premium-card p-5 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                Filter by Status
                            </label>
                            <select
                                value={filter.status}
                                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700"
                            >
                                <option value="">All Statuses</option>
                                <option value="ACTIVE">Active Construction</option>
                                <option value="UNDER_CONSTRUCTION">Under Construction</option>
                                <option value="COMPLETED">Move-in Ready</option>
                                <option value="PLANNING">Planning Phase</option>
                                <option value="ON_HOLD">On Hold</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                Filter by City
                            </label>
                            <select
                                value={filter.city}
                                onChange={(e) => setFilter({ ...filter, city: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700"
                            >
                                <option value="">All Regions</option>
                                <option value="Mumbai">Mumbai</option>
                                <option value="Pune">Pune</option>
                                <option value="Bangalore">Bangalore</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Properties Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {properties.map((property) => (
                            <Link
                                key={property.id}
                                href={`/properties/${property.id}`}
                                className="premium-card group block overflow-hidden"
                            >
                                {/* Card Image / Gradient Placeholder */}
                                <div className="aspect-video relative bg-slate-100 border-b border-slate-100">
                                    {property.primaryImageUrl ? (
                                        <img
                                            src={property.primaryImageUrl}
                                            alt={property.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">
                                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        </div>
                                    )}

                                    {/* Status Badge */}
                                    <div className="absolute top-3 right-3">
                                        <span className={`badge-pill shadow-sm backdrop-blur-md ${getStatusColor(property.status)}`}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
                                            {property.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>

                                {/* Card Content */}
                                <div className="p-5">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                                            {property.name}
                                        </h3>
                                        <p className="text-slate-500 text-sm flex items-center gap-1.5">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            {property.location.locality}, {property.location.city}
                                        </p>
                                    </div>

                                    {/* Inventory & Price Section */}
                                    <div className="pt-4 border-t border-slate-100 flex flex-col gap-4">
                                        {/* Inventory Stats */}
                                        <div className="flex items-center justify-between text-sm py-2 px-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs font-semibold text-slate-400 uppercase">Total</span>
                                                <span className="font-bold text-slate-900">{property.totalUnits}</span>
                                            </div>
                                            <div className="w-px h-8 bg-slate-200" />
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs font-semibold text-emerald-600 uppercase">Available</span>
                                                <span className="font-bold text-emerald-700">{property.availableUnits}</span>
                                            </div>
                                            <div className="w-px h-8 bg-slate-200" />
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs font-semibold text-indigo-600 uppercase">Booked</span>
                                                <span className="font-bold text-indigo-700">{property.bookedUnits}</span>
                                            </div>
                                        </div>

                                        {/* Price */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Starting at</span>
                                            <span className="text-lg font-bold text-indigo-900">
                                                ₹{(Math.random() * (5 - 1.5) + 1.5).toFixed(2)} Cr
                                            </span>
                                        </div>
                                    </div>

                                    {/* Footer Info */}
                                    {property.reraId && (
                                        <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-50 border-dashed">
                                            <span>RERA Approved</span>
                                            <span className="font-mono opacity-70">{property.reraId}</span>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Brochure Import Modal */}
            <BrochureImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={(extractionId) => {
                    setIsImportModalOpen(false);
                    router.push(`/properties/new?extractionId=${extractionId}`);
                }}
            />
        </div>
    );
}
