"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Property, PropertyFilter as PropertyFilters } from '@/types/property';
import { propertiesAPI } from '@/lib/api/properties';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { FilterPanel } from '@/components/properties/FilterPanel';
import { 
    Plus, Sparkles, Building2, LayoutGrid, 
    TrendingUp, Activity, Search, Filter, 
    ChevronDown, ArrowUpRight, X, SlidersHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

export default function PropertiesPage() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<PropertyFilters>({});
    const [searchInputValue, setSearchInputValue] = useState(filters.searchQuery || '');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    
    const debouncedSearchQuery = useDebounce(searchInputValue, 500);

    useEffect(() => {
        setFilters(prev => ({ ...prev, searchQuery: debouncedSearchQuery }));
    }, [debouncedSearchQuery]);

    // Synchronize search input with filters (e.g., on reset)
    useEffect(() => {
        if (filters.searchQuery !== searchInputValue) {
            setSearchInputValue(filters.searchQuery || '');
        }
    }, [filters.searchQuery]);

    useEffect(() => {
        loadProperties();
    }, [filters]);

    const loadProperties = async () => {
        try {
            setLoading(true);
            const response = await propertiesAPI.list(filters);
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
                setProperties(prev => prev.filter(p => p.id !== id));
            } catch (err) {
                console.error("Failed to delete property", err);
            }
        }
    };

    const resetFilters = () => {
        setFilters({});
        setSearchInputValue('');
    };

    const removeFilter = (key: keyof PropertyFilters, value?: any) => {
        setFilters(prev => {
            const newFilters = { ...prev };
            if (key === 'status') {
                newFilters.status = prev.status?.filter(v => v !== value);
                if (newFilters.status?.length === 0) delete newFilters.status;
            } else if (key === 'city') {
                newFilters.city = prev.city?.filter(v => v !== value);
                if (newFilters.city?.length === 0) delete newFilters.city;
            } else {
                delete newFilters[key];
            }
            return newFilters;
        });
    };

    return (
        <div className="p-6 lg:p-10 space-y-10 max-w-[1600px] mx-auto">
            
            {/* 1. Technical Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em]">
                        <Building2 size={12} className="text-secondary" />
                        Inventory Nexus // Active Projects
                    </div>
                    <h1 className="text-3xl font-black text-text-main tracking-tighter">
                        Property <span className="text-secondary">Portfolio</span>
                    </h1>
                    <p className="text-sm text-text-secondary font-medium">Strategic oversight of global inventory, tower liquidation, and unit readiness.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/properties/new"
                        className="btn-primary flex items-center gap-2 text-xs"
                    >
                        <Plus size={16} />
                        Add Property
                    </Link>
                </div>
            </div>

            {/* 3. Filter & Control Layer */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-2 bg-white border border-border-subtle rounded-2xl shadow-sm">
                    <div className="flex items-center gap-4 flex-1 w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl group focus-within:border-primary/30 focus-within:bg-white transition-all duration-300">
                        <Search size={18} className="text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Identify property by tower, project, or location..."
                            value={searchInputValue}
                            onChange={(e) => setSearchInputValue(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm font-medium text-text-main w-full placeholder:text-slate-400"
                        />
                        {searchInputValue && (
                            <button 
                                onClick={() => setSearchInputValue('')}
                                className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                            >
                                <X size={14} className="text-slate-400" />
                            </button>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto px-2">
                        <div className="hidden md:block h-8 w-[1px] bg-slate-200 mx-2" />
                        
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 whitespace-nowrap">
                            <Activity size={12} className="text-secondary/50" />
                            {loading ? "Counting..." : `${properties.length} Active Nodes`}
                        </div>

                        <button 
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 border",
                                showAdvancedFilters 
                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                                    : "bg-white border-slate-200 text-text-secondary hover:border-primary/30 hover:bg-slate-50"
                            )}
                        >
                            <SlidersHorizontal size={14} />
                            Advanced
                            <ChevronDown size={14} className={cn("transition-transform duration-300", showAdvancedFilters && "rotate-180")} />
                        </button>
                    </div>
                </div>

                {/* Active Filter Chips */}
                {(filters.status?.length || filters.city?.length || filters.minPrice || filters.maxPrice) && (
                    <div className="flex flex-wrap items-center gap-2 px-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Active Filters:</span>
                        
                        {filters.status?.map(s => (
                            <div key={s} className="flex items-center gap-1.5 px-3 py-1 bg-primary/5 border border-primary/10 rounded-full text-[11px] font-bold text-primary">
                                {s}
                                <button onClick={() => removeFilter('status', s)} className="hover:text-secondary"><X size={10} /></button>
                            </div>
                        ))}

                        {filters.city?.map(c => (
                            <div key={c} className="flex items-center gap-1.5 px-3 py-1 bg-secondary/5 border border-secondary/10 rounded-full text-[11px] font-bold text-secondary">
                                {c}
                                <button onClick={() => removeFilter('city', c)} className="hover:text-primary"><X size={10} /></button>
                            </div>
                        ))}

                        {(filters.minPrice || filters.maxPrice) && (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full text-[11px] font-bold text-amber-700">
                                Price: {filters.minPrice ? `₹${filters.minPrice}L` : 'Any'} - {filters.maxPrice ? `₹${filters.maxPrice}L` : 'Any'}
                                <button onClick={() => { removeFilter('minPrice'); removeFilter('maxPrice'); }} className="hover:text-amber-900"><X size={10} /></button>
                            </div>
                        )}

                        <button 
                            onClick={resetFilters}
                            className="text-[10px] font-bold text-slate-400 hover:text-primary uppercase tracking-widest ml-2 transition-colors"
                        >
                            Clear All
                        </button>
                    </div>
                )}

                {showAdvancedFilters && (
                    <div className="p-0 bg-white border border-border-subtle rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <FilterPanel filters={filters} onChange={setFilters} onReset={resetFilters} />
                    </div>
                )}
            </div>

            {/* 4. Main Portfolio Grid */}
            <div className="relative">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-24 space-y-4">
                        <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
                        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest animate-pulse">Synchronizing Inventory...</p>
                    </div>
                ) : properties.length === 0 ? (
                    <div className="card-premium p-24 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-50 mb-6 border border-border-subtle">
                            <Building2 className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-text-main tracking-tight mb-2">Portfolio Isolated</h3>
                        <p className="text-sm text-text-secondary font-medium mb-8 max-w-sm mx-auto">No inventory nodes detected in the current filter range. Initialize your first property deployment.</p>
                        <Link href="/properties/new" className="btn-primary inline-flex items-center gap-2 px-8">
                            <Plus size={20} />
                            Deploy First Project
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

