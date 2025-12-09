'use client';

import { useState } from 'react';
import { PropertySelector } from './PropertySelector';
import { TowerSelector } from './TowerSelector';
import { UnitSelector } from './UnitSelector';
import type { Property, Tower, Unit } from '@/types/property';

interface PropertyUnitPickerProps {
    onSelect: (data: {
        propertyId: string;
        property: Property;
        towerId?: string;
        tower?: Tower;
        unitId?: string;
        unit?: Unit;
    }) => void;
    requireUnit?: boolean;
}

export function PropertyUnitPicker({ onSelect, requireUnit = false }: PropertyUnitPickerProps) {
    const [selectedProperty, setSelectedProperty] = useState<{ id: string; data: Property } | null>(null);
    const [selectedTower, setSelectedTower] = useState<{ id: string; data: Tower } | null>(null);
    const [selectedUnit, setSelectedUnit] = useState<{ id: string; data: Unit } | null>(null);

    const handlePropertyChange = (id: string, property: Property) => {
        setSelectedProperty({ id, data: property });
        setSelectedTower(null);
        setSelectedUnit(null);

        if (!requireUnit) {
            onSelect({
                propertyId: id,
                property,
            });
        }
    };

    const handleTowerChange = (id: string, tower: Tower) => {
        setSelectedTower({ id, data: tower });
        setSelectedUnit(null);
    };

    const handleUnitChange = (id: string, unit: Unit) => {
        setSelectedUnit({ id, data: unit });

        if (selectedProperty) {
            onSelect({
                propertyId: selectedProperty.id,
                property: selectedProperty.data,
                towerId: selectedTower?.id,
                tower: selectedTower?.data,
                unitId: id,
                unit,
            });
        }
    };

    return (
        <div className="space-y-4">
            <PropertySelector
                value={selectedProperty?.id}
                onChange={handlePropertyChange}
                filter={{ status: 'ACTIVE' }}
            />

            {selectedProperty && (
                <TowerSelector
                    propertyId={selectedProperty.id}
                    value={selectedTower?.id}
                    onChange={handleTowerChange}
                />
            )}

            {selectedProperty && (
                <UnitSelector
                    propertyId={selectedProperty.id}
                    towerId={selectedTower?.id}
                    value={selectedUnit?.id}
                    onChange={handleUnitChange}
                    statusFilter="AVAILABLE"
                />
            )}
        </div>
    );
}
