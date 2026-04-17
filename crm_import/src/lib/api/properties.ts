import { Property, PropertyFilter as PropertyFilters, BrochureParseResult } from '@/types/property';
import { localPropertyService } from '../services/localPropertyService';

export const propertiesAPI = {
    // List all properties with filters
    list: async (filters: PropertyFilters = {}) => {
        console.log("LOCAL MODE: Listing properties", filters);
        const allProperties = await localPropertyService.getAll();

        // Simple in-memory filtering
        let filtered = allProperties;
        if (filters.status) {
            filtered = filtered.filter((p: any) => p.status === filters.status || p.constructionStatus === filters.status);
        }
        if (filters.city) {
            filtered = filtered.filter((p: any) => p.city === filters.city || p.location?.city === filters.city);
        }

        // Return expected structure
        return {
            success: true,
            data: filtered
        };
    },

    // Get single property
    get: async (id: string) => {
        console.log("LOCAL MODE: Getting property", id);
        const property = await localPropertyService.getById(id);
        if (!property) throw new Error('Property not found');
        return {
            success: true,
            data: property
        };
    },

    // Create new property
    create: async (property: Partial<Property>) => {
        console.log("LOCAL MODE: Creating property", property);
        const newProperty = await localPropertyService.create(property);
        return {
            success: true,
            data: newProperty,
            id: newProperty.id // Ensure ID is accessible directly if needed
        };
    },

    // Update property
    update: async (id: string, property: Partial<Property>) => {
        console.log("LOCAL MODE: Updating property", id, property);
        const updated = await localPropertyService.update(id, property);
        return {
            success: true,
            data: updated
        };
    },

    // Delete property
    delete: async (id: string) => {
        console.log("LOCAL MODE: Deleting property", id);
        await localPropertyService.delete(id);
        return { success: true };
    },

    // Upload image (Mock)
    uploadImage: async (file: File) => {
        console.log("LOCAL MODE: Mock Uploading image", file.name);
        // Create a fake local URL (in real app, use FileReader for preview)
        // For now, return a placeholder or blob URL
        return {
            success: true,
            url: URL.createObjectURL(file)
        };
    },

    // Towers
    createTower: async (propertyId: string, tower: any) => {
        console.log("LOCAL MODE: Creating Tower", propertyId, tower);
        const newTower = await localPropertyService.createTower(propertyId, tower);
        return {
            success: true,
            data: newTower
        };
    },

    getTowers: async (propertyId: string) => {
        console.log("LOCAL MODE: Getting Towers", propertyId);
        const towers = await localPropertyService.getTowers(propertyId);
        return {
            success: true,
            data: towers
        };
    },

    updateTower: async (towerId: string, tower: any) => {
        console.log("LOCAL MODE: Updating Tower", towerId);
        const updated = await localPropertyService.updateTower(towerId, tower);
        return {
            success: true,
            data: updated
        };
    },

    // Units
    createUnit: async (towerId: string, unit: any) => {
        console.log("LOCAL MODE: Creating Unit", towerId, unit);
        const newUnit = await localPropertyService.createUnit(towerId, unit);
        return {
            success: true,
            data: newUnit
        };
    },

    // Deprecated alias for list (backward compatibility)
    getAll: async (filters: PropertyFilters = {}) => {
        const res = await propertiesAPI.list(filters);
        return res.data;
    },
    // Mock Brochure Import
    importBrochure: async (file: File): Promise<BrochureParseResult> => {
        console.log("LOCAL MODE: Mocking Brochure Import", file.name);
        await new Promise(resolve => setTimeout(resolve, 1500));
        return {
            success: true,
            data: {
                structured: {
                    propertyName: "Skyline Residency",
                    developerName: "Skyline Developers",
                    status: "Under Construction",
                    totalTowers: 4
                }
            }
        };
    }
};
