const { propertySchema } = require('../src/lib/validations/property');
const { z } = require('zod');

// Simulate the payload that was failing
const failingPayload = {
    name: "Skyline Residency",
    developerName: "Skyline Developers",
    status: "Under Construction", // Was failing because it wasn't uppercase
    location: {
        area: "Andheri West", // Was failing because 'area' was missing from schema
        locality: "Andheri West",
        fullAddress: "Andheri West, Mumbai",
        city: "Mumbai",
        pincode: "400001"
    },
    constructionStatus: "Under Construction",
    propertyType: "Residential",
    description: "Premium apartments",
    amenities: [
        { id: "am-001", name: "Swimming Pool", icon: "Waves" } // Was failing because it expected strings
    ],
    documents: [
        { id: "doc-1", name: "Brochure.pdf" } // Was failing because 'documents' was missing
    ]
};

try {
    console.log("🔍 Testing relaxed propertySchema...");
    const validated = propertySchema.partial().parse(failingPayload);
    console.log("✅ Validation SUCCESSFUL! The new schema correctly handles the payload.");
    console.log("Validated Data Sample:", JSON.stringify({
        status: validated.status,
        area: validated.location.area,
        amenitiesCount: validated.amenities.length,
        documentsCount: validated.documents.length
    }, null, 2));
} catch (error) {
    console.error("❌ Validation FAILED:");
    if (error instanceof z.ZodError) {
        console.error(JSON.stringify(error.issues, null, 2));
    } else {
        console.error(error);
    }
    process.exit(1);
}
