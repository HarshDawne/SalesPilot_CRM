'use client';

import React from 'react';
import { DollarSign, TrendingUp, Home, Layers, Info } from 'lucide-react';
import Button from '../ui/Button';
import { MockPricingTemplate } from '@/app/properties/mock-data';

interface PricingSummaryProps {
    pricingTemplate: MockPricingTemplate;
    unitDetails?: {
        carpetArea: number;
        floor: number;
        type: string;
        totalPrice?: number;
    };
    onViewFullPricing?: () => void;
}

export default function PricingSummary({ pricingTemplate, unitDetails, onViewFullPricing }: PricingSummaryProps) {
    const formatPrice = (price: number) => `₹${(price / 10000000).toFixed(2)} Cr`;
    const formatPriceK = (price: number) => `₹${(price / 100000).toFixed(2)} L`;

    const calculateUnitPrice = () => {
        if (!unitDetails) return null;

        const basePrice = unitDetails.carpetArea * pricingTemplate.basePricePerSqft;
        const floorRise = basePrice * (pricingTemplate.floorRisePercentage / 100) * unitDetails.floor;
        const plc = pricingTemplate.plcCharges.parkFacing; // Default to park facing
        const total = basePrice + floorRise + plc + pricingTemplate.otherCharges;

        return { basePrice, floorRise, plc, total };
    };

    const prices = calculateUnitPrice();

    return (
        <div className="space-y-6">
            {/* Pricing Template Overview */}
            <div>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 uppercase tracking-wide font-inter">
                    <DollarSign className="h-4 w-4" />
                    Pricing Template
                </h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <span className="text-sm text-gray-600 font-inter">Base Price/sqft</span>
                        <span className="text-sm font-semibold text-gray-900 font-inter">
                            ₹{pricingTemplate.basePricePerSqft.toLocaleString('en-IN')}
                        </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <span className="text-sm text-gray-600 font-inter">Floor Rise</span>
                        <span className="text-sm font-semibold text-gray-900 font-inter">
                            {pricingTemplate.floorRisePercentage}% per floor
                        </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <span className="text-sm text-gray-600 font-inter">Other Charges</span>
                        <span className="text-sm font-semibold text-gray-900 font-inter">
                            {formatPriceK(pricingTemplate.otherCharges)}
                        </span>
                    </div>
                </div>
            </div>

            {/* PLC Charges */}
            <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 uppercase tracking-wide font-inter">
                    <Layers className="h-4 w-4" />
                    PLC Charges
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    {Object.entries(pricingTemplate.plcCharges).map(([key, value]) => (
                        <div
                            key={key}
                            className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center"
                        >
                            <p className="text-xs text-gray-600 font-inter capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                            <p className="mt-1 text-sm font-semibold text-gray-900 font-inter">
                                {formatPriceK(value)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Unit Price Calculation (if unit details provided) */}
            {prices && unitDetails && (
                <div className="rounded-xl border-2 border-primary-200 bg-primary-50 p-4">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary-900 uppercase tracking-wide font-inter">
                        <Home className="h-4 w-4" />
                        Price Breakdown - {unitDetails.type}
                    </h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-primary-700 font-inter">
                                Base ({unitDetails.carpetArea} sqft × ₹{pricingTemplate.basePricePerSqft.toLocaleString('en-IN')})
                            </span>
                            <span className="font-medium text-primary-900 font-inter">
                                {formatPrice(prices.basePrice)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-primary-700 font-inter">Floor Rise (Floor {unitDetails.floor})</span>
                            <span className="font-medium text-primary-900 font-inter">
                                {formatPriceK(prices.floorRise)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-primary-700 font-inter">PLC Charges</span>
                            <span className="font-medium text-primary-900 font-inter">
                                {formatPriceK(prices.plc)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-primary-700 font-inter">Other Charges</span>
                            <span className="font-medium text-primary-900 font-inter">
                                {formatPriceK(pricingTemplate.otherCharges)}
                            </span>
                        </div>
                        <div className="mt-3 flex justify-between border-t border-primary-200 pt-2">
                            <span className="font-semibold text-primary-900 font-inter">Total Price</span>
                            <span className="text-lg font-bold text-primary-600 font-outfit">
                                {formatPrice(unitDetails.totalPrice || prices.total)}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {onViewFullPricing && (
                <Button onClick={onViewFullPricing} className="w-full">
                    <Info className="h-4 w-4" />
                    View Full Pricing Details
                </Button>
            )}

            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                <p className="text-xs text-blue-800 font-inter">
                    <strong>Note:</strong> Prices are subject to change. Final pricing will be confirmed during booking.
                    GST and registration charges are additional.
                </p>
            </div>
        </div>
    );
}
