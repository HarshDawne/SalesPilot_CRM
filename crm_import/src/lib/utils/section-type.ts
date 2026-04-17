import { SectionType, UnitType, PropertyType } from '../../types/property';

const RESIDENTIAL_UNIT_TYPES: UnitType[] = [
    UnitType.ONE_BHK,
    UnitType.TWO_BHK,
    UnitType.THREE_BHK,
    UnitType.FOUR_BHK
];

const COMMERCIAL_UNIT_TYPES: UnitType[] = [
    UnitType.SHOP,
    UnitType.OFFICE
];

const RESIDENTIAL_INDICATORS = ['BHK', 'FLAT', 'APARTMENT', 'PENTHOUSE', 'RESIDENTIAL', 'STAY', 'HOME'];
const COMMERCIAL_INDICATORS = ['SHOP', 'OFFICE', 'SHOWROOM', 'LEASE', 'WAREHOUSE', 'COMMERCIAL', 'RETAIL', 'BUSINESS'];

/**
 * Centrally infers the SectionType (Residential/Commercial) based on available data.
 * Used for both Write-time enforcement and Read-time self-healing.
 */
export function inferSectionType(
    item: any,
    propertyType?: string | PropertyType
): SectionType {
    // 1. Direct match by unit type (Highest Priority)
    if (item.type) {
        if (RESIDENTIAL_UNIT_TYPES.includes(item.type as UnitType)) return 'Residential';
        if (COMMERCIAL_UNIT_TYPES.includes(item.type as UnitType)) return 'Commercial';
    }

    // 2. Inference from specifications (Residential usually has bedrooms)
    if (item.specifications?.bedrooms && item.specifications.bedrooms > 0) {
        return 'Residential';
    }

    // 3. Inference from name/number/string indicators
    const searchString = `${item.name || ''} ${item.unitNumber || ''} ${item.type || ''}`.toUpperCase();
    if (RESIDENTIAL_INDICATORS.some(ind => searchString.includes(ind))) return 'Residential';
    if (COMMERCIAL_INDICATORS.some(ind => searchString.includes(ind))) return 'Commercial';

    // 4. Fallback to Property Type context
    const pt = (propertyType || '').toLowerCase();
    if (pt === 'residential' || pt === 'res') return 'Residential';
    if (pt === 'commercial' || pt === 'comm') return 'Commercial';

    // 5. Safe Default (Residential is the majority case in Mixed-Use)
    return 'Residential';
}

/**
 * Validates if the sectionType is appropriate for the property's type.
 * Used to ensure architectural integrity.
 */
export function isValidSectionForProperty(section: SectionType, propertyType: PropertyType | string): boolean {
    const pt = (propertyType || '').toLowerCase();
    if (pt === 'residential' && section !== 'Residential') return false;
    if (pt === 'commercial' && section !== 'Commercial') return false;
    // Mixed-Use can have either
    return true;
}
