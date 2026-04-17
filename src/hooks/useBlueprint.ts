import { useState, useEffect, useCallback } from 'react';
import { BlueprintProperty, BlueprintTower, BlueprintUnit, UnitStatus, BlueprintDocument } from '@/lib/types/blueprint';
import { RenderAsset, RenderRequest } from '@/types/render';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_PROPERTY: BlueprintProperty = {
    id: `draft-${uuidv4().slice(0, 8)}`,
    name: 'New Project Blueprint',
    address: '',
    developer: 'Aurum Group',
    heroImage: '/api/placeholder/1200/400',
    status: 'Upcoming',
    propertyType: 'Residential',
    tagline: 'Luxury Living Reimagined',
    projectBrief: 'Ultra-luxury sea-facing apartments with private decks and world-class amenities. Featuring sustainable design architecture defined by excellence.',
    amenities: ['Clubhouse', 'Swimming Pool', 'Gymnasium', 'Private Deck', 'Sea View'],
    documents: [],
    locationIntelligence: {
        connectivity: [{ name: 'Metro Station', distance: '0.5 km' }, { name: 'Main Highway', distance: '1.2 km' }],
        schools: [{ name: 'St. Mary School', distance: '0.8 km' }],
        hospitals: [{ name: 'City Hospital', distance: '2.0 km' }]
    },
    legalCompliance: {
        reraNumber: '',
        authority: 'MahaRERA',
        status: 'Pending',
        expiryDate: '2028-12-31'
    },
    towers: [],
    metadata: {
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        version: 1,
        author: 'System Architect'
    }
};

