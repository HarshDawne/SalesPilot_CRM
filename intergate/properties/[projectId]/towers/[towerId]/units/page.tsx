'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, Home, MapPin, Eye, Lock } from 'lucide-react';
import { mockUnits, type MockUnit } from '../../../../mock-data';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';

export default function UnitsPage({ params }: { params: Promise<{ projectId: string; towerId: string }> }) {
    const resolvedParams = React.use(params);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [typeFilter, setTypeFilter] = useState<string>('All');
    const [selectedUnit, setSelectedUnit] = useState<MockUnit | null>(null);

    // Get units for this tower
    const allUnits = mockUnits.filter((u: MockUnit) => u.towerId === resolvedParams.towerId);

    // Apply filters
    const filteredUnits = useMemo(() => {
        let filtered = allUnits;

        if (statusFilter !== 'All') {
            filtered = filtered.filter((u: MockUnit) => u.status === statusFilter);
        }

        if (typeFilter !== 'All') {
            filtered = filtered.filter((u: MockUnit) => u.type === typeFilter);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter((u: MockUnit) => u.unitNumber.toLowerCase().includes(query));
        }

        return filtered;
    }, [allUnits, statusFilter, typeFilter, searchQuery]);

    const getStatusColor = (status: MockUnit['status']) => {
        switch (status) {
            case 'Available':
                return 'green';
            case 'Reserved':
                return 'orange';
            case 'Booked':
                return 'purple';
            case 'Blocked':
                return 'red';
            default:
                return 'gray';
        }
    };

    const formatPrice = (price: number) => {
        return `₹${(price / 10000000).toFixed(2)} Cr`;
    };

    const statuses = ['All', 'Available', 'Reserved', 'Booked', 'Blocked'];
    const types = ['All', '1BHK', '2BHK', '3BHK', '4BHK', 'Shop', 'Office'];

    // TODO: Replace with API call to /api/towers/{id}/units
    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            {/* Header */}
            <div className="mb-6">
                <Link href={`/properties/${resolvedParams.projectId}/towers`}>
                    <button className="mb-4 flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-gray-900">
                        <ChevronLeft className="h-4 w-4" />
                        Back to Towers
                    </button>
                </Link>

                <div>
                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl font-outfit">Unit Inventory</h1>
                    <p className="mt-1 text-sm text-gray-600 font-inter">Browse and manage available units</p>
                </div>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                        <Input
                            placeholder="Search by unit number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-inter transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                        >
                            {statuses.map((status) => (
                                <option key={status} value={status}>
                                    {status === 'All' ? 'All Statuses' : status}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-inter transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                        >
                            {types.map((type) => (
                                <option key={type} value={type}>
                                    {type === 'All' ? 'All Types' : type}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </Card>

            {/* Units Grid */}
            {filteredUnits.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredUnits.map((unit: MockUnit) => (
                        <Card
                            key={unit.id}
                            hover
                            className="cursor-pointer"
                            onClick={() => setSelectedUnit(unit)}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 font-outfit">
                                        {unit.unitNumber}
                                    </h3>
                                    <p className="text-sm text-gray-600 font-inter">Floor {unit.floor}</p>
                                </div>
                                <Badge variant={getStatusColor(unit.status)}>{unit.status}</Badge>
                            </div>

                            <div className="mt-4 space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 font-inter">Type:</span>
                                    <span className="font-medium text-gray-900 font-inter">{unit.type}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 font-inter">Carpet Area:</span>
                                    <span className="font-medium text-gray-900 font-inter">{unit.carpetArea} sqft</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 font-inter">Price:</span>
                                    <span className="font-semibold text-primary-600 font-inter">
                                        {formatPrice(unit.totalPrice)}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-600">
                                <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {unit.facing}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    {unit.view}
                                </span>
                                {unit.status === 'Reserved' && (
                                    <span className="flex items-center gap-1 text-orange-600">
                                        <Lock className="h-3 w-3" />
                                        Reserved
                                    </span>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <div className="py-12 text-center">
                        <Home className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900 font-outfit">No units found</h3>
                        <p className="mt-2 text-sm text-gray-600 font-inter">
                            Try adjusting your filters or search criteria
                        </p>
                    </div>
                </Card>
            )}

            {/* Unit Details Modal */}
            {selectedUnit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedUnit(null)} />
                    <Card className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-semibold text-gray-900 font-outfit">
                            Unit Details: {selectedUnit.unitNumber}
                        </h2>
                        <p className="mt-2 text-sm text-gray-600 font-inter">
                            Full unit details with Reserve/Book/Block actions coming soon
                        </p>
                        <Button className="mt-4" onClick={() => setSelectedUnit(null)}>
                            Close
                        </Button>
                    </Card>
                </div>
            )}
        </div>
    );
}

// TODO: Backend Integration
// - GET /api/towers/{towerId}/units
// - POST /api/units (create unit)
// - PUT /api/units/{id} (update unit)
// - POST /api/units/{id}/reserve (reserve - uses file-lock queue)
// - POST /api/units/{id}/book (book - uses file-lock queue)
// - POST /api/units/{id}/release (release reservation)
// - POST /api/units/{id}/block (block - admin only)
