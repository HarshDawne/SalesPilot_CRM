
import { Lead, LeadStage } from "./db";

export function enrichLead(lead: Lead): Lead {
    const enriched = { ...lead };

    // 1. Calculate Score Breakdown
    const scoreBreakdown = calculateScore(enriched);
    enriched.scoreBreakdown = scoreBreakdown;

    // Sum up for total AI Score
    enriched.aiScore = Math.min(100,
        scoreBreakdown.demographics +
        scoreBreakdown.behavior +
        scoreBreakdown.engagement +
        scoreBreakdown.aiAdjustment
    );

    // 2. Auto-tagging based on score and budget
    if (!enriched.leadTags) enriched.leadTags = [];

    if (enriched.aiScore >= 80) {
        addTag(enriched, 'hot');
        addTag(enriched, 'high_intent');
    } else if (enriched.aiScore >= 50) {
        addTag(enriched, 'warm');
    } else {
        addTag(enriched, 'cold');
    }

    // Budget tagging
    if (enriched.budgetMin && enriched.budgetMin >= 50000000) { // 5Cr+
        addTag(enriched, 'hni');
        addTag(enriched, 'luxury');
    }

    // 3. Inference
    if (!enriched.preferenceProfile) {
        enriched.preferenceProfile = {
            budgetCurrency: 'INR',
            propertyType: [],
            preferredLocations: [],
            intentLevel: 'medium',
            qualifier: 'ai',
            qualifiedAt: new Date().toISOString()
        };
    }

    // Infer Property Type from Budget
    if (!enriched.qualification?.propertyType && enriched.budgetMin) {
        if (enriched.budgetMin < 8000000) {
            enriched.qualification = { ...enriched.qualification!, propertyType: "1BHK" } as any; // Legacy mapping
            // Also update new profile
            enriched.preferenceProfile.propertyType?.push("1BHK");
        } else if (enriched.budgetMin < 15000000) {
            enriched.qualification = { ...enriched.qualification!, propertyType: "2BHK" } as any;
            enriched.preferenceProfile.propertyType?.push("2BHK");
        } else {
            enriched.qualification = { ...enriched.qualification!, propertyType: "3BHK" } as any;
            enriched.preferenceProfile.propertyType?.push("3BHK", "4BHK");
        }
    }

    return enriched;
}

function calculateScore(lead: Lead) {
    let demographics = 0;
    let behavior = 0;
    let engagement = 0;
    let aiAdjustment = 0;

    // Demographics (Source & Info)
    if (lead.email) demographics += 10;
    if (lead.primaryPhone) demographics += 10;
    if (lead.createdVia === 'referral') demographics += 20;
    if (lead.createdVia === 'website') demographics += 10;

    // Behavior (Budget & Location)
    if (lead.budgetMin) behavior += 10;
    if (lead.preferredLocation) behavior += 10;

    // Engagement (Initial) - New leads haven't engaged yet, so base score
    engagement += 5;

    // Random AI Adjustment (Simulation)
    aiAdjustment = Math.floor(Math.random() * 20);

    return {
        demographics: Math.min(30, demographics),
        behavior: Math.min(30, behavior),
        engagement: Math.min(20, engagement),
        aiAdjustment
    };
}

function addTag(lead: Lead, tag: string) {
    if (!lead.leadTags?.includes(tag)) {
        lead.leadTags?.push(tag);
    }
}
