import { v4 as uuidv4 } from 'uuid';

export type RenderStatus = 'REQUESTED' | 'IN_PROGRESS' | 'READY' | 'DELIVERED';
export type RenderType = 'EXTERIOR' | 'INTERIOR' | 'AERIAL' | 'WALKTHROUGH' | 'CUSTOM';

export interface RenderRequest {
    id: string;
    propertyId: string;
    unitId?: string;
    requestedBy: string; // leadId or userId
    requestedByName: string;
    renderType: RenderType;
    description?: string;
    specifications?: {
        viewAngle?: string;
        timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
        weather?: 'sunny' | 'cloudy' | 'rainy';
        customRequirements?: string;
    };
    status: RenderStatus;
    requestedAt: string;
    estimatedDelivery?: string;
    assignedTo?: string; // developer/designer
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    renders: Render3D[];
    internalNotes?: string;
    createdAt: string;
    updatedAt: string;
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
