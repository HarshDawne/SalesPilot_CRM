'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Plus, Download, Edit2, Archive, Eye } from 'lucide-react';
import { mockTowers, type MockTower } from '../../mock-data';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

export default function TowersPage({ params }: { params: Promise<{ projectId: string }> }) {
    const resolvedParams = React.use(params);
    const towers = mockTowers.filter((t) => t.projectId === resolvedParams.projectId);

    const getStatusColor = (status: MockTower['status']) => {
        switch (status) {
            case 'Ready':
                return 'green';
            case 'Finishing':
                return 'blue';
            case 'Structure':
                return 'orange';
            case 'Foundation':
                return 'purple';
            default:
                return 'gray';
        }
    };

    // TODO: Replace with API call to /api/projects/{id}/towers
    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            {/* Header */}
            <div className="mb-6">
                <Link href={`/properties/${resolvedParams.projectId}`}>
                    <button className="mb-4 flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-gray-900">
                        <ChevronLeft className="h-4 w-4" />
                        Back to Project
                    </button>
                </Link>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl font-outfit">Towers / Phases</h1>
                        <p className="mt-1 text-sm text-gray-600 font-inter">
                            Manage towers and construction phases
                        </p>
                    </div>
                    <Button>
                        <Plus className="h-5 w-5" />
                        Add Tower
                    </Button>
                </div>
            </div>

            {/* Towers Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 font-inter">
                                    Tower Name
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 font-inter">
                                    Floors
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 font-inter">
                                    Total Units
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 font-inter">
                                    Available
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 font-inter">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 font-inter">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {towers.map((tower) => (
                                <tr key={tower.id} className="transition-colors hover:bg-gray-50">
                                    <td className="px-4 py-4">
                                        <div className="font-medium text-gray-900 font-inter">{tower.name}</div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-sm text-gray-600 font-inter">{tower.floors}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-sm text-gray-600 font-inter">{tower.totalUnits}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-sm font-medium text-green-600 font-inter">
                                            {tower.availableUnits}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <Badge variant={getStatusColor(tower.status)}>{tower.status}</Badge>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/properties/${resolvedParams.projectId}/towers/${tower.id}/units`}>
                                                <Button size="sm" variant="secondary">
                                                    <Eye className="h-4 w-4" />
                                                    View Units
                                                </Button>
                                            </Link>
                                            <button
                                                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                                                title="More actions"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Empty State */}
                {towers.length === 0 && (
                    <div className="py-12 text-center">
                        <p className="text-gray-600 font-inter">No towers found for this project</p>
                        <Button className="mt-4">
                            <Plus className="h-5 w-5" />
                            Add First Tower
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
}

// TODO: Backend Integration
// - GET /api/projects/{projectId}/towers
// - POST /api/towers (create tower)
// - PUT /api/towers/{id} (edit tower)
// - DELETE /api/towers/{id} (archive tower)
// - GET /api/towers/{id}/export (export units CSV)
