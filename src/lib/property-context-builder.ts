/**
 * Property Context Builder
 * Fetches property details and formats them for AI conversation context
 */

import { db } from './db';
import fs from 'fs';
import path from 'path';
import type { CampaignContext, CampaignSourceType, InventoryScope } from '@/modules/communication/types/campaign.types';

interface PropertyContext {
    properties: Array<{
        name: string;
        location: string;
        type: string;
        amenities: string[];
        priceRange: string;
        configurations: string;
        liveAvailability?: string;
        urgencySignal?: string;
        strictBounds?: string;
    }>;
    knowledgeBase: string;
    script: string;
}

/**
 * Build CampaignContext from property/tower/unit selections
 * This creates the immutable context that will be stored with the campaign
 */
export async function buildCampaignContext(params: {
    sourceType: CampaignSourceType;
    propertyId?: string;
    towerIds?: string[];
    unitIds?: string[];
}): Promise<CampaignContext> {
    const { sourceType, propertyId, towerIds, unitIds } = params;

    // Build inventory scope
    const inventoryScope: InventoryScope = {
        propertyId,
        towerIds: towerIds || [],
        unitIds: unitIds || [],
        criteria: {}
    };

    // Query units to calculate pricing and availability
    if (unitIds && unitIds.length > 0) {
        // Specific units selected
        const units = unitIds.map(id => db.units.findById(id)).filter(Boolean);
        const prices = units.map((u: any) => u.totalPrice).filter(Boolean);
        const statuses = units.map((u: any) => u.status);

        if (prices.length > 0) {
            inventoryScope.criteria!.minPrice = Math.min(...prices);
            inventoryScope.criteria!.maxPrice = Math.max(...prices);
        }

        // Get unique unit types
        const types = [...new Set(units.map((u: any) => u.type))];
        inventoryScope.criteria!.type = types;

        // Only include available/reserved units
        inventoryScope.criteria!.status = ['AVAILABLE', 'RESERVED'];

    } else if (towerIds && towerIds.length > 0) {
        // Tower(s) selected - get all units from those towers
        const allUnits = db.units.findAll();
        const towerUnits = allUnits.filter((u: any) => towerIds.includes(u.towerId));

        const availableUnits = towerUnits.filter((u: any) =>
            u.status === 'AVAILABLE' || u.status === 'RESERVED'
        );

        const prices = availableUnits.map((u: any) => u.totalPrice).filter(Boolean);
        if (prices.length > 0) {
            inventoryScope.criteria!.minPrice = Math.min(...prices);
            inventoryScope.criteria!.maxPrice = Math.max(...prices);
        }

        const types = [...new Set(availableUnits.map((u: any) => u.type))];
        inventoryScope.criteria!.type = types;
        inventoryScope.criteria!.status = ['AVAILABLE', 'RESERVED'];

    } else if (propertyId) {
        // Entire property selected
        const allUnits = db.units.findAll();
        const propertyUnits = allUnits.filter((u: any) => u.propertyId === propertyId);

        const availableUnits = propertyUnits.filter((u: any) =>
            u.status === 'AVAILABLE' || u.status === 'RESERVED'
        );

        const prices = availableUnits.map((u: any) => u.totalPrice).filter(Boolean);
        if (prices.length > 0) {
            inventoryScope.criteria!.minPrice = Math.min(...prices);
            inventoryScope.criteria!.maxPrice = Math.max(...prices);
        }

        const types = [...new Set(availableUnits.map((u: any) => u.type))];
        inventoryScope.criteria!.type = types;
        inventoryScope.criteria!.status = ['AVAILABLE', 'RESERVED'];
    }

    // Build campaign context
    const context: CampaignContext = {
        sourceType,
        inventoryScope,
        createdFrom: {
            page: sourceType === 'TOWER' ? 'tower_page' :
                sourceType === 'UNIT' ? 'unit_view' :
                    'property_page',
            entityId: propertyId || towerIds?.[0] || unitIds?.[0] || 'unknown',
            timestamp: new Date().toISOString()
        }
    };

    return context;
}

/**
 * Build comprehensive context for Voice AI including:
 * - Selected property details
 * - Citizen Properties knowledge base
 * - Aarini sales script
 */
