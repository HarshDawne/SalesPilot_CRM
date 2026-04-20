/**
 * Unified phone number normalization for Indian numbers.
 *
 * Handles all common input formats:
 *   "09876543210"        → "+919876543210"   (leading 0)
 *   "+91 98765 43210"    → "+919876543210"   (spaces)
 *   "+91-9876543210"     → "+919876543210"   (dashes)
 *   "91 9876543210"      → "+919876543210"   (missing +)
 *   "9876543210"         → "+919876543210"   (bare 10-digit)
 *   "+919876543210"      → "+919876543210"   (already E.164)
 */
export function normalizePhone(raw: string | undefined | null): string {
    if (!raw) return "";

    // 1) Strip everything except digits and a leading +
    let clean = raw.replace(/[^\d+]/g, "");

    // 2) If starts with +, keep it and work with digits after
    if (clean.startsWith("+")) {
        const digits = clean.slice(1);

        // +91XXXXXXXXXX (13 chars total) – valid Indian E.164
        if (digits.length === 12 && digits.startsWith("91")) {
            return `+${digits}`;
        }

        // +0XXXXXXXXXX – someone typed +0... strip the 0
        if (digits.startsWith("0")) {
            const stripped = digits.replace(/^0+/, "");
            if (stripped.length === 10) return `+91${stripped}`;
        }

        // Already has +, return as-is (international?)
        return clean;
    }

    // 3) No leading +, pure digits from here
    // "09876543210" → strip leading 0s, get 10 digits
    if (clean.startsWith("0")) {
        clean = clean.replace(/^0+/, "");
    }

    // "9876543210" → 10 digits, Indian local
    if (clean.length === 10) {
        return `+91${clean}`;
    }

    // "919876543210" → 12 digits starting with 91, missing +
    if (clean.length === 12 && clean.startsWith("91")) {
        return `+${clean}`;
    }

    // "919876543210..." or other, return with + if looks phone-ish
    if (clean.length >= 10) {
        return `+${clean}`;
    }

    // Too short / invalid – return as-is so caller can decide
    return clean;
}

/**
 * Validates a normalised phone number is usable for outbound calls.
 * Returns true for E.164 numbers with at least 12 digits (e.g. +91XXXXXXXXXX).
 */
export function isValidPhone(normalised: string): boolean {
    if (!normalised.startsWith("+")) return false;
    const digits = normalised.slice(1);
    return /^\d{10,15}$/.test(digits);
}
