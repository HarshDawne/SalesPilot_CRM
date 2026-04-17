import { Property, PropertyFilter as PropertyFilters, BrochureParseResult } from '@/types/property';

export const propertiesAPI = {
    // List all properties with filters
    list: async (filters: PropertyFilters = {}) => {
        const queryParams = new URLSearchParams();
        if (filters.status) queryParams.append('status', filters.status.toString());
        if (filters.city) queryParams.append('city', filters.city.toString());

        const query = queryParams.toString();
        const res = await fetch(`/api/properties${query ? `?${query}` : ''}`);
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Failed to fetch properties');
        
        return data; // Expected { success: true, data: [...] }
    },

    // Get single property
    get: async (id: string, includeDetails: boolean = false) => {
        const res = await fetch(`/api/properties/${id}${includeDetails ? '?details=true' : ''}`);
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Failed to get property');
        
        return data;
    },

    // Create new property
    create: async (property: Partial<Property>) => {
        const res = await fetch(`/api/properties`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(property)
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Failed to create property');
        
        return {
            ...data,
            id: data.data?.id // Ensure ID is accessible directly if needed by UI
        };
    },

    // Update property
    update: async (id: string, property: Partial<Property>) => {
        const res = await fetch(`/api/properties/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(property)
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Failed to update property');
        
        return data;
    },

    // Delete property
    delete: async (id: string) => {
        const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Failed to delete property');
        
        return data;
    },

    // Upload image (Mock for now, normally would hit /api/upload)
    uploadImage: async (file: File) => {
        console.log("Mock Uploading image", file.name);
        return {
            success: true,
            url: URL.createObjectURL(file)
        };
    },

    // Towers
    createTower: async (propertyId: string, tower: any) => {
        // Fallback or explicit tower creation
        // If the backend had a dedicated POST /api/towers route we would use it.
        // For now, this might not be needed if PUT /api/properties handles it,
        // but adding it safely here just in case.
        throw new Error("createTower not independently implemented. Update via Property update.");
    },

    getTowers: async (propertyId: string) => {
        const res = await fetch(`/api/towers?propertyId=${propertyId}`);
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Failed to get towers');
        
        // Wrap in expected { success: true, data: ... } for UI compatibility
        return {
            success: true,
            data: data
        };
    },

    updateTower: async (towerId: string, tower: any) => {
        const res = await fetch(`/api/towers/${towerId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tower)
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Failed to update tower');
        
        return data;
    },

    // Units
    createUnit: async (towerId: string, unit: any) => {
        throw new Error("createUnit not independently implemented. Update via Tower update.");
    },

    // Deprecated alias for list (backward compatibility)
    getAll: async (filters: PropertyFilters = {}) => {
        const res = await propertiesAPI.list(filters);
        return res.data;
    },

    // Mock Brochure Import
    importBrochure: async (file: File): Promise<BrochureParseResult> => {
        console.log("Mocking Brochure Import", file.name);
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
