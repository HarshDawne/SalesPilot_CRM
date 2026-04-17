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
    // REQUIRED FIELDS
    name: z.string().min(1, "Name is required"),
    developerName: z.string().optional().default("Unknown Developer"), // Made optional with default
    status: z.enum(["ACTIVE", "UNDER_CONSTRUCTION", "COMPLETED", "ON_HOLD", "PLANNING"]).default("PLANNING"),
    projectType: z.string().default("RESIDENTIAL"), // Relaxed from enum to string for flexibility
    constructionStatus: z.string().optional(),
    
    // OPTIONAL FIELDS (Must not block save)
    code: z.string().optional().nullable(),
    tagline: z.string().optional().nullable(),
    description: z.string().optional().nullable(),

    // Location - All optional
    location: z.object({
        city: z.string().optional().default(""),
        locality: z.string().optional().default(""),
        fullAddress: z.string().optional().default(""),
        pincode: z.string().optional().default(""),
        landmark: z.string().optional().nullable(),
        latitude: z.coerce.number().optional().nullable(),
        longitude: z.coerce.number().optional().nullable(),
        googleMapsUrl: z.string().optional().nullable(),
    }).optional().default({
        city: "",
        locality: "",
        fullAddress: "",
        pincode: ""
    }),

    // Inventory - All optional
    totalTowers: z.coerce.number().int().optional().default(1),
    totalUnits: z.coerce.number().int().optional().default(0),
    defaultFloorsPerTower: intString.nullable(),
    minBedrooms: numericString.nullable(),
    maxBedrooms: numericString.nullable(),
    minAreaSqft: numericString.nullable(),
    maxAreaSqft: numericString.nullable(),

    // Regulatory - All optional
    reraId: z.string().optional().default(""),
    reraUrl: z.string().optional().nullable(),
    reraExpiryDate: z.string().optional().nullable(),

    // Dates - All optional
    launchDate: z.string().optional().default(new Date().toISOString()),
    expectedCompletion: z.string().optional().default(new Date().toISOString()),
    possessionFrom: z.string().optional().nullable(),

    // Pricing - All optional
    startingPrice: numericString.nullable(),
    pricePerSqftFrom: numericString.nullable(),
    pricePerSqftTo: numericString.nullable(),
    bookingAmount: numericString.nullable(),
    maintenanceChargePerSqft: numericString.nullable(),
    gstIncluded: z.boolean().default(true),
    paymentPlanType: z.preprocess(
        (val) => val === "" ? null : val,
        z.string().nullable() // Relaxed from enum
    ).optional(),

    // Marketing - All optional
    primaryImageUrl: z.string().optional().nullable(),
    brochureUrl: z.string().optional().nullable(),
    highlights: z.array(z.string()).default([]),
    amenities: z.array(z.string()).default([]),

    // Flags
    isActive: z.boolean().default(true),
    priorityRank: numericString.nullable(),
});

export type PropertyFormData = z.infer<typeof propertySchema>;
