import React from 'react';
import { PropertyFilter } from '@/types/property';
import { Search, X } from 'lucide-react';

interface FilterPanelProps {
    filters: PropertyFilter;
    onChange: (filters: PropertyFilter) => void;
    onReset: () => void;
}

export function FilterPanel({ filters, onChange, onReset }: FilterPanelProps) {
    return (
        <div className="filter-panel mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-copper uppercase tracking-widest mb-2">Search</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                        <input
                            type="text"
                            value={filters.searchQuery || ''}
                            onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
                            placeholder="Search properties..."
                            className="input-premium focus-ring-copper pl-10 w-full"
                        />
                    </div>
                </div>

                {/* Status */}
                <div>
                    <label className="block text-xs font-bold text-copper uppercase tracking-widest mb-2">Status</label>
                    <select
                        value={filters.status?.[0] || ''}
                        onChange={(e) => onChange({ ...filters, status: e.target.value ? [e.target.value as any] : undefined })}
                        className="input-premium focus-ring-copper w-full"
                    >
                        <option value="">All Statuses</option>
                        <option value="ACTIVE">Active</option>
                        <option value="UNDER_CONSTRUCTION">Under Construction</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="PLANNING">Planning</option>
                    </select>
                </div>

                {/* City */}
                <div>
                    <label className="block text-xs font-bold text-copper uppercase tracking-widest mb-2">City</label>
                    <select
                        value={filters.city?.[0] || ''}
                        onChange={(e) => onChange({ ...filters, city: e.target.value ? [e.target.value] : undefined })}
                        className="input-premium focus-ring-copper w-full"
                    >
                        <option value="">All Cities</option>
                        <option value="Mumbai">Mumbai</option>
                        <option value="Pune">Pune</option>
                        <option value="Bangalore">Bangalore</option>
                        <option value="Delhi">Delhi</option>
                    </select>
                </div>
            </div>

            {/* Reset Button */}
            {(filters.searchQuery || filters.status || filters.city) && (
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={onReset}
                        className="btn-secondary-charcoal text-sm focus-ring-copper"
                    >
                        <X size={16} />
                        Reset Filters
                    </button>
                </div>
            )}
        </div>
    );
}
