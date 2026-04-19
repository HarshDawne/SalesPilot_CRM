"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { propertiesAPI } from '@/lib/api/properties';
import { PropertyBlueprintEditor } from '@/components/blueprint/PropertyBlueprintEditor';
import { BlueprintProperty } from '@/lib/types/blueprint';
import { Property } from '@/types/property';
import { useToast } from '@/components/ui/ToastProvider';

export default function EditPropertyPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const { showToast } = useToast();
    
    const [initialData, setInitialData] = useState<BlueprintProperty | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [mode, setMode] = useState<'view' | 'edit'>('view');

    // Fetch and Hydrate Data
    useEffect(() => {
        const fetchData = async () => {
            if (id === 'new') {
                setMode('edit');
                setIsLoading(false);
                return;
            }
            
            console.log("DEBUG: Fetching property...", { id });

            try {
                setIsLoading(true);
                const [propRes, towersRes] = await Promise.allSettled([
                    propertiesAPI.get(id),
                    propertiesAPI.getTowers(id)
                ]);

                console.log("DEBUG: Responses", { propRes, towersRes });

                if (propRes.status === 'fulfilled') {
                    const resValue = propRes.value as any;
                    
                    // Handle both { success: true, data: ... } and direct object
                    const apiProp = (resValue && resValue.success && resValue.data) ? resValue.data : resValue;

                    console.log("DEBUG: Resolved Property Data", apiProp);

                    if (!apiProp || (!apiProp.id && !apiProp.data?.id)) {
                         console.error("DEBUG: Invalid property data structure or not found", apiProp);
                         setIsLoading(false); 
                         return;
                    }
                    
                    const usableProp = apiProp.id ? apiProp : apiProp.data;

                    // Handle tower data safely
                    let towersData: any[] = [];
                    if (towersRes.status === 'fulfilled') {
                         const val = towersRes.value as any;
                         if (Array.isArray(val)) {
                             towersData = val;
                         } else if (val.data && Array.isArray(val.data)) {
                             towersData = val.data;
                         } else if (val.success && Array.isArray(val.data)) {
                             towersData = val.data;
                         }
                    }
                    
                    console.log("DEBUG: Resolved Towers Data", towersData);

                    // MAP API Data -> Blueprint Data
                    const blueprintData: BlueprintProperty = {
                        id: usableProp.id,
                        name: usableProp.name,
                        address: (usableProp.location?.area || usableProp.location?.locality) || '', 
                        developer: usableProp.developerName,
                        heroImage: usableProp.primaryImageUrl || '/api/placeholder/1200/400',
                        status: usableProp.constructionStatus || usableProp.status, 
                        propertyType: usableProp.propertyType || usableProp.projectType,
                        projectBrief: usableProp.description || '',
                        amenities: usableProp.amenities || [],
                        legalCompliance: {
                            reraNumber: usableProp.reraId || '',
                            authority: 'MahaRERA', 
                            status: 'Approved' 
                        },
                        documents: usableProp.documents || [],
                        towers: towersData.map((t: any) => ({
                            id: t.id,
                            name: t.name,
                            totalFloors: t.totalFloors || 0,
                            unitsPerFloor: t.unitsPerFloor || 0,
                            startingUnitNumber: t.startingUnitNumber || 0,
                            units: (t.units || []).map((u: any) => ({
                                ...u,
                                carpetArea: u.carpetArea || u.areaSqft || 1000,
                                builtUpArea: u.builtUpArea || 1200,
                                superBuiltUpArea: u.superBuiltUpArea || 1500,
                                basePrice: u.basePrice || 0,
                                floorRise: u.floorRise || 0,
                                plcCharges: u.plcCharges || 0,
                                totalPrice: u.totalPrice || 0,
                                configuration: u.configuration || u.type || '2BHK'
                            })),
                            status: t.status || 'Planning'
                        })),
                        metadata: {
                            createdAt: usableProp.createdAt,
                            lastUpdated: usableProp.updatedAt,
                            version: 1
                        }
                    };

                    setInitialData(blueprintData);
                } else {
                     console.error("DEBUG: Property fetch failed", propRes.reason);
                }
            } catch (error) {
                console.error("Failed to load property:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleSave = async (data: BlueprintProperty) => {
        try {
            console.log("Saving existing property...", data);
            
            const updates: any = {
                name: data.name,
                developerName: data.developer,
                status: data.status, // Also sync the main status field
                location: {
                    area: data.address,
                    locality: data.address,
                    fullAddress: data.address,
                    city: 'Mumbai', 
                    pincode: '400001'
                },
                primaryImageUrl: data.heroImage,
                constructionStatus: data.status,
                propertyType: data.propertyType,
                description: data.projectBrief,
                amenities: data.amenities,
                documents: data.documents,
                reraId: data.legalCompliance?.reraNumber,
                reraAuthority: data.legalCompliance?.authority,
                reraStatus: data.legalCompliance?.status,
                reraExpiryDate: data.legalCompliance?.expiryDate,
                locationIntelligence: data.locationIntelligence,
                updatedAt: new Date().toISOString()
            };

            await propertiesAPI.update(id, updates);

            if (data.towers) {
                await Promise.all(data.towers.map((tower: any) => 
                    propertiesAPI.updateTower(tower.id, {
                        name: tower.name,
                        totalFloors: tower.totalFloors,
                        totalUnits: tower.units.length,
                        units: tower.units.map((u: any) => ({
                            id: u.id,
                            unitNumber: u.unitNumber,
                            floor: u.floor,
                            configuration: u.configuration,
                            status: u.status,
                            carpetArea: u.carpetArea,
                            builtUpArea: u.builtUpArea,
                            superBuiltUpArea: u.superBuiltUpArea,
                            basePrice: u.basePrice,
                            floorRise: u.floorRise,
                            plcCharges: u.plcCharges,
                            totalPrice: u.totalPrice
                        })),
                        updatedAt: new Date().toISOString()
                    } as any)
                ));
            }

            showToast("Property updated successfully!", "success");
            setMode('view');
            router.refresh(); 
        } catch (error: any) {
            console.error("Failed to save property:", error);
            const message = error instanceof Error ? error.message : "Failed to save changes.";
            showToast(message, "error");
        }
    };

    const handleDelete = async (propertyId: string) => {
        try {
            await propertiesAPI.delete(propertyId);
            showToast("Property deleted successfully.", "success");
            router.push('/properties');
            router.refresh();
        } catch (error) {
            console.error("Failed to delete property:", error);
            showToast("Failed to delete property.", "error");
        }
    };

    if (isLoading) {
        return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading Property... (ID: {id})</div>;
    }

    if (!initialData && id !== 'new') {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-4">
                <div className="text-xl font-bold text-red-400">Property not found</div>
                <div className="text-sm text-slate-400">ID: {id}</div>
                <button 
                    onClick={() => router.push('/properties')}
                    className="px-4 py-2 bg-slate-800 rounded hover:bg-slate-700 transition"
                >
                    Back to Properties
                </button>
            </div>
        );
    }

    return (
        <PropertyBlueprintEditor
            mode={mode}
            initialData={initialData}
            onSave={handleSave}
            onDelete={handleDelete}
            onBack={() => router.push('/properties')}
            onEditToggle={(newMode) => setMode(newMode as 'view' | 'edit')}
            title={mode === 'view' ? "Property Details" : "Edit Property"}
        />
    );
}
