"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PropertyBlueprintEditor } from '@/components/blueprint/PropertyBlueprintEditor';
import { BlueprintProperty } from '@/lib/types/blueprint';
import { propertiesAPI } from '@/lib/api/properties';
import { useToast } from '@/components/ui/ToastProvider';

// Helper to map project types
const mapProjectType = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('commercial')) return 'COMMERCIAL';
    if (t.includes('mixed')) return 'MIXED_USE';
    return 'RESIDENTIAL';
};

const mapStatus = (status: string) => {
    // Map Blueprint status to Database Status Enum
    // Blueprint: 'Planning', 'Pre-Launch', 'Under Construction', 'Ready to Move'
    // DB: 'PLANNING', 'ACTIVE', 'UNDER_CONSTRUCTION', 'COMPLETED', 'ON_HOLD'
    const s = status?.toLowerCase() || '';
    if (s.includes('ready') || s.includes('completed')) return 'COMPLETED';
    if (s.includes('under') || s.includes('construction')) return 'UNDER_CONSTRUCTION';
    if (s.includes('planning')) return 'PLANNING';
    return 'PLANNING'; // Default safe
};

export default function BlueprintPage() {
    const { showToast } = useToast();
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (data: BlueprintProperty) => {
        setIsSaving(true);
        try {
            console.log("Creating new property...", data);

            // 1. Map Towers (if any)
            const towersPayload = data.towers?.map(tower => ({
                id: crypto.randomUUID(),
                name: tower.name,
                status: mapStatus(data.status),
                totalFloors: tower.totalFloors || 1,
                unitsPerFloor: tower.unitsPerFloor || 1,
                units: tower.units || [],
            })) || [];

            // 2. Map Blueprint to Property (Full Object)
            const propertyPayload = {
                name: data.name,
                developerName: data.developer,
                // Location is now optional
                location: {
                    city: 'Mumbai',
                    area: data.address,
                    locality: data.address,
                    fullAddress: data.address,
                },
                primaryImageUrl: data.heroImage,
                status: mapStatus(data.status),
                constructionStatus: data.status,
                projectType: mapProjectType(data.propertyType || ""),
                description: data.projectBrief,
                amenities: data.amenities,
                reraId: data.legalCompliance?.reraNumber,
                highlights: [],
                isActive: true,
                totalTowers: towersPayload.length, // Sync count
                towers: towersPayload, // SAVE TOWERS HERE
                // Dates defaults handled by schema or backend if needed
                launchDate: new Date().toISOString(),
                expectedCompletion: new Date().toISOString(),
            };

            // 3. Create Property (Atomic)
            const res = await propertiesAPI.create(propertyPayload as any);
            const createdProp = (res.success && res.data) ? res.data : res;

            if (!createdProp || !createdProp.id) {
                if (res.id) {
                    // success
                    router.push(`/properties/${res.id}`);
                    return;
                }
                throw new Error("Failed to get property ID from response");
            }

            const newId = createdProp.id;
            console.log("Property created with ID:", newId);

            // 4. Redirect
            router.push(`/properties/${newId}`);

        } catch (error) {
            console.error("Failed to save property:", error);
            const message = error instanceof Error ? error.message : "Failed to create property";
            showToast(message, "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <PropertyBlueprintEditor
            mode="create"
            onSave={handleSave}
            onBack={() => router.back()}
        />
    );
}