const TOWER_NAMES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function useBlueprint() {
    const [property, setProperty] = useState<BlueprintProperty>(DEFAULT_PROPERTY);
    const [activeTowerId, setActiveTowerId] = useState<string | null>(null);
    const [isDirty, setIsDirty] = useState(false);

    // --- Core Helpers ---

    const generateUnits = (towerId: string, floors: number, unitsPerFloor: number, startingUnit: number): BlueprintUnit[] => {
        const units: BlueprintUnit[] = [];
        
        // Configuration Patterns (Standard Real Estate)
        const typeMix = [
            { config: '2 BHK', carpet: 1050, builtUp: 1210, price: 12500 },
            { config: '3 BHK', carpet: 1450, builtUp: 1670, price: 14000 }
        ];

        for (let f = 1; f <= floors; f++) {
            for (let u = 0; u < unitsPerFloor; u++) {
                const unitNum = startingUnit + (f - 1) * 100 + u;
                const mix = typeMix[u % typeMix.length];
                
                const basePrice = mix.price;
                const floorRise = 75; // 75 per sqft per floor above 5
                const plc = u % 4 === 0 ? 500 : 0; // Corner premium

                const effectiveRate = basePrice + (f > 5 ? floorRise * (f - 5) : 0) + plc;
                const totalPrice = effectiveRate * mix.builtUp;

                units.push({
                    id: uuidv4(),
                    unitNumber: unitNum.toString(),
                    floor: f,
                    type: 'Apartment',
                    status: 'AVAILABLE',
                    configuration: mix.config,
                    carpetArea: mix.carpet,
                    builtUpArea: mix.builtUp,
                    superBuiltUpArea: Math.round(mix.builtUp * 1.32),
                    basePrice,
                    floorRise,
                    plcCharges: plc,
                    totalPrice: Math.round(totalPrice),
                    facing: u % 2 === 0 ? 'East' : 'West',
                    documents: [],
                    renders: [],
                    renderRequests: []
                });
            }
        }
        return units;
    };

    // --- Actions ---

    const updateMetadata = (field: keyof BlueprintProperty, value: any) => {
        setProperty(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
    };

    const setTowerCount = (count: number) => {
        setProperty(prev => {
            const currentTowers = prev.towers;
            if (count > currentTowers.length) {
                const toAdd = count - currentTowers.length;
                
                // Smart Default: Inherit from last tower if exists
                const lastTower = currentTowers.length > 0 ? currentTowers[currentTowers.length - 1] : null;
                const defFloors = lastTower ? lastTower.totalFloors : 10;
                const defUnitsPerFloor = lastTower ? lastTower.unitsPerFloor : 4;
                const defStartNum = lastTower ? (lastTower.startingUnitNumber + 100) : 101;

                const newTowers: BlueprintTower[] = Array.from({ length: toAdd }, (_, i) => {
                    const idx = currentTowers.length + i;
                    const name = idx < TOWER_NAMES.length ? `Tower ${TOWER_NAMES[idx]}` : `Tower ${idx + 1}`;
                    const towerId = uuidv4();
                    
                    return {
                        id: towerId,
                        name,
                        totalFloors: defFloors,
                        unitsPerFloor: defUnitsPerFloor,
                        startingUnitNumber: defStartNum,
                        units: generateUnits(towerId, defFloors, defUnitsPerFloor, defStartNum),
                        status: 'Planning'
                    };
                });
                return { ...prev, towers: [...currentTowers, ...newTowers] };
            } else {
                return { ...prev, towers: currentTowers.slice(0, count) };
            }
        });
        setIsDirty(true);
    };

    const updateTowerConfig = (towerId: string, updates: Partial<BlueprintTower>) => {
        setProperty(prev => {
            const updatedTowers = prev.towers.map(t => {
                if (t.id !== towerId) return t;
                const updated = { ...t, ...updates };
                
                // If structure changed, regenerate units (auto-generator logic)
                if (updates.totalFloors !== undefined || updates.unitsPerFloor !== undefined || updates.startingUnitNumber !== undefined) {
                    updated.units = generateUnits(
                        towerId,
                        updated.totalFloors,
                        updated.unitsPerFloor,
                        updated.startingUnitNumber
                    );
                }
                return updated;
            });
            return { ...prev, towers: updatedTowers };
        });
        setIsDirty(true);
    };

    const updateUnit = (towerId: string, unitId: string, updates: Partial<BlueprintUnit>) => {
        setProperty(prev => ({
            ...prev,
            towers: prev.towers.map(t => {
                if (t.id !== towerId) return t;
                return {
                    ...t,
                    units: t.units.map(u => u.id === unitId ? { ...u, ...updates } : u)
                };
            })
        }));
        setIsDirty(true);
    };

    const saveDraft = () => {
        try {
            localStorage.setItem('blueprint_draft', JSON.stringify(property));
        } catch (e: any) {
            if (e.name !== 'QuotaExceededError') {
                console.error('Failed to save draft to localStorage:', e);
            }
        }
        setIsDirty(false);
    };

    const discardChanges = () => {
        setProperty(DEFAULT_PROPERTY);
        setIsDirty(false);
        localStorage.removeItem('blueprint_draft');
    };

    const loadBlueprint = useCallback((data: BlueprintProperty) => {
        // Migration if needed for older data formats
        setProperty(data);
        setIsDirty(false);
    }, []);

    const addDocument = (doc: Omit<BlueprintDocument, 'id'>) => {
        const newDoc: BlueprintDocument = { ...doc, id: uuidv4() };
        setProperty(prev => ({
            ...prev,
            documents: [...(prev.documents || []), newDoc]
        }));
        setIsDirty(true);
    };

    const updateDocument = (docId: string, updates: Partial<BlueprintDocument>) => {
        setProperty(prev => ({
            ...prev,
            documents: (prev.documents || []).map(d => d.id === docId ? { ...d, ...updates } : d)
        }));
        setIsDirty(true);
    };

    const deleteDocument = (docId: string) => {
        setProperty(prev => ({
            ...prev,
            documents: (prev.documents || []).filter(d => d.id !== docId)
        }));
        setIsDirty(true);
    };

    const addRender = (render: Omit<RenderAsset, 'id'>) => {
        const newRender: RenderAsset = { ...render, id: uuidv4() } as RenderAsset;
        setProperty(prev => ({
            ...prev,
            renders: [...(prev.renders || []), newRender]
        }));
        setIsDirty(true);
    };

    const addRenderRequest = (request: Omit<RenderRequest, 'id'>) => {
        const newRequest: RenderRequest = { ...request, id: uuidv4() } as RenderRequest;
        setProperty(prev => ({
            ...prev,
            renderRequests: [...(prev.renderRequests || []), newRequest]
        }));
        setIsDirty(true);
    };

    const updateRenderRequest = (id: string, updates: Partial<RenderRequest>) => {
        setProperty(prev => ({
            ...prev,
            renderRequests: (prev.renderRequests || []).map(r => r.id === id ? { ...r, ...updates } : r)
        }));
        setIsDirty(true);
    };

    const deleteRenderRequest = (id: string) => {
        setProperty(prev => ({
            ...prev,
            renderRequests: (prev.renderRequests || []).filter(r => r.id !== id)
        }));
        setIsDirty(true);
    };

    return {
        property,
        isDirty,
        updateMetadata,
        setTowerCount,
        updateTowerConfig,
        activeTowerId,
        setActiveTowerId,
        updateUnit,
        addDocument,
        updateDocument,
        deleteDocument,
        addRender,
        addRenderRequest,
        updateRenderRequest,
        deleteRenderRequest,
        saveDraft,
        discardChanges,
        loadBlueprint
    };
}