export async function buildPropertyContext(fallbackPropertyIds: string[], campaignContext?: CampaignContext): Promise<PropertyContext> {
    
    // Determine the inventory scope
    const scope = campaignContext?.inventoryScope;
    let propertyIdsToFetch = [...(fallbackPropertyIds || [])];
    
    if (scope && scope.propertyId && !propertyIdsToFetch.includes(scope.propertyId)) {
        propertyIdsToFetch.push(scope.propertyId);
    }
    
    // Fetch property details
    const properties = propertyIdsToFetch.map(id => {
        const property = db.properties.findById(id);
        if (!property) return null;

        // If we have strict unit filters
        let availableUnits = db.units.findAll().filter((u: any) => 
            u.propertyId === id && 
            (u.status === 'AVAILABLE' || u.status === 'RESERVED')
        );
        
        let targetUnits = availableUnits;
        if (scope?.towerIds && scope.towerIds.length > 0) {
            targetUnits = targetUnits.filter((u: any) => scope.towerIds!.includes(u.towerId));
        }
        if (scope?.unitIds && scope.unitIds.length > 0) {
            targetUnits = targetUnits.filter((u: any) => scope.unitIds!.includes(u.id));
        }
        
        // Calculate dynamic properties based on the units
        let priceRange = formatPriceRange(property);
        if (targetUnits.length > 0) {
            const prices = targetUnits.map((u: any) => u.totalPrice || 0).filter((p: number) => p > 0);
            if (prices.length > 0) {
                const minPrice = Math.min(...prices);
                priceRange = `Starting from ₹${(minPrice / 100000).toFixed(2)} Lacs`;
            }
        }
        
        const typeSet = new Set(targetUnits.map((u: any) => u.type));
        const confText = Array.from(typeSet).filter(Boolean).join(', ') || getConfigurations(property);
        
        return {
            name: property.name,
            location: `${property.location.locality}, ${property.location.city}`,
            type: property.projectType || 'Residential',
            amenities: property.amenities || [],
            priceRange: priceRange,
            configurations: confText,
            liveAvailability: `${targetUnits.length} units currently available/reserved serving your campaign.`,
            urgencySignal: targetUnits.length <= 5 && targetUnits.length > 0 ? `URGENT: Only ${targetUnits.length} units left in this selection!` : '',
            strictBounds: targetUnits.length > 0 ? `DO NOT invent any other units or prices outside of the stated configurations.` : ''
        };
    }).filter(Boolean);

    // Load knowledge base
    const knowledgeBase = loadKnowledgeBase();

    // Load sales script
    const script = loadSalesScript();

    return {
        properties: properties as any,
        knowledgeBase,
        script
    };
}

/**
 * Format property context for AI prompt
 */
export function formatContextForAI(context: PropertyContext): string {
    let prompt = context.script + '\n\n---\n\n';

    prompt += '## AVAILABLE PROPERTIES\n\n';

    context.properties.forEach((prop, index) => {
        prompt += `### Property ${index + 1}: ${prop.name}\n`;
        prompt += `- **Location:** ${prop.location}\n`;
        prompt += `- **Type:** ${prop.type}\n`;
        prompt += `- **Price Range:** ${prop.priceRange}\n`;
        prompt += `- **Configurations:** ${prop.configurations}\n`;
        if (prop.liveAvailability) prompt += `- **Availability:** ${prop.liveAvailability}\n`;
        if (prop.urgencySignal) prompt += `- **URGENCY:** ${prop.urgencySignal}\n`;
        if (prop.strictBounds) prompt += `- **AI INSTRUCTION:** ${prop.strictBounds}\n`;
        if (prop.amenities.length > 0) {
            prompt += `- **Amenities:** ${prop.amenities.join(', ')}\n`;
        }
        prompt += '\n';
    });

    prompt += '---\n\n';
    prompt += context.knowledgeBase;

    return prompt;
}

// Helper functions

function formatPriceRange(property: any): string {
    // This is a simplified version - you might want to calculate based on units
    const basePrice = property.totalUnits ? 'Contact for pricing' : 'TBD';
    return basePrice;
}

function getConfigurations(property: any): string {
    // Extract configurations from property data
    // This is simplified - you might want to aggregate from units
    return '1 BHK, 2 BHK, 3 BHK available';
}

function loadKnowledgeBase(): string {
    try {
        const knowledgePath = path.join(process.cwd(), 'data', 'voice-knowledge', 'citizen-properties.md');
        return fs.readFileSync(knowledgePath, 'utf-8');
    } catch (error) {
        console.error('Failed to load knowledge base:', error);
        return '';
    }
}

function loadSalesScript(): string {
    try {
        const scriptPath = path.join(process.cwd(), 'data', 'voice-scripts', 'aarini-sales-script.md');
        return fs.readFileSync(scriptPath, 'utf-8');
    } catch (error) {
        console.error('Failed to load sales script:', error);
        return '';
    }
}
