/**
 * Enterprise Pricing Engine
 * Handles complex real-estate pricing logic including floor rise, PLC, and loading.
 */

export interface PricingFactors {
    basePricePerSqft: number;
    builtUpArea: number;
    floor: number;
    floorRiseRule: 'FLAT' | 'PER_FLOOR' | 'BLOCK';
    floorRiseAmount: number; // ₹ per sqft per floor
    floorRiseBreakpoint?: number; // Floor after which rise starts
    plcCharges?: number; // Flat PLC for this unit
    taxPercentage?: number; // GST, etc.
}

export interface PricingResult {
    baseAmount: number;
    floorRiseAmount: number;
    plcAmount: number;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
}

export const PricingEngine = {
    calculateUnitPrice: (factors: PricingFactors): PricingResult => {
        const {
            basePricePerSqft,
            builtUpArea,
            floor,
            floorRiseRule,
            floorRiseAmount,
            floorRiseBreakpoint = 0,
            plcCharges = 0,
            taxPercentage = 0
        } = factors;

        // 1. Calculate Base Amount
        const baseAmount = basePricePerSqft * builtUpArea;

        // 2. Calculate Floor Rise
        let floorRiseTotal = 0;
        if (floor > floorRiseBreakpoint) {
            const applicableFloors = floor - floorRiseBreakpoint;
            
            if (floorRiseRule === 'PER_FLOOR') {
                floorRiseTotal = floorRiseAmount * applicableFloors * builtUpArea;
            } else if (floorRiseRule === 'FLAT') {
                floorRiseTotal = floorRiseAmount * builtUpArea;
            } else if (floorRiseRule === 'BLOCK') {
                // Example: Increment every 5 floors
                const blocks = Math.floor(applicableFloors / 5);
                floorRiseTotal = floorRiseAmount * blocks * builtUpArea;
            }
        }

        // 3. Subtotal
        const subtotal = baseAmount + floorRiseTotal + plcCharges;

        // 4. Tax
        const taxAmount = (subtotal * taxPercentage) / 100;

        // 5. Total
        const totalAmount = subtotal + taxAmount;

        return {
            baseAmount,
            floorRiseAmount: floorRiseTotal,
            plcAmount: plcCharges,
            subtotal,
            taxAmount,
            totalAmount
        };
    }
};
