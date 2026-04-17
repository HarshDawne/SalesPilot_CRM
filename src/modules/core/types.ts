export type UUID = string;

export interface Entity {
    id: UUID;
    createdAt: Date;
    updatedAt: Date;
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

export interface ServiceResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type Status = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
