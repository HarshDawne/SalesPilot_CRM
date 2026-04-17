import { Entity } from "../core/types";

export type CostSheetStatus = 'DRAFT' | 'GENERATED' | 'PENDING_APPROVAL' | 'APPROVED';

export interface CostComponent {
    name: string;
    amount: number;
    description?: string;
    isTax?: boolean;
    rate?: number; // percentage if tax
}

export interface CostSheet extends Entity {
    leadId: string;
    unitId: string;
    unitNumber: string; // snapshot

    // Pricing Breakdown
    baseRate: number; // per sqft
    carpetArea: number;

    components: CostComponent[];

    totalAgreementValue: number; // Base + PLCs + Floor Rise
    totalTaxes: number;
    grandTotal: number;

    discountApplied: number;

    generatedBy: string; // Agent ID
    status: CostSheetStatus;
}
