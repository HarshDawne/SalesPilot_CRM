import { v4 as uuidv4 } from 'uuid';

export type RenderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';
export type RenderType = 'EXTERIOR' | 'INTERIOR' | 'UNIT_LEVEL' | 'AMENITY';
export type RenderSourceType = 'PROPERTY' | 'TOWER' | 'UNIT';

export interface RenderMedia {
    id: string;
    type: 'IMAGE' | 'VIDEO';
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: string;
}

export interface RenderRequest {
    id: string;
    sourceType: RenderSourceType;
    propertyId: string;
    towerId?: string;
    unitId?: string;

    // Grouped contact details
    contactDetails: {
        name: string;
        phone: string;
        email: string;
    };

    propertyName: string;
    builderName: string;
    requestedRenderTypes: RenderType[];
    instructions?: string;
    mediaUrls: string[]; // Stores URLs/Paths of uploaded media

    status: RenderStatus;
    createdAt: string;
    completedAt?: string;

    // Renders attached to this request (once completed)
    renders: RenderAsset[];
}

export interface RenderAsset {
    id: string; // renderId
    linkedTo: 'PROPERTY' | 'TOWER' | 'UNIT';
    propertyId: string;
    towerId?: string;
    unitId?: string;
    media: RenderMedia[]; // Images/Videos uploaded by admin
    renderType: RenderType;
    uploadedAt: string;
}

export interface Render3D {
    id: string;
    requestId: string;
    name: string;
    description?: string;
    fileUrl: string;
    thumbnailUrl?: string;
    fileSize: number;
    resolution: string; // e.g., "1920x1080"
    format: string; // e.g., "jpg", "png", "mp4"
    uploadedBy: string;
    uploadedAt: string;
    version: number;
    isLatest: boolean;
}

export interface RenderNotification {
    id: string;
    requestId: string;
    recipientId: string;
    type: 'REQUEST_RECEIVED' | 'IN_PROGRESS' | 'READY' | 'DELIVERED';
    message: string;
    read: boolean;
    createdAt: string;
}
