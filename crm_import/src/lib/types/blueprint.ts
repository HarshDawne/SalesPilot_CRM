import { RenderAsset, RenderRequest } from '@/types/render';

export type UnitStatus = 'AVAILABLE' | 'SOLD' | 'BLOCKED' | 'BOOKED';

export interface BlueprintDocument {
    id: string;
    name: string;
    type: 'PDF' | 'DOC' | 'IMG';
    docType?: string;
    url?: string;
}

export interface BlueprintUnit {
    id: string;
    unitNumber: string;
    floor: number;
    type: string;
    status: UnitStatus;
    areaSqft: number;
    configuration?: string;
    price?: number;
    facing?: string;
    documents: BlueprintDocument[];
    renders?: RenderAsset[];
    renderRequests?: RenderRequest[];
    metadata?: Record<string, any>;
}

export interface BlueprintTower {
    id: string;
    name: string;
    totalFloors: number;
    unitsPerFloor: number;
    startingUnitNumber: number;
    units: BlueprintUnit[];
    status: 'Planning' | 'Construction' | 'Completed';
    possessionDate?: string;
    renders?: RenderAsset[];
    renderRequests?: RenderRequest[];
}

export interface BlueprintProperty {
    id: string;
    name: string;
    address: string;
    developer: string;
    heroImage: string;
    status: string;
    propertyType?: string;
    tagline?: string;
    projectBrief: string;
    amenities: string[];
    documents: BlueprintDocument[];
    renders?: RenderAsset[];
    renderRequests?: RenderRequest[];
    locationIntelligence?: {
        connectivity: { name: string; distance: string }[];
        schools: { name: string; distance: string }[];
        hospitals: { name: string; distance: string }[];
    };
    legalCompliance: {
        reraNumber: string;
        authority: string;
        status: string;
        expiryDate?: string;
    };
    towers: BlueprintTower[];
    metadata: {
        createdAt: string;
        lastUpdated: string;
        version: number;
    };
}
