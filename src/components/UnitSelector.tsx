'use client';

import { useState, useEffect } from 'react';
import type { Unit } from '@/types/property';

interface UnitSelectorProps {
    propertyId?: string;
    towerId?: string;
    value?: string;
    onChange: (unitId: string, unit: Unit) => void;
    statusFilter?: string;
}

export function UnitSelector({ propertyId, towerId, value, onChange, statusFilter = 'AVAILABLE' }: UnitSelectorProps) {
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (propertyId || towerId) {
            fetchUnits();
        }
    }, [propertyId, towerId, statusFilter]);

    const fetchUnits = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (propertyId) params.append('propertyId', propertyId);
            if (statusFilter) params.append('status', statusFilter);

            const url = towerId
                ? `/api/properties/${propertyId}/units?${params.toString()}`
                : `/api/units?${params.toString()}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                let filteredUnits = data.data;
                if (towerId) {
                    filteredUnits = filteredUnits.filter((u: Unit) => u.towerId === towerId);
                }
                setUnits(filteredUnits);
            }
        } catch (err) {
            console.error('Error loading units:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!propertyId) {
        return (
            <div className="text-gray-500 text-sm p-2">
                Please select a property first
            </div>
        );
    }

    if (loading) {
        return <div className="text-sm text-gray-500">Loading units...</div>;
    }

    if (units.length === 0) {
        return (
            <div className="text-amber-600 text-sm p-2">
                No available units found
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                Select Unit
            </label>
            <select
                value={value || ''}
                onChange={(e) => {
                    const unit = units.find(u => u.id === e.target.value);
                    if (unit) onChange(e.target.value, unit);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="">Select a unit...</option>
                {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                        {unit.unitNumber} - {unit.type.replace('_', ' ')} - Floor {unit.floor} - ₹{(unit.totalPrice / 10000000).toFixed(2)}Cr
                    </option>
                ))}
            </select>

            {value && units.find(u => u.id === value) && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm">
                    {(() => {
                        const selectedUnit = units.find(u => u.id === value);
                        return selectedUnit ? (
                            <div className="space-y-1">
                                <div className="font-medium">{selectedUnit.unitNumber}</div>
                                <div className="text-gray-600">
                                    Carpet: {selectedUnit.carpetArea} sqft | Built-up: {selectedUnit.builtUpArea} sqft
                                </div>
                                <div className="text-gray-600">
                                    Facing: {selectedUnit.facing} | Floor: {selectedUnit.floor}
                                </div>
                                <div className="font-semibold text-blue-600">
                                    ₹{(selectedUnit.totalPrice / 10000000).toFixed(2)} Cr
                                </div>
                            </div>
                        ) : null;
                    })()}
                </div>
            )}
        </div>
    );
}
