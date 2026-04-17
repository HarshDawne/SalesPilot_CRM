import { Unit } from "../inventory/types";
import { CostSheet, CostComponent, CostSheetStatus } from "./types";
import { v4 as uuidv4 } from 'uuid';

export class CostSheetService {

    static generateQuotation(unit: Unit, leadId: string, discount: number = 0): CostSheet {
        const components: CostComponent[] = [];

        // 1. Base Cost
        const baseCost = unit.price.basePrice; // Assumed total base cost or derived
        components.push({ name: "Base Cost", amount: baseCost, description: "Unit Base Price" });

        // 2. Floor Rise
        if (unit.price.floorRise > 0) {
            components.push({ name: "Floor Rise Charges", amount: unit.price.floorRise });
        }

        // 3. PLC
        if (unit.price.plc > 0) {
            components.push({ name: "PLC (Preferential Location)", amount: unit.price.plc });
        }

        // 4. Calculate Agreement Value
        let agreementValue = baseCost + unit.price.floorRise + unit.price.plc - discount;

        // 5. Taxes (GST 5% for Under Construction)
        const gstRate = 0.05;
        const gstAmount = agreementValue * gstRate;
        components.push({ name: "GST (5%)", amount: gstAmount, isTax: true, rate: 5 });

        // 6. Registration & Stamp Duty (approx 6% + 30k)
        const regRate = 0.06;
        const regAmount = (agreementValue * regRate) + 30000;
        components.push({ name: "Stamp Duty & Registration", amount: regAmount, isTax: true, rate: 6 });

        // 7. Amenities/Club House (Fixed)
        const clubHouse = 250000;
        components.push({ name: "Club House Membership", amount: clubHouse });

        const totalTaxes = gstAmount + regAmount;
        const grandTotal = agreementValue + totalTaxes + clubHouse;

        return {
            id: uuidv4(),
            leadId,
            unitId: unit.id,
            unitNumber: unit.unitNumber,
            baseRate: 0, // derived
            carpetArea: unit.area.carpet || 0,
            components,

            totalAgreementValue: agreementValue,
            totalTaxes,
            grandTotal,
            discountApplied: discount,

            generatedBy: 'SYSTEM', // Replace with current user context
            status: 'DRAFT',
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
}
