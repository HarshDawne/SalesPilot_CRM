'use client';

import { useState, useEffect } from 'react';
import type { Tower } from '@/types/property';

interface TowerSelectorProps {
    propertyId: string;
    value?: string;
    onChange: (towerId: string, tower: Tower) => void;
}

export function TowerSelector({ propertyId, value, onChange }: TowerSelectorProps) {
    const [towers, setTowers] = useState<Tower[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (propertyId) {
            fetchTowers();
        }
    }, [propertyId]);

    const fetchTowers = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/properties/${propertyId}/towers`);
            const data = await response.json();

            if (data.success) {
                setTowers(data.data);
            }
        } catch (err) {
            console.error('Error loading towers:', err);
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
        return <div className="text-sm text-gray-500">Loading towers...</div>;
    }

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                Select Tower
            </label>
            <select
                value={value || ''}
                onChange={(e) => {
                    const tower = towers.find(t => t.id === e.target.value);
                    if (tower) onChange(e.target.value, tower);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="">Select a tower...</option>
                {towers.map((tower) => (
                    <option key={tower.id} value={tower.id}>
                        {tower.name} - {tower.floors} floors ({tower.availableUnits} units available)
                    </option>
                ))}
            </select>
        </div>
    );
}
