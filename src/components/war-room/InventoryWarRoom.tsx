"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { X, Save, Trash2, Home, MapPin, Tag, Palette, Layout, Zap } from 'lucide-react';
import { TowerGrid } from '@/components/war-room/TowerGrid';
import { QuickSellPanel } from '@/components/war-room/QuickSellPanel';
import { FilterBar, WarRoomFilters } from '@/components/war-room/FilterBar';
import { WarRoomHeader } from '@/components/war-room/WarRoomHeader';
import { WarRoomStats } from '@/components/war-room/WarRoomStats';
import type { WarRoomUnit, WarRoomTower, HoldEntry } from '@/components/war-room/types';
import { useWarRoomSync } from '@/hooks/useWarRoomSync';

interface Props {
    property: any;
    towers: any[];
    onBack: () => void;
}

/** Normalize raw API unit into a WarRoomUnit */
function normalizeUnit(raw: any, towerId: string): WarRoomUnit {
    return {
        id: raw.id || raw.unitNumber,
        towerId,
        unitNumber: raw.unitNumber || raw.id,
        floor: Number(raw.floor) || 1,
        configuration: raw.configuration || raw.type || '2 BHK',
        status: (raw.status || 'AVAILABLE').toUpperCase() as WarRoomUnit['status'],
        carpetArea: raw.carpetArea || raw.areaSqft || 1200,
        builtUpArea: raw.builtUpArea || (raw.areaSqft ? raw.areaSqft * 1.15 : 1380),
        facing: raw.facing || 'East',
        basePrice: raw.basePrice || raw.price || 0,
        floorRise: raw.floorRise || 50,
        plcCharges: raw.plcCharges || 0,
        totalPrice: raw.totalPrice || raw.price || 0,
        isHighDemand: false,
    };
}

/** Normalize raw tower into WarRoomTower */
function normalizeTower(raw: any): WarRoomTower {
    const units: WarRoomUnit[] = (raw.units || []).map((u: any) => normalizeUnit(u, raw.id));
    return {
        id: raw.id,
        name: raw.name || 'Tower',
        totalFloors: raw.totalFloors || 0,
        units,
        status: raw.status || 'Planning',
    };
}

const DEFAULT_FILTERS: WarRoomFilters = {
    status: [],
    configuration: [],
    facing: [],
    minPrice: 0,
    maxPrice: 0,
    floors: [],
    tower: '',
};

