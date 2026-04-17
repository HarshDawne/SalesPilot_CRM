'use client';

import { useState, useEffect } from 'react';
import type { Property } from '@/types/property';

interface PropertySelectorProps {
    value?: string;
    onChange: (propertyId: string, property: Property) => void;
    filter?: {
        status?: string;
        city?: string;
    };
}

export function PropertySelector({ value, onChange, filter }: PropertySelectorProps) {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProperties();
    }, [filter]);

    const fetchProperties = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filter?.status) params.append('status', filter.status);
            if (filter?.city) params.append('city', filter.city);

            const response = await fetch(`/api/properties?${params.toString()}`);
            const data = await response.json();

            if (data.success) {
                setProperties(data.data);
            } else {
                setError('Failed to load properties');
            }
        } catch (err) {
            setError('Error loading properties');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return <div className="text-red-600 p-4">{error}</div>;
    }

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                Select Property
            </label>
            <select
                value={value || ''}
                onChange={(e) => {
                    const property = properties.find(p => p.id === e.target.value);
                    if (property) onChange(e.target.value, property);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="">Select a property...</option>
                {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                        {property.name} - {property.location.city} ({property.availableUnits} units available)
                    </option>
                ))}
            </select>
        </div>
    );
}
