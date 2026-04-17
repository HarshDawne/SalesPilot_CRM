"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Property, PropertyFilter as PropertyFilters } from '@/types/property';
import { propertiesAPI } from '@/lib/api/properties';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { FilterPanel } from '@/components/properties/FilterPanel';
import { Plus, Sparkles } from 'lucide-react';

export default function PropertiesPage() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<PropertyFilters>({});

    useEffect(() => {
        loadProperties();
    }, [filters]);

    const loadProperties = async () => {
        try {
            setLoading(true);
            // Load real data from API
            // Use .list() not .getAll()
            const response = await propertiesAPI.list(filters);
            
            // Handle { success: true, data: [...] } structure
            const data = (response && response.success && Array.isArray(response.data)) 
                ? response.data 
                : (Array.isArray(response) ? response : []);

            setProperties(data);
        } catch (error) {
            console.error('Failed to load properties:', error);
            setProperties([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        if (confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
            try {
                await propertiesAPI.delete(id);
                // Optimistic update
                setProperties(prev => prev.filter(p => p.id !== id));
            } catch (err) {
                console.error("Failed to delete property", err);
                alert("Failed to delete property");
            }
        }
    };

    const resetFilters = () => {
        setFilters({});
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <div>
                        <h1 className="text-[36px] lg:text-5xl font-bold font-heading text-charcoal">Properties</h1>
                        <p className="text-muted mt-2 text-lg">Manage your real estate inventory</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <Link
                            href="/properties/new"
                            className="btn-primary-copper flex items-center gap-2 focus-ring-copper"
                        >
                            <Plus className="w-5 h-5" />
                            Add Property
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <FilterPanel filters={filters} onChange={setFilters} onReset={resetFilters} />

                {/* Properties Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-copper border-t-transparent"></div>
                    </div>
                ) : properties.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                            <Sparkles className="w-8 h-8 text-muted" />
                        </div>
                        <h3 className="text-xl font-bold text-charcoal mb-2">No Properties Found</h3>
                        <p className="text-muted mb-6">Get started by adding your first property</p>
                        <Link href="/properties/new" className="btn-primary-copper inline-flex items-center gap-2">
                            <Plus size={20} />
                            Add Property
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {properties.map((property) => (
                            <PropertyCard 
                                key={property.id} 
                                property={property} 
                                onDelete={handleDelete}    
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
