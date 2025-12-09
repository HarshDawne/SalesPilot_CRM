import { z } from "zod";

// Helper to coerce string inputs to numbers (or undefined if empty)
const numericString = z.preprocess(
    (val) => {
        if (val === "" || val === null || val === undefined) return undefined;
        const num = Number(val);
        return isNaN(num) ? undefined : num;
    },
    z.number().optional()
);

const intString = z.preprocess(
    (val) => {
        if (val === "" || val === null || val === undefined) return undefined;
        const num = Number(val);
        return isNaN(num) ? undefined : num;
    },
    z.number().int().optional()
);

export const propertySchema = z.object({
    name: z.string().min(1, "Name is required"),
    code: z.string().optional().nullable(),
    status: z.enum(["ACTIVE", "UNDER_CONSTRUCTION", "COMPLETED", "ON_HOLD", "PLANNING"]),
    projectType: z.enum(["RESIDENTIAL", "COMMERCIAL", "MIXED_USE"]),
    developerName: z.string().min(1, "Developer name is required"),
    tagline: z.string().optional().nullable(),
    description: z.string().optional().nullable(),

    // Location
    location: z.object({
        city: z.string().min(1, "City is required"),
        locality: z.string().min(1, "Locality/Area is required"),
        fullAddress: z.string().min(1, "Full address is required"),
        pincode: z.string().min(1, "Pincode is required"),
        landmark: z.string().optional().nullable(),
        latitude: z.coerce.number().optional().nullable(),
        longitude: z.coerce.number().optional().nullable(),
        googleMapsUrl: z.string().optional().nullable(),
    }),

    // Inventory - use z.coerce to automatically convert string inputs to numbers
    totalTowers: z.coerce.number().int().min(1, "Total towers must be at least 1"),
    totalUnits: z.coerce.number().int().min(0, "Total units cannot be negative"),
    defaultFloorsPerTower: intString.nullable(),
    minBedrooms: numericString.nullable(),
    maxBedrooms: numericString.nullable(),
    minAreaSqft: numericString.nullable(),
    maxAreaSqft: numericString.nullable(),

    // Regulatory
    reraId: z.string().min(1, "RERA ID is required"),
    reraUrl: z.string().optional().nullable(),
    reraExpiryDate: z.string().optional().nullable(),

    // Dates
    launchDate: z.string().min(1, "Launch date is required"),
    expectedCompletion: z.string().min(1, "Expected completion date is required"),
    possessionFrom: z.string().optional().nullable(),

    // Pricing - use z.coerce for number fields
    startingPrice: numericString.nullable(),
    pricePerSqftFrom: numericString.nullable(),
    pricePerSqftTo: numericString.nullable(),
    bookingAmount: numericString.nullable(),
    maintenanceChargePerSqft: numericString.nullable(),
    gstIncluded: z.boolean().default(true),
    // Handle empty string for paymentPlanType
    paymentPlanType: z.preprocess(
        (val) => val === "" ? null : val,
        z.enum(["CONSTRUCTION_LINKED", "TIME_LINKED", "DOWN_PAYMENT", "FLEXI", "OTHER"]).nullable()
    ).optional(),

    // Marketing
    primaryImageUrl: z.string().optional().nullable(),
    brochureUrl: z.string().optional().nullable(),
    highlights: z.array(z.string()).default([]),
    amenities: z.array(z.string()).default([]),

    // Flags
    isActive: z.boolean().default(true),
    priorityRank: numericString.nullable(),
});

export type PropertyFormData = z.infer<typeof propertySchema>;
