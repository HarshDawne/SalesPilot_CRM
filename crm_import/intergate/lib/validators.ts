/**
 * Input Validation Functions
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INDIAN_PHONE_REGEX = /^(\+91)?[6-9]\d{9}$/;

/**
 * Validate UUID v4 format
 */
export function isValidUUID(id: string): boolean {
    return UUID_REGEX.test(id);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    return EMAIL_REGEX.test(email);
}

/**
 * Validate Indian phone number
 */
export function isValidPhone(phone: string): boolean {
    return INDIAN_PHONE_REGEX.test(phone.replace(/\s+/g, ''));
}

/**
 * Sanitize text input to prevent XSS
 */
export function sanitizeInput(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Validate file size
 */
export function isValidFileSize(bytes: number, maxMB: number): boolean {
    const maxBytes = maxMB * 1024 * 1024;
    return bytes > 0 && bytes <= maxBytes;
}

/**
 * Validate file type
 */
export function isValidFileType(mimeType: string, allowedTypes: readonly string[]): boolean {
    return allowedTypes.includes(mimeType);
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
    return filename
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_{2,}/g, '_')
        .slice(0, 255);
}

/**
 * Validate price (positive number)
 */
export function isValidPrice(price: number): boolean {
    return typeof price === 'number' && price >= 0 && isFinite(price);
}

/**
 * Validate area (positive number)
 */
export function isValidArea(area: number): boolean {
    return typeof area === 'number' && area > 0 && isFinite(area);
}

/**
 * Validate percentage (0-100)
 */
export function isValidPercentage(percentage: number): boolean {
    return typeof percentage === 'number' && percentage >= 0 && percentage <= 100;
}
