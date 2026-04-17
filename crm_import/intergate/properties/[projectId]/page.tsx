'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Building2, Activity, ChevronLeft, ChevronDown, ChevronUp, Home, Key, MapPin, Eye, Lock, Check, Info, DollarSign, Box } from 'lucide-react';
import { mockProjects, mockTowers, mockUnits, mockActivityLog, type MockUnit, type MockTower, type MockActivity } from '../mock-data';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import toast, { Toaster } from 'react-hot-toast';

export default function ProjectDetailsPage({ params }: { params: Promise<{ projectId: string }> }) {
    const resolvedParams = React.use(params);
    const [activeTab, setActiveTab] = useState('overview');
    const [expandedTower, setExpandedTower] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [typeFilter, setTypeFilter] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUnit, setSelectedUnit] = useState<MockUnit | null>(null);
    const [activityLog, setActivityLog] = useState<MockActivity[]>(mockActivityLog);
    const [units, setUnits] = useState<MockUnit[]>(mockUnits);

    const project = mockProjects.find((p) => p.id === resolvedParams.projectId);
    const towers = mockTowers.filter((t) => t.projectId === resolvedParams.projectId);

    if (!project) {
        return <div className="p-8">Project not found</div>;
    }

    // Calculate metrics from current units state
    const totalUnits = units.filter((u) => u.projectId === resolvedParams.projectId).length;
    const availableUnits = units.filter((u) => u.projectId === resolvedParams.projectId && u.status === 'Available').length;
    const bookedUnits = units.filter((u) => u.projectId === resolvedParams.projectId && u.status === 'Booked').length;
    const reservedUnits = units.filter((u) => u.projectId === resolvedParams.projectId && u.status === 'Reserved').length;

    // Filter units based on criteria
    const getFilteredUnits = (towerId: string) => {
        let filtered = units.filter((u) => u.towerId === towerId);

        if (statusFilter !== 'All') {
            filtered = filtered.filter((u) => u.status === statusFilter);
        }

        if (typeFilter !== 'All') {
            filtered = filtered.filter((u) => u.type === typeFilter);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter((u) => u.unitNumber.toLowerCase().includes(query));
        }

        return filtered;
    };

    // Reserve unit action
    const handleReserve = (unit: MockUnit) => {
        if (unit.status !== 'Available') {
            toast.error('Unit is not available for reservation');
            return;
        }

        const reservedUntil = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

        setUnits((prev) =>
            prev.map((u) =>
                u.id === unit.id
                    ? { ...u, status: 'Reserved' as const, reservedUntil, reservedBy: 'Current User' }
                    : u
            )
        );

        // Add activity log
        const newActivity: MockActivity = {
            id: `activity-${Date.now()}`,
            projectId: resolvedParams.projectId,
            unitId: unit.id,
            type: 'reserve',
            description: `Unit ${unit.unitNumber} reserved (${project.name} — ${towers.find((t) => t.id === unit.towerId)?.name})`,
            timestamp: new Date().toISOString(),
            user: 'Current User',
        };
        setActivityLog((prev) => [newActivity, ...prev]);

        toast.success(`Unit ${unit.unitNumber} reserved for 48 hours`, {
            icon: '🔒',
            duration: 3000,
        });

        // TODO: Replace with POST /api/units/${unit.id}/reserve
    };

    // Book unit action
    const handleBook = (unit: MockUnit) => {
        if (unit.status === 'Booked') {
            toast.error('Unit is already booked');
            return;
        }

        setUnits((prev) =>
            prev.map((u) =>
                u.id === unit.id
                    ? { ...u, status: 'Booked' as const, reservedUntil: undefined, reservedBy: undefined }
                    : u
            )
        );

        // Add activity log
        const newActivity: MockActivity = {
            id: `activity-${Date.now()}`,
            projectId: resolvedParams.projectId,
            unitId: unit.id,
            type: 'book',
            description: `Unit ${unit.unitNumber} booked (${project.name} — ${towers.find((t) => t.id === unit.towerId)?.name})`,
            timestamp: new Date().toISOString(),
            user: 'Current User',
        };
        setActivityLog((prev) => [newActivity, ...prev]);

        toast.success(`Unit ${unit.unitNumber} successfully booked!`, {
            icon: '✓',
            duration: 3000,
        });

        // TODO: Replace with POST /api/units/${unit.id}/book
    };

    // Release reservation
    const handleRelease = (unit: MockUnit) => {
        setUnits((prev) =>
            prev.map((u) =>
                u.id === unit.id
                    ? { ...u, status: 'Available' as const, reservedUntil: undefined, reservedBy: undefined }
                    : u
            )
        );

        toast.success(`Unit ${unit.unitNumber} reservation released`);

        // TODO: Replace with POST /api/units/${unit.id}/release
    };

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

    const getTowerStatusColor = (status: MockTower['status']) => {
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

    const formatPrice = (price: number) => `₹${(price / 10000000).toFixed(2)} Cr`;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Building2 },
        { id: 'towers', label: 'Towers & Units', icon: Building2 },
        { id: 'activity', label: 'Activity Log', icon: Activity },
    ];

    const statuses = ['All', 'Available', 'Reserved', 'Booked', 'Blocked'];
    const types = ['All', '1BHK', '2BHK', '3BHK', '4BHK', 'Shop', 'Office'];

    return (
        <>
            <Toaster position="top-right" />
            <div className="flex min-h-screen bg-gray-50">
                {/* Left Sidebar */}
                <div className="w-64 border-r border-gray-200 bg-white">
                    <div className="p-6">
                        <Link href="/properties">
                            <button className="flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-gray-900">
                                <ChevronLeft className="h-4 w-4" />
                                Back to Projects
                            </button>
                        </Link>

                        <div className="mt-6">
                            <h2 className="text-lg font-semibold text-gray-900 font-outfit">{project.name}</h2>
                            <p className="mt-1 text-sm text-gray-600 font-inter">
                                {project.location.area}, {project.location.city}
                            </p>
                            <Badge
                                variant={
                                    project.status === 'Active' ? 'green' : project.status === 'Under Construction' ? 'orange' : 'blue'
                                }
                                className="mt-3"
                            >
                                {project.status}
                            </Badge>
                        </div>
                    </div>

                    <nav className="mt-6 space-y-1 px-3">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <Icon className="h-5 w-5" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    {activeTab === 'overview' && (
                        <div>
                            <div className={`h-64 bg-gradient-to-br ${project.imageGradient}`}></div>

                            <div className="px-8 py-8">
                                {/* Metric Cards */}
                                <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                    <Card>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-600 font-inter">Total Towers</p>
                                                <p className="mt-1 text-3xl font-bold text-gray-900 font-outfit">{towers.length}</p>
                                            </div>
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
                                                <Building2 className="h-6 w-6 text-primary-600" />
                                            </div>
                                        </div>
                                    </Card>

                                    <Card>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-600 font-inter">Total Units</p>
                                                <p className="mt-1 text-3xl font-bold text-gray-900 font-outfit">{totalUnits}</p>
                                            </div>
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                                                <Box className="h-6 w-6 text-purple-600" />
                                            </div>
                                        </div>
                                    </Card>

                                    <Card>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-600 font-inter">Available</p>
                                                <p className="mt-1 text-3xl font-bold text-gray-900 font-outfit">{availableUnits}</p>
                                            </div>
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                                                <Activity className="h-6 w-6 text-green-600" />
                                            </div>
                                        </div>
                                    </Card>

                                    <Card>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-600 font-inter">Booked</p>
                                                <p className="mt-1 text-3xl font-bold text-gray-900 font-outfit">{bookedUnits}</p>
                                            </div>
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                                                <DollarSign className="h-6 w-6 text-orange-600" />
                                            </div>
                                        </div>
                                    </Card>
                                </div>

                                {/* Project Details Grid */}
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                    <Card>
                                        <h3 className="mb-4 text-lg font-semibold text-gray-900 font-outfit">Highlights</h3>
                                        <ul className="space-y-2">
                                            {project.highlights.map((highlight, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 font-inter">
                                                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-600"></span>
                                                    {highlight}
                                                </li>
                                            ))}
                                        </ul>
                                    </Card>

                                    <Card>
                                        <h3 className="mb-4 text-lg font-semibold text-gray-900 font-outfit">Amenities</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {project.amenities.map((amenity, idx) => (
                                                <Badge key={idx} variant="blue">
                                                    {amenity}
                                                </Badge>
                                            ))}
                                        </div>
                                    </Card>

                                    <Card>
                                        <h3 className="mb-4 text-lg font-semibold text-gray-900 font-outfit">Project Information</h3>
                                        <dl className="space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <dt className="text-gray-600 font-inter">Developer:</dt>
                                                <dd className="font-medium text-gray-900 font-inter">{project.developer}</dd>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <dt className="text-gray-600 font-inter">Type:</dt>
                                                <dd className="font-medium text-gray-900 font-inter">{project.type}</dd>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <dt className="text-gray-600 font-inter">RERA Number:</dt>
                                                <dd className="font-medium text-gray-900 font-inter">{project.reraNumber}</dd>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <dt className="text-gray-600 font-inter">Launch Date:</dt>
                                                <dd className="font-medium text-gray-900 font-inter">
                                                    {new Date(project.launchDate).toLocaleDateString()}
                                                </dd>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <dt className="text-gray-600 font-inter">Possession:</dt>
                                                <dd className="font-medium text-gray-900 font-inter">
                                                    {new Date(project.possessionDate).toLocaleDateString()}
                                                </dd>
                                            </div>
                                        </dl>
                                    </Card>

                                    <Card>
                                        <h3 className="mb-4 text-lg font-semibold text-gray-900 font-outfit">Location</h3>
                                        <address className="space-y-2 text-sm not-italic text-gray-700 font-inter">
                                            <p>{project.location.address}</p>
                                            <p>
                                                {project.location.area}, {project.location.city}
                                            </p>
                                            <p className="text-gray-600">Landmark: {project.location.landmark}</p>
                                        </address>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'towers' && (
                        <div className="px-4 py-6 sm:px-8 sm:py-8">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 font-outfit">Towers & Units</h2>
                                <p className="mt-1 text-sm text-gray-600 font-inter">
                                    Click a tower to show units. Tap Reserve to lock a unit for a prospect.
                                </p>
                            </div>

                            {/* Filters */}
                            <Card className="mb-6">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Search units..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-inter transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
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
                                                    {status === 'All' ? 'All Status' : status}
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

                            {/* Tower Cards */}
                            <div className="space-y-4">
                                {towers.map((tower) => {
                                    const isExpanded = expandedTower === tower.id;
                                    const towerUnits = getFilteredUnits(tower.id);
                                    const towerAvailable = units.filter((u) => u.towerId === tower.id && u.status === 'Available').length;

                                    return (
                                        <Card key={tower.id} className="overflow-hidden">
                                            {/* Tower Header */}
                                            <button
                                                onClick={() => setExpandedTower(isExpanded ? null : tower.id)}
                                                className="flex w-full items-center justify-between text-left transition-colors hover:bg-gray-50 p-6"
                                                aria-expanded={isExpanded}
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
                                                            <Building2 className="h-6 w-6 text-primary-600" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-semibold text-gray-900 font-outfit">{tower.name}</h3>
                                                            <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-600 font-inter">
                                                                <span className="flex items-center gap-1">
                                                                    <Home className="h-4 w-4" />
                                                                    {tower.floors} floors
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Key className="h-4 w-4" />
                                                                    {tower.totalUnits} units
                                                                </span>
                                                                <span className="flex items-center gap-1 text-green-600">
                                                                    <Check className="h-4 w-4" />
                                                                    {towerAvailable} available
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <Badge variant={getTowerStatusColor(tower.status)}>{tower.status}</Badge>
                                                    {isExpanded ? (
                                                        <ChevronUp className="h-5 w-5 text-gray-400" />
                                                    ) : (
                                                        <ChevronDown className="h-5 w-5 text-gray-400" />
                                                    )}
                                                </div>
                                            </button>

                                            {/* Expanded Units Grid */}
                                            {isExpanded && (
                                                <div className="border-t border-gray-200 bg-gray-50 p-6 animate-in slide-in-from-top duration-300">
                                                    {towerUnits.length > 0 ? (
                                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                                            {towerUnits.map((unit) => (
                                                                <Card key={unit.id} hover className="relative">
                                                                    {/* Status Overlay */}
                                                                    {(unit.status === 'Reserved' || unit.status === 'Booked') && (
                                                                        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/10 backdrop-blur-[2px]">
                                                                            {unit.status === 'Reserved' ? (
                                                                                <div className="rounded-full bg-orange-100 px-4 py-2 shadow-lg">
                                                                                    <Lock className="inline h-5 w-5 text-orange-600" />
                                                                                    <span className="ml-2 font-medium text-orange-900">Reserved</span>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="rounded-full bg-purple-100 px-4 py-2 shadow-lg">
                                                                                    <Check className="inline h-5 w-5 text-purple-600" />
                                                                                    <span className="ml-2 font-medium text-purple-900">Booked</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    <div className="flex items-start justify-between">
                                                                        <div>
                                                                            <h4 className="text-lg font-semibold text-gray-900 font-outfit">
                                                                                {unit.unitNumber}
                                                                            </h4>
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
                                                                    </div>

                                                                    {/* Actions */}
                                                                    <div className="mt-4 flex gap-2">
                                                                        {unit.status === 'Available' && (
                                                                            <>
                                                                                <Button
                                                                                    size="sm"
                                                                                    onClick={() => handleReserve(unit)}
                                                                                    className="flex-1"
                                                                                >
                                                                                    <Lock className="h-4 w-4" />
                                                                                    Reserve
                                                                                </Button>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="secondary"
                                                                                    onClick={() => handleBook(unit)}
                                                                                    className="flex-1"
                                                                                >
                                                                                    <Check className="h-4 w-4" />
                                                                                    Book
                                                                                </Button>
                                                                            </>
                                                                        )}
                                                                        {unit.status === 'Reserved' && (
                                                                            <Button size="sm" variant="ghost" onClick={() => handleRelease(unit)} className="flex-1">
                                                                                Release
                                                                            </Button>
                                                                        )}
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => setSelectedUnit(unit)}
                                                                        >
                                                                            <Info className="h-4 w-4" />
                                                                            Details
                                                                        </Button>
                                                                    </div>

                                                                    {unit.reservedUntil && (
                                                                        <p className="mt-2 text-xs text-orange-600 font-inter">
                                                                            Reserved until {new Date(unit.reservedUntil).toLocaleString()}
                                                                        </p>
                                                                    )}
                                                                </Card>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="py-8 text-center">
                                                            <Home className="mx-auto h-12 w-12 text-gray-400" />
                                                            <p className="mt-2 text-sm text-gray-600 font-inter">No units match your filters</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {activeTab === 'activity' && (
                        <div className="px-8 py-8">
                            <h2 className="mb-6 text-2xl font-bold text-gray-900 font-outfit">Activity Log</h2>
                            <Card>
                                <div className="space-y-4">
                                    {activityLog
                                        .filter((a) => a.projectId === resolvedParams.projectId)
                                        .map((activity) => (
                                            <div key={activity.id} className="flex gap-4 border-b border-gray-100 pb-4 last:border-0">
                                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100">
                                                    <Activity className="h-5 w-5 text-primary-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900 font-inter">{activity.description}</p>
                                                    <p className="mt-1 text-xs text-gray-600 font-inter">
                                                        {new Date(activity.timestamp).toLocaleString()} • {activity.user}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>

            {/* Unit Details Modal */}
            {selectedUnit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedUnit(null)} />
                    <Card className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-900 font-outfit">
                                    Unit {selectedUnit.unitNumber}
                                </h2>
                                <p className="mt-1 text-sm text-gray-600 font-inter">
                                    {project.name} — {towers.find((t) => t.id === selectedUnit.towerId)?.name}
                                </p>
                            </div>
                            <Badge variant={getStatusColor(selectedUnit.status)}>{selectedUnit.status}</Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <p className="text-sm text-gray-600 font-inter">Type</p>
                                <p className="font-medium text-gray-900 font-inter">{selectedUnit.type}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 font-inter">Floor</p>
                                <p className="font-medium text-gray-900 font-inter">Floor {selectedUnit.floor}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 font-inter">Carpet Area</p>
                                <p className="font-medium text-gray-900 font-inter">{selectedUnit.carpetArea} sqft</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 font-inter">Built-up Area</p>
                                <p className="font-medium text-gray-900 font-inter">{selectedUnit.builtUpArea} sqft</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 font-inter">Facing</p>
                                <p className="font-medium text-gray-900 font-inter">{selectedUnit.facing}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 font-inter">View</p>
                                <p className="font-medium text-gray-900 font-inter">{selectedUnit.view}</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="mb-3 text-lg font-semibold text-gray-900 font-outfit">Price Breakdown</h3>
                            <dl className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <dt className="text-gray-600 font-inter">Base Price ({selectedUnit.carpetArea} sqft × ₹{selectedUnit.basePrice}/sqft)</dt>
                                    <dd className="font-medium text-gray-900 font-inter">
                                        {formatPrice(selectedUnit.carpetArea * selectedUnit.basePrice)}
                                    </dd>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <dt className="text-gray-600 font-inter">Floor Rise</dt>
                                    <dd className="font-medium text-gray-900 font-inter">{formatPrice(selectedUnit.floorRise)}</dd>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <dt className="text-gray-600 font-inter">PLC Charges</dt>
                                    <dd className="font-medium text-gray-900 font-inter">{formatPrice(selectedUnit.plc)}</dd>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <dt className="text-gray-600 font-inter">Other Charges</dt>
                                    <dd className="font-medium text-gray-900 font-inter">{formatPrice(selectedUnit.otherCharges)}</dd>
                                </div>
                                <div className="flex justify-between border-t border-gray-200 pt-2">
                                    <dt className="font-semibold text-gray-900 font-inter">Total Price</dt>
                                    <dd className="text-lg font-bold text-primary-600 font-outfit">
                                        {formatPrice(selectedUnit.totalPrice)}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <div className="flex gap-3">
                            {selectedUnit.status === 'Available' && (
                                <>
                                    <Button
                                        onClick={() => {
                                            handleReserve(selectedUnit);
                                            setSelectedUnit(null);
                                        }}
                                        className="flex-1"
                                    >
                                        <Lock className="h-4 w-4" />
                                        Reserve Unit
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            handleBook(selectedUnit);
                                            setSelectedUnit(null);
                                        }}
                                        className="flex-1"
                                    >
                                        <Check className="h-4 w-4" />
                                        Book Now
                                    </Button>
                                </>
                            )}
                            {selectedUnit.status === 'Reserved' && (
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        handleRelease(selectedUnit);
                                        setSelectedUnit(null);
                                    }}
                                    className="flex-1"
                                >
                                    Release Reservation
                                </Button>
                            )}
                            <Button variant="ghost" onClick={() => setSelectedUnit(null)}>
                                Close
                            </Button>
                        </div>

                        {selectedUnit.reservedUntil && (
                            <p className="mt-4 text-sm text-orange-600 font-inter text-center">
                                Reserved until {new Date(selectedUnit.reservedUntil).toLocaleString()}
                            </p>
                        )}
                    </Card>
                </div>
            )}
        </>
    );
}
