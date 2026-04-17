'use client';

import { useState, useEffect } from 'react';
import { Unit, PriceCalculation } from '@/types/property';
import { Calculator, TrendingUp, Home, DollarSign } from 'lucide-react';
import PriceBreakdown from './PriceBreakdown';

interface PricingCalculatorProps {
    units: Unit[];
    propertyId: string;
}

export default function PricingCalculator({ units, propertyId }: PricingCalculatorProps) {
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
    const [floorRise, setFloorRise] = useState(0);
    const [plcOptions, setPlcOptions] = useState({
        corner: false,
        parkFacing: false,
        roadFacing: false,
    });
    const [otherCharges, setOtherCharges] = useState(0);
    const [calculation, setCalculation] = useState<PriceCalculation | null>(null);
    const [loading, setLoading] = useState(false);

    // Available units only
    const availableUnits = units.filter(u => u.status === 'AVAILABLE');

    useEffect(() => {
        if (selectedUnit) {
            calculatePrice();
        }
    }, [selectedUnit, floorRise, plcOptions, otherCharges]);

    const calculatePrice = async () => {
        if (!selectedUnit) return;

        setLoading(true);
        try {
            const response = await fetch('/api/pricing/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    unitId: selectedUnit.id,
                    floorRise,
                    plcOptions,
                    otherCharges,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setCalculation(data.data);
            }
        } catch (error) {
            console.error('Error calculating price:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnitChange = (unitId: string) => {
        const unit = availableUnits.find(u => u.id === unitId);
        setSelectedUnit(unit || null);
        // Reset customizations when unit changes
        setFloorRise(unit?.floorRise || 0);
        setPlcOptions({ corner: false, parkFacing: false, roadFacing: false });
        setOtherCharges(0);
    };

    const formatPrice = (price: number) => {
        if (price >= 10000000) {
            return `₹${(price / 10000000).toFixed(2)} Cr`;
        } else if (price >= 100000) {
            return `₹${(price / 100000).toFixed(2)} L`;
        }
        return `₹${price.toLocaleString()}`;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calculator Input */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Calculator className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Pricing Calculator</h2>
                        <p className="text-sm text-gray-600">Calculate unit price with customizations</p>
                    </div>
                </div>

                {/* Unit Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Unit
                    </label>
                    <select
                        value={selectedUnit?.id || ''}
                        onChange={(e) => handleUnitChange(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Choose a unit...</option>
                        {availableUnits.map((unit) => (
                            <option key={unit.id} value={unit.id}>
                                {unit.unitNumber} - {unit.type.replace('_', ' ')} - {unit.carpetArea} sq.ft
                            </option>
                        ))}
                    </select>
                </div>

                {selectedUnit && (
                    <>
                        {/* Unit Details */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Unit Details</h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-gray-600">Unit Number:</span>
                                    <div className="font-medium text-gray-900">{selectedUnit.unitNumber}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Type:</span>
                                    <div className="font-medium text-gray-900">{selectedUnit.type.replace('_', ' ')}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Carpet Area:</span>
                                    <div className="font-medium text-gray-900">{selectedUnit.carpetArea} sq.ft</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Floor:</span>
                                    <div className="font-medium text-gray-900">{selectedUnit.floor}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Base Price:</span>
                                    <div className="font-medium text-gray-900">{formatPrice(selectedUnit.basePrice)}</div>
                                </div>
                                {selectedUnit.facing && (
                                    <div>
                                        <span className="text-gray-600">Facing:</span>
                                        <div className="font-medium text-gray-900">{selectedUnit.facing}</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Floor Rise */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Floor Rise (%)
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="0"
                                    max="20"
                                    step="0.5"
                                    value={floorRise}
                                    onChange={(e) => setFloorRise(parseFloat(e.target.value))}
                                    className="flex-1"
                                />
                                <input
                                    type="number"
                                    min="0"
                                    max="20"
                                    step="0.5"
                                    value={floorRise}
                                    onChange={(e) => setFloorRise(parseFloat(e.target.value) || 0)}
                                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center"
                                />
                                <span className="text-sm text-gray-600">%</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Additional charge based on floor level
                            </p>
                        </div>

                        {/* PLC Options */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Preferred Location Charges (PLC)
                            </label>
                            <div className="space-y-2">
                                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        checked={plcOptions.corner}
                                        onChange={(e) => setPlcOptions({ ...plcOptions, corner: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900">Corner Unit</div>
                                        <div className="text-xs text-gray-500">Additional ₹2-5 Lakhs</div>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        checked={plcOptions.parkFacing}
                                        onChange={(e) => setPlcOptions({ ...plcOptions, parkFacing: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900">Park Facing</div>
                                        <div className="text-xs text-gray-500">Additional ₹3-7 Lakhs</div>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        checked={plcOptions.roadFacing}
                                        onChange={(e) => setPlcOptions({ ...plcOptions, roadFacing: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900">Road Facing</div>
                                        <div className="text-xs text-gray-500">Additional ₹1-3 Lakhs</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Other Charges */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Other Charges (₹)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="10000"
                                value={otherCharges}
                                onChange={(e) => setOtherCharges(parseFloat(e.target.value) || 0)}
                                placeholder="Enter additional charges"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Parking, club membership, etc.
                            </p>
                        </div>
                    </>
                )}

                {!selectedUnit && (
                    <div className="text-center py-12 text-gray-500">
                        <Home className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p>Select a unit to calculate price</p>
                    </div>
                )}
            </div>

            {/* Price Breakdown */}
            <div>
                {loading && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6 flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                            <p className="text-gray-600">Calculating...</p>
                        </div>
                    </div>
                )}

                {!loading && calculation && selectedUnit && (
                    <PriceBreakdown calculation={calculation} unit={selectedUnit} />
                )}

                {!loading && !calculation && selectedUnit && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
                        <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p>Price breakdown will appear here</p>
                    </div>
                )}

                {!selectedUnit && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
                        <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p>Price breakdown will appear here</p>
                    </div>
                )}
            </div>
        </div>
    );
}
