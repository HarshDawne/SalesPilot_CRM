// API Security Utilities - Encryption, validation, anomaly detection

import crypto from 'crypto';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 16;

export class SecurityUtils {

    // =========================================================================
    // DATA ENCRYPTION
    // =========================================================================

    static encrypt(text: string): string {
        try {
            const iv = crypto.randomBytes(IV_LENGTH);
            const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');

            const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');

            const authTag = cipher.getAuthTag();

            // Format: iv:authTag:encrypted
            return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
        } catch (error) {
            console.error('[Security] Encryption error:', error);
            throw new Error('Encryption failed');
        }
    }

    static decrypt(encryptedText: string): string {
        try {
            const parts = encryptedText.split(':');
            if (parts.length !== 3) {
                throw new Error('Invalid encrypted format');
            }

            const [ivHex, authTagHex, encrypted] = parts;
            const iv = Buffer.from(ivHex, 'hex');
            const authTag = Buffer.from(authTagHex, 'hex');
            const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');

            const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
            decipher.setAuthTag(authTag);

            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            console.error('[Security] Decryption error:', error);
            throw new Error('Decryption failed');
        }
    }

    // =========================================================================
    // PHONE NUMBER HASHING (ONE-WAY)
    // =========================================================================

    static hashPhoneNumber(phone: string): string {
        return crypto.createHash('sha256').update(phone).digest('hex');
    }

    // =========================================================================
    // REQUEST SIGNATURE VALIDATION
    // =========================================================================

    static generateSignature(payload: any, secret: string): string {
        const payloadString = JSON.stringify(payload);
        return crypto
            .createHmac('sha256', secret)
            .update(payloadString)
            .digest('hex');
    }

    static validateSignature(
        payload: any,
        signature: string,
        secret: string
    ): boolean {
        const expectedSignature = this.generateSignature(payload, secret);
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    }

    // =========================================================================
    // ANOMALY DETECTION
    // =========================================================================

    private static requestCounts: Map<string, number[]> = new Map();

    static checkRateAnomaly(identifier: string, windowMinutes: number = 5): {
        isAnomaly: boolean;
        requestCount: number;
        threshold: number;
    } {
        const now = Date.now();
        const windowMs = windowMinutes * 60 * 1000;

        // Get or create request log for this identifier
        if (!this.requestCounts.has(identifier)) {
            this.requestCounts.set(identifier, []);
        }

        const requests = this.requestCounts.get(identifier)!;

        // Remove old requests outside the window
        const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
        this.requestCounts.set(identifier, [...validRequests, now]);

        const count = validRequests.length + 1;

        // Threshold: 300 calls per day = ~2 calls/minute
        // In 5-minute window: ~10 calls is normal
        // Flag if > 50 calls in 5 minutes (suspicious)
        const threshold = windowMinutes * 10;

        return {
            isAnomaly: count > threshold,
            requestCount: count,
            threshold,
        };
    }

    static checkOffHoursAccess(timezone: string = 'Asia/Kolkata'): boolean {
        const now = new Date();
        const hour = now.getHours();

        // Flag requests between 11 PM and 6 AM as suspicious
        return hour >= 23 || hour < 6;
    }

    static checkSuspiciousIP(ip: string): boolean {
        // Basic suspicious IP patterns
        const suspiciousPatterns = [
            /^10\./, // Private network
            /^192\.168\./, // Private network
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private network
            /^127\./, // Localhost
        ];

        // In production, you'd check against a blocklist or threat intelligence
        return suspiciousPatterns.some(pattern => pattern.test(ip));
    }

    // =========================================================================
    // USAGE LOGGING
    // =========================================================================

    static logApiUsage(data: {
        endpoint: string;
        method: string;
        ip: string;
        userAgent?: string;
        statusCode: number;
        duration?: number;
        error?: string;
    }) {
        const logEntry = {
            ...data,
            timestamp: new Date().toISOString(),
        };

        // In production, send to logging service or database
        console.log('[API Usage]', JSON.stringify(logEntry));

        // Check for anomalies
        const rateCheck = this.checkRateAnomaly(data.ip);
        if (rateCheck.isAnomaly) {
            console.warn(`[Security] Rate anomaly detected for IP ${data.ip}: ${rateCheck.requestCount} requests in 5 minutes`);
        }

        const offHours = this.checkOffHoursAccess();
        if (offHours) {
            console.warn(`[Security] Off-hours access from IP ${data.ip}`);
        }

        const suspiciousIP = this.checkSuspiciousIP(data.ip);
        if (suspiciousIP) {
            console.warn(`[Security] Suspicious IP detected: ${data.ip}`);
        }
    }
}
