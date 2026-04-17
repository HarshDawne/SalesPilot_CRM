import { Property, ProjectStatus, PropertyType, ConstructionStatus } from '@/types/property';
import { inferSectionType } from '../utils/section-type';

export interface LocalProperty extends Property {
    towers?: any[];
    [key: string]: any;
}

const STORAGE_KEY = 'properties_local_store';

// Helper to get store safely
const getStore = (): LocalProperty[] => {
    if (typeof window === 'undefined') return [];
    try {
        const item = localStorage.getItem(STORAGE_KEY);
        return item ? JSON.parse(item) : [];
    } catch (e) {
        console.error("Failed to read local properties", e);
        return [];
    }
};

// Helper to set store
const setStore = (items: LocalProperty[]) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
        console.error("Failed to save local properties", e);
    }
};

// (Removed local inferSectionType in favor of centralized utility)

export const localPropertyService = {
    getAll: async () => {
        return getStore();
    },

    getById: async (id: string) => {
        const properties = getStore();
        return properties.find(p => p.id === id) || null;
    },

    create: async (data: Partial<LocalProperty>) => {
        const properties = getStore();

        // Generate ID
        const newId = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const newProperty: LocalProperty = {
            id: newId,
            name: data.name || 'Untitled Property',
            code: data.code || null,
            status: data.status || ProjectStatus.PLANNING,
            constructionStatus: data.constructionStatus || ConstructionStatus.PRE_LAUNCH,
            projectType: data.projectType || 'RESIDENTIAL',
            propertyType: data.propertyType || PropertyType.RESIDENTIAL,
            developerName: data.developerName || 'Unknown Developer',
            description: data.description || '',
            tagline: data.tagline || '',
            location: data.location || {
                city: '',
                locality: '',
                pincode: '',
                fullAddress: '',
            },
            totalTowers: data.totalTowers || 0,
            totalUnits: data.totalUnits || 0,
            availableUnits: data.availableUnits || 0,
            bookedUnits: data.bookedUnits || 0,
            reraId: data.reraId || '',
            expectedCompletion: data.expectedCompletion || new Date().toISOString(),
            highlights: data.highlights || [],
            amenities: data.amenities || [],
            documents: data.documents || [],
            renders: data.renders || [],
            renderRequests: data.renderRequests || [],
            isActive: data.isActive ?? true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // Merge any other passed data
            ...data,
        };

        // Create = Replace (Add to list)
        // No push, create new array
        const updatedProperties = [newProperty, ...properties];
        setStore(updatedProperties);

        return newProperty;
    },

    update: async (id: string, data: Partial<LocalProperty>) => {
        const properties = getStore();
        const existingIndex = properties.findIndex(p => p.id === id);

        if (existingIndex === -1) {
            throw new Error(`Property with ID ${id} not found`);
        }

        const existing = properties[existingIndex];
        const updated = {
            ...existing,
            ...data,
            updatedAt: new Date().toISOString(),
        };

        // Towers handling: if data has towers, replace them.
        if (data.towers && Array.isArray(data.towers)) {
            updated.towers = data.towers;
        }

        if (data.documents && Array.isArray(data.documents)) {
            updated.documents = data.documents;
        }

        if (data.renders && Array.isArray(data.renders)) {
            updated.renders = data.renders;
        }

        if (data.renderRequests && Array.isArray(data.renderRequests)) {
            updated.renderRequests = data.renderRequests;
        }

        const newProperties = [...properties];
        newProperties[existingIndex] = updated;
        setStore(newProperties);

        return updated;
    },

    delete: async (id: string) => {
        const properties = getStore();
        const filtered = properties.filter(p => p.id !== id);
        setStore(filtered);
        return true;
    },

    // Specific Tower Methods (acting on the single property object)
    getTowers: async (propertyId: string, sectionType?: string) => {
        const properties = getStore();
        const property = properties.find(p => p.id === propertyId);
        if (!property) return [];

        let towers = Array.isArray(property.towers) ? property.towers : [];
        let needsSelfHealing = false;

        // Self-healing & Tracing
        towers = towers.map(t => {
            const inferred = inferSectionType(t, property.propertyType);
            if (!t.sectionType || t.sectionType !== inferred) {
                t.sectionType = inferred;
                needsSelfHealing = true;
            }
            return t;
        });

        if (needsSelfHealing) {
            console.log(`[Self-Healing] Auto-tagged/corrected towers for property ${propertyId}`);
            // Update store silently
            const existingIndex = properties.findIndex(p => p.id === propertyId);
            if (existingIndex !== -1) {
                properties[existingIndex] = { ...property, towers, updatedAt: new Date().toISOString() };
                setStore(properties);
            }
        }

        // Strict Filtering - Visible Impact
        let effectiveSectionType = sectionType;

        if (!effectiveSectionType) {
            if (property.propertyType === 'Commercial') effectiveSectionType = 'Commercial';
            else if (property.propertyType === 'Residential') effectiveSectionType = 'Residential';
            else effectiveSectionType = 'Residential'; // Default for Mixed-Use
        }

        const filteredTowers = towers.filter(t => t.sectionType === effectiveSectionType);

        console.log(`DEBUG: Filtering Towers for Property ${propertyId} (${property.propertyType}) | Requested: ${sectionType || 'None'} | Effective: ${effectiveSectionType} | Count: ${filteredTowers.length}/${towers.length}`);

        return filteredTowers;
    },

    createTower: async (propertyId: string, towerData: any) => {
        const properties = getStore();
        const idx = properties.findIndex(p => p.id === propertyId);
        if (idx === -1) throw new Error("Property not found");

        const property = properties[idx];
        const currentTowers = Array.isArray(property.towers) ? property.towers : [];

        // Write-time Enforcement (Mandatory)
        const sectionType = inferSectionType(towerData, property.propertyType);

        const newTower = {
            ...towerData,
            id: towerData.id || `tower_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            propertyId,
            sectionType,
            updatedAt: new Date().toISOString()
        };

        const updatedProperty = {
            ...property,
            towers: [...currentTowers, newTower],
            updatedAt: new Date().toISOString()
        };

        const newProperties = [...properties];
        newProperties[idx] = updatedProperty;
        setStore(newProperties);

        console.log(`[Enforcement] Created tower ${newTower.name} with sectionType: ${sectionType}`);
        return newTower;
    },

    updateTower: async (towerId: string, towerData: any) => {
        // This is tricky without propertyId. We search all properties.
        const properties = getStore();
        let found = false;
        let updatedTower = null;

        const newProperties = properties.map(p => {
            if (!p.towers || !Array.isArray(p.towers)) return p;
            const towerIdx = p.towers.findIndex((t: any) => t.id === towerId);
            if (towerIdx === -1) return p;

            found = true;
            const towers = [...p.towers];
            towers[towerIdx] = { ...towers[towerIdx], ...towerData };
            updatedTower = towers[towerIdx];

            return { ...p, towers };
        });

        if (found) {
            setStore(newProperties);
            return updatedTower;
        }
        throw new Error("Tower not found");
    },

    // Units
    createUnit: async (towerId: string, unitData: any) => {
        const properties = getStore();
        let found = false;
        let newUnit = null;

        const newProperties = properties.map(p => {
            if (!p.towers || !Array.isArray(p.towers)) return p;
            const towerIdx = p.towers.findIndex((t: any) => t.id === towerId);
            if (towerIdx === -1) return p;

            found = true;
            const towers = [...p.towers];
            const tower = towers[towerIdx];
            const currentUnits = Array.isArray(tower.units) ? tower.units : [];

            // Write-time Enforcement (Mandatory)
            const sectionType = inferSectionType(unitData, p.propertyType);

            newUnit = {
                ...unitData,
                id: unitData.id || `unit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                towerId,
                propertyId: p.id,
                sectionType,
                updatedAt: new Date().toISOString()
            };

            towers[towerIdx] = {
                ...tower,
                units: [...currentUnits, newUnit],
                updatedAt: new Date().toISOString()
            };

            return { ...p, towers, updatedAt: new Date().toISOString() };
        });

        if (found && newUnit) {
            setStore(newProperties);
            return newUnit;
        }
        throw new Error("Tower not found for unit creation");
    },

    getUnits: async (towerId: string, sectionType?: string) => {
        const properties = getStore();
        for (const p of properties) {
            if (p.towers && Array.isArray(p.towers)) {
                const towerIdx = p.towers.findIndex((t: any) => t.id === towerId);
                if (towerIdx !== -1) {
                    const tower = p.towers[towerIdx];
                    let units = Array.isArray(tower.units) ? tower.units : [];
                    let needsSelfHealing = false;

                    // Self-healing & Enforcement consistency
                    units = units.map((u: any) => {
                        const inferred = inferSectionType(u, p.propertyType);
                        if (!u.sectionType || u.sectionType !== inferred) {
                            u.sectionType = inferred;
                            needsSelfHealing = true;
                        }
                        return u;
                    });

                    if (needsSelfHealing) {
                        console.log(`[Self-Healing] Auto-tagged/corrected units for tower ${towerId}`);
                        const updatedTowers = [...p.towers];
                        updatedTowers[towerIdx] = { ...tower, units };

                        // Update store silently
                        const propIndex = properties.findIndex(prop => prop.id === p.id);
                        if (propIndex !== -1) {
                            properties[propIndex] = { ...p, towers: updatedTowers, updatedAt: new Date().toISOString() };
                            setStore(properties);
                        }
                    }

                    // Strict Filtering - Visible Impact
                    let effectiveSectionType = sectionType;
                    if (!effectiveSectionType) {
                        if (p.propertyType === 'Commercial') effectiveSectionType = 'Commercial';
                        else if (p.propertyType === 'Residential') effectiveSectionType = 'Residential';
                        else effectiveSectionType = 'Residential'; // Default for Mixed-Use
                    }

                    const filteredUnits = units.filter((u: any) => u.sectionType === effectiveSectionType);

                    console.log(`DEBUG: Filtering Units for Tower ${towerId} (Prop: ${p.propertyType}) | Requested: ${sectionType || 'None'} | Effective: ${effectiveSectionType} | Count: ${filteredUnits.length}/${units.length}`);

                    return filteredUnits;
                }
            }
        }
        return [];
    }
};
