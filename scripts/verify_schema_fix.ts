import { propertySchema } from '../src/lib/validations/property';

// Simulate the payload that was failing
const failingPayload = {
    name: "Skyline Residency",
    developerName: "Skyline Developers",
    status: "Under Construction", 
    location: {
        area: "Andheri West", 
        locality: "Andheri West",
        fullAddress: "Andheri West, Mumbai",
        city: "Mumbai",
        pincode: "400001"
    },
    constructionStatus: "Under Construction",
    propertyType: "Residential",
    description: "Premium apartments",
    amenities: [
        { id: "am-001", name: "Swimming Pool", icon: "Waves" } 
    ],
    documents: [
        { id: "doc-1", name: "Brochure.pdf" } 
    ]
};

try {
    console.log("🔍 Testing relaxed propertySchema...");
    // Use partial() because PUT uses it
    const validated = propertySchema.partial().parse(failingPayload);
    console.log("✅ Validation SUCCESSFUL!");
    console.log("Validated Data Sample:", JSON.stringify({
        status: validated.status,
        area: validated.location?.area,
        amenitiesCount: validated.amenities?.length,
        documentsCount: validated.documents?.length
    }, null, 2));
} catch (error) {
    console.error("❌ Validation FAILED:");
    console.error(error);
    process.exit(1);
}