export function InventoryWarRoom({ property, towers: rawTowers, onBack }: Props) {
    // === STATE ===
    const [filters, setFilters] = useState<WarRoomFilters>(DEFAULT_FILTERS);
    const [selectedUnit, setSelectedUnit] = useState<WarRoomUnit | null>(null);
    const [presentationMode, setPresentationMode] = useState(false);
    const [zoom, setZoom] = useState(1); // 0.5 – 1.5

    // === SYNC ENGINE ===
    const { 
        towers: syncedTowers, 
        holds, 
        holdUnit, 
        releaseUnit,
        isSyncing 
    } = useWarRoomSync(property.id, rawTowers);

    // === NORMALIZE DATA ===
    const warRoomTowers = useMemo<WarRoomTower[]>(
        () => syncedTowers.map(normalizeTower),
        [syncedTowers]
    );

    // Seed demo high-demand floors for wow factor
    const towersWithInsights = useMemo<WarRoomTower[]>(() => {
        return warRoomTowers.map((tower: WarRoomTower) => {
            const bookedFloors = new Set(
                tower.units.filter((u: WarRoomUnit) => u.status === 'BOOKED' || u.status === 'SOLD').map((u: WarRoomUnit) => u.floor)
            );
            return {
                ...tower,
                units: tower.units.map((u: WarRoomUnit) => ({
                    ...u,
                    isHighDemand: bookedFloors.has(u.floor) && (bookedFloors.size / (tower.totalFloors || 1)) > 0.3,
                })),
            };
        });
    }, [warRoomTowers]);

    // === STATS ===
    const allUnits = useMemo(
        () => towersWithInsights.flatMap(t => t.units),
        [towersWithInsights]
    );

    const stats = useMemo(() => {
        const total = allUnits.length;
        const available = allUnits.filter(u => u.status === 'AVAILABLE').length;
        const held = Object.keys(holds).length;
        const booked = allUnits.filter(u => u.status === 'BOOKED').length;
        const sold = allUnits.filter(u => u.status === 'SOLD').length;
        const blocked = allUnits.filter(u => u.status === 'BLOCKED').length;
        const occupancy = total > 0 ? Math.round(((booked + sold) / total) * 100) : 0;
        return { total, available, held, booked, sold, blocked, occupancy };
    }, [allUnits, holds]);

    // === FILTER LOGIC ===
    const isUnitVisible = useCallback((unit: WarRoomUnit): boolean => {
        if (filters.status.length > 0) {
            const effectiveStatus = holds[unit.id] ? 'SOFT_HOLD' : unit.status;
            if (!filters.status.includes(effectiveStatus)) return false;
        }
        if (filters.configuration.length > 0) {
            if (!filters.configuration.some((c: string) => unit.configuration.includes(c))) return false;
        }
        if (filters.facing.length > 0) {
            if (!filters.facing.includes(unit.facing)) return false;
        }
        if (filters.floors.length > 0) {
            if (!filters.floors.includes(unit.floor)) return false;
        }
        if (filters.tower && unit.towerId !== filters.tower) return false;
        if (filters.maxPrice > 0 && unit.totalPrice > filters.maxPrice) return false;
        if (filters.minPrice > 0 && unit.totalPrice < filters.minPrice) return false;
        return true;
    }, [filters, holds]);

    // === ACTIONS ===
    const handleHoldAction = useCallback(async (unit: WarRoomUnit, agentName: string = 'You') => {
        const success = await holdUnit(unit.id, agentName);
        if (success) setSelectedUnit(null);
    }, [holdUnit]);

    const handleReleaseHoldAction = useCallback(async (unitId: string) => {
        await releaseUnit(unitId);
    }, [releaseUnit]);


    const hasActiveFilters = useMemo(() =>
        filters.status.length > 0 ||
        filters.configuration.length > 0 ||
        filters.facing.length > 0 ||
        filters.floors.length > 0 ||
        filters.tower !== '' ||
        filters.minPrice > 0 ||
        filters.maxPrice > 0,
        [filters]
    );

    return (
        <div className="fixed inset-0 bg-[#080c12] flex flex-col overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Top Bar */}
            <WarRoomHeader
                property={property}
                onBack={onBack}
                presentationMode={presentationMode}
                onTogglePresentation={() => setPresentationMode((p: boolean) => !p)}
                zoom={zoom}
                onZoomChange={setZoom}
            />

            {/* Stats Strip */}
            {!presentationMode && <WarRoomStats stats={stats} />}

            {/* Filter Bar */}
            {!presentationMode && (
                <FilterBar
                    towers={towersWithInsights}
                    filters={filters}
                    onChange={setFilters}
                    hasActiveFilters={hasActiveFilters}
                />
            )}

            {/* Main Canvas */}
            <div className="flex-1 overflow-auto relative">
                <TowerGrid
                    towers={towersWithInsights}
                    holds={holds}
                    selectedUnitId={selectedUnit?.id || null}
                    isUnitVisible={isUnitVisible}
                    hasActiveFilters={hasActiveFilters}
                    zoom={zoom}
                    presentationMode={presentationMode}
                    onSelectUnit={setSelectedUnit}
                />
            </div>

            {/* Quick Sell Panel */}
            {selectedUnit && (
                <QuickSellPanel
                    unit={selectedUnit}
                    tower={towersWithInsights.find(t => t.id === selectedUnit.towerId)!}
                    property={property}
                    hold={holds[selectedUnit.id]}
                    allUnits={allUnits}
                    onClose={() => setSelectedUnit(null)}
                    onHold={() => handleHoldAction(selectedUnit)}
                    onReleaseHold={() => handleReleaseHoldAction(selectedUnit.id)}
                />
            )}
        </div>
    );
}
