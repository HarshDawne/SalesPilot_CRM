import { NextRequest, NextResponse } from 'next/server';
import { unitService } from '@/lib/property-db';
import type { PriceCalculation } from '@/types/property';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { unitId, floorRise = 0, plcOptions = {}, otherCharges = 0 } = body;

        if (!unitId) {
            return NextResponse.json(
                { success: false, error: 'Unit ID is required' },
                { status: 400 }
            );
        }

        // Get unit
        const unit = await unitService.getById(unitId);
        if (!unit) {
            return NextResponse.json(
                { success: false, error: 'Unit not found' },
                { status: 404 }
            );
        }

        // Calculate price
        const basePrice = unit.basePrice;

        // Floor rise calculation (percentage of base price)
        const floorRiseAmount = (basePrice * floorRise) / 100;

        // PLC charges
        let plcCharges = 0;
        if (plcOptions.corner) plcCharges += 300000; // ₹3 Lakhs
        if (plcOptions.parkFacing) plcCharges += 500000; // ₹5 Lakhs
        if (plcOptions.roadFacing) plcCharges += 200000; // ₹2 Lakhs

        // Subtotal
        const subtotal = basePrice + floorRiseAmount + plcCharges + otherCharges;

        // GST (5%)
        const gst = subtotal * 0.05;

        // Registration charges (typically 5-7% of property value, using 6%)
        const registration = subtotal * 0.06;

        // Total price
        const totalPrice = subtotal + gst + registration;

        // Build breakdown
        const breakdown: { label: string; amount: number }[] = [];

        breakdown.push({
            label: `Base Price (${unit.carpetArea} sq.ft @ ₹${Math.round(basePrice / unit.carpetArea)}/sq.ft)`,
            amount: basePrice,
        });

        if (floorRiseAmount > 0) {
            breakdown.push({
                label: `Floor Rise (${floorRise}% of base price)`,
                amount: floorRiseAmount,
            });
        }

        if (plcOptions.corner) {
            breakdown.push({
                label: 'PLC - Corner Unit',
                amount: 300000,
            });
        }

        if (plcOptions.parkFacing) {
            breakdown.push({
                label: 'PLC - Park Facing',
                amount: 500000,
            });
        }

        if (plcOptions.roadFacing) {
            breakdown.push({
                label: 'PLC - Road Facing',
                amount: 200000,
            });
        }

        if (otherCharges > 0) {
            breakdown.push({
                label: 'Other Charges (Parking, Club, etc.)',
                amount: otherCharges,
            });
        }

        const calculation: PriceCalculation = {
            basePrice,
            floorRise: floorRiseAmount,
            plcCharges,
            otherCharges,
            subtotal,
            gst,
            registration,
            totalPrice,
            breakdown,
        };

        return NextResponse.json({
            success: true,
            data: calculation,
        });
    } catch (error) {
        console.error('Error calculating price:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to calculate price' },
            { status: 500 }
        );
    }
}
