/**
 * Upload Service
 * File validation, sanitization, and upload handling
 */

import { MAX_UPLOAD_MB, ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, ALLOWED_DOCUMENT_TYPES } from '../constants';
import { isValidFileSize, isValidFileType, sanitizeFilename } from '../validators';
import { generateUUID } from '../utils';
import type { Document, Media, DocumentCategory } from '@/types/property';

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxMB?: number): { valid: boolean; error?: string } {
    const max = maxMB || MAX_UPLOAD_MB;

    if (!isValidFileSize(file.size, max)) {
        return {
            valid: false,
            error: `File size exceeds maximum of ${max}MB`,
        };
    }

    return { valid: true };
}

/**
 * Validate file type
 */
export function validateFileType(
    file: File,
    allowedTypes: readonly string[]
): { valid: boolean; error?: string } {
    if (!isValidFileType(file.type, allowedTypes)) {
        return {
            valid: false,
            error: `File type ${file.type} is not allowed`,
        };
    }

    return { valid: true };
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
    const sizeCheck = validateFileSize(file);
    if (!sizeCheck.valid) return sizeCheck;

    const typeCheck = validateFileType(file, ALLOWED_IMAGE_TYPES);
    if (!typeCheck.valid) return typeCheck;

    return { valid: true };
}

/**
 * Validate video file
 */
export function validateVideoFile(file: File): { valid: boolean; error?: string } {
    const sizeCheck = validateFileSize(file);
    if (!sizeCheck.valid) return sizeCheck;

    const typeCheck = validateFileType(file, ALLOWED_VIDEO_TYPES);
    if (!typeCheck.valid) return typeCheck;

    return { valid: true };
}

/**
 * Validate document file
 */
export function validateDocumentFile(file: File): { valid: boolean; error?: string } {
    const sizeCheck = validateFileSize(file);
    if (!sizeCheck.valid) return sizeCheck;

    const typeCheck = validateFileType(file, ALLOWED_DOCUMENT_TYPES);
    if (!typeCheck.valid) return typeCheck;

    return { valid: true };
}

/**
 * Generate thumbnail URL (mock - in production use image processing service)
 */
export function generateThumbnail(file: File): Promise<string> {
    return new Promise((resolve) => {
        // In production, this would:
        // 1. Read file
        // 2. Generate thumbnail using Sharp/Jimp
        // 3. Upload to storage
        // 4. Return thumbnail URL

        // Mock implementation
        const reader = new FileReader();
        reader.onloadend = () => {
            resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Upload document (mock implementation)
 */
export async function uploadDocument(
    file: File,
    projectId: string,
    category: DocumentCategory,
    userId: string,
    buildingId?: string
): Promise<Document> {
    // Validate
    const validation = validateDocumentFile(file);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    // Sanitize filename
    const safeFilename = sanitizeFilename(file.name);

    // In production, this would upload to cloud storage (S3, Cloudinary, etc.)
    const fileUrl = `/uploads/documents/${projectId}/${safeFilename}`;

    const document: Document = {
        id: generateUUID(),
        projectId,
        buildingId,
        name: file.name,
        category,
        fileUrl,
        fileName: safeFilename,
        fileSize: file.size,
        mimeType: file.type,
        uploadedBy: userId,
        uploadedAt: new Date(),
    };

    return document;
}

/**
 * Upload media (image or video)
 */
export async function uploadMedia(
    file: File,
    projectId: string,
    userId: string,
    type: 'image' | 'video',
    buildingId?: string,
    caption?: string
): Promise<Media> {
    // Validate
    const validation = type === 'image' ? validateImageFile(file) : validateVideoFile(file);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    // Sanitize filename
    const safeFilename = sanitizeFilename(file.name);

    // Generate thumbnail for videos
    let thumbnailUrl: string | undefined;
    if (type === 'video') {
        // In production, extract first frame as thumbnail
        thumbnailUrl = `/uploads/thumbnails/${projectId}/${safeFilename}.jpg`;
    } else {
        // For images, generate smaller thumbnail
        thumbnailUrl = await generateThumbnail(file);
    }

    // In production, upload to cloud storage
    const fileUrl = `/uploads/media/${projectId}/${safeFilename}`;

    const media: Media = {
        id: generateUUID(),
        projectId,
        buildingId,
        type,
        url: fileUrl,
        thumbnailUrl,
        fileName: safeFilename,
        fileSize: file.size,
        mimeType: file.type,
        caption,
        order: 0, // Set by calling code
        uploadedBy: userId,
        uploadedAt: new Date(),
    };

    return media;
}

/**
 * Delete file (mock implementation)
 */
export async function deleteFile(fileUrl: string): Promise<void> {
    // In production, this would:
    // 1. Delete from cloud storage
    // 2. Delete thumbnails
    // 3. Update database

    console.log(`Mock delete file: ${fileUrl}`);
}

/**
 * Get file extension
 */
export function getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Get MIME type from extension
 */
export function getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        mp4: 'video/mp4',
        webm: 'video/webm',
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    return mimeTypes[extension] || 'application/octet-stream';
}
