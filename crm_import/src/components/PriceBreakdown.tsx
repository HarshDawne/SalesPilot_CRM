'use client';

import { Unit, PriceCalculation } from '@/types/property';
import { Download, TrendingUp, FileText } from 'lucide-react';

interface PriceBreakdownProps {
    calculation: PriceCalculation;
    unit: Unit;
}

export default function PriceBreakdown({ calculation, unit }: PriceBreakdownProps) {
    const formatPrice = (price: number) => {
        return `₹${price.toLocaleString()}`;
    };

    const formatPriceCr = (price: number) => {
        if (price >= 10000000) {
            return `₹${(price / 10000000).toFixed(2)} Cr`;
        } else if (price >= 100000) {
            return `₹${(price / 100000).toFixed(2)} L`;
        }
        return `₹${price.toLocaleString()}`;
    };

    const handleExportPDF = () => {
        // TODO: Implement PDF export
        alert('PDF export coming soon!');
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold">Price Breakdown</h2>
                        <p className="text-blue-100 text-sm mt-1">Unit {unit.unitNumber}</p>
                    </div>
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        <span className="text-sm">Export PDF</span>
                    </button>
                </div>
                <div className="text-4xl font-bold">{formatPriceCr(calculation.totalPrice)}</div>
                <div className="text-blue-100 text-sm mt-1">
                    {formatPrice(Math.round(calculation.totalPrice / unit.carpetArea))}/sq.ft
                </div>
            </div>

            {/* Breakdown Details */}
            <div className="p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Detailed Breakdown
                </h3>

                <div className="space-y-3">
                    {calculation.breakdown.map((item, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                        >
                            <span className="text-sm text-gray-700">{item.label}</span>
                            <span className="text-sm font-medium text-gray-900">{formatPrice(item.amount)}</span>
                        </div>
                    ))}
                </div>

                {/* Summary Section */}
                <div className="mt-6 pt-6 border-t-2 border-gray-200 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Base Price</span>
                        <span className="font-medium text-gray-900">{formatPrice(calculation.basePrice)}</span>
                    </div>

                    {calculation.floorRise > 0 && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Floor Rise</span>
                            <span className="font-medium text-gray-900">+{formatPrice(calculation.floorRise)}</span>
                        </div>
                    )}

                    {calculation.plcCharges > 0 && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">PLC Charges</span>
                            <span className="font-medium text-gray-900">+{formatPrice(calculation.plcCharges)}</span>
                        </div>
                    )}

                    {calculation.otherCharges > 0 && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Other Charges</span>
                            <span className="font-medium text-gray-900">+{formatPrice(calculation.otherCharges)}</span>
                        </div>
                    )}

                    <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200">
                        <span className="text-gray-700 font-medium">Subtotal</span>
                        <span className="font-semibold text-gray-900">{formatPrice(calculation.subtotal)}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">GST (5%)</span>
                        <span className="font-medium text-gray-900">+{formatPrice(calculation.gst)}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Registration Charges</span>
                        <span className="font-medium text-gray-900">+{formatPrice(calculation.registration)}</span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t-2 border-gray-300">
                        <span className="text-lg font-bold text-gray-900">Total Price</span>
                        <span className="text-lg font-bold text-blue-600">{formatPrice(calculation.totalPrice)}</span>
                    </div>
                </div>

                {/* Visual Breakdown */}
                <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Price Composition</h4>
                    <div className="space-y-2">
                        {[
                            { label: 'Base Price', value: calculation.basePrice, color: 'bg-blue-500' },
                            { label: 'Floor Rise', value: calculation.floorRise, color: 'bg-green-500' },
                            { label: 'PLC', value: calculation.plcCharges, color: 'bg-yellow-500' },
                            { label: 'Other', value: calculation.otherCharges, color: 'bg-purple-500' },
                            { label: 'GST', value: calculation.gst, color: 'bg-orange-500' },
                            { label: 'Registration', value: calculation.registration, color: 'bg-pink-500' },
                        ].filter(item => item.value > 0).map((item) => {
                            const percentage = (item.value / calculation.totalPrice) * 100;
                            return (
                                <div key={item.label}>
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="text-gray-600">{item.label}</span>
                                        <span className="font-medium text-gray-900">{percentage.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`${item.color} h-2 rounded-full transition-all`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Additional Info */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div className="text-xs text-blue-900">
                            <p className="font-medium mb-1">Price Insights</p>
                            <ul className="space-y-1 text-blue-800">
                                <li>• Price per sq.ft: {formatPrice(Math.round(calculation.totalPrice / unit.carpetArea))}</li>
                                <li>• Carpet Area: {unit.carpetArea} sq.ft</li>
                                <li>• Built-up Area: {unit.builtUpArea} sq.ft</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
