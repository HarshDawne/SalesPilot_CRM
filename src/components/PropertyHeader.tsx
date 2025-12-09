'use client';

import { Property, ProjectStatus, Unit, UnitStatus } from '@/types/property';
import { Building2, MapPin, Calendar, CheckCircle2, Clock, Hammer, Sparkles } from 'lucide-react';

interface PropertyHeaderProps {
    property: Property;
    units?: Unit[];
}

export default function PropertyHeader({ property, units = [] }: PropertyHeaderProps) {
    const getStatusColor = (status: ProjectStatus) => {
        switch (status) {
            case 'ACTIVE':
                return 'bg-green-100 text-green-800';
            case 'UNDER_CONSTRUCTION':
                return 'bg-blue-100 text-blue-800';
            case 'COMPLETED':
                return 'bg-gray-100 text-gray-800';
            case 'PLANNING':
                return 'bg-yellow-100 text-yellow-800';
            case 'ON_HOLD':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: ProjectStatus) => {
        switch (status) {
            case 'ACTIVE':
                return <CheckCircle2 className="w-4 h-4" />;
            case 'UNDER_CONSTRUCTION':
                return <Hammer className="w-4 h-4" />;
            case 'COMPLETED':
                return <CheckCircle2 className="w-4 h-4" />;
            case 'PLANNING':
                return <Clock className="w-4 h-4" />;
            case 'ON_HOLD':
                return <Clock className="w-4 h-4" />; // Or specific icon
            default:
                return <Building2 className="w-4 h-4" />;
        }
    };

    const occupancyRate = property.totalUnits > 0
        ? ((property.bookedUnits / property.totalUnits) * 100).toFixed(1)
        : '0';

    // Calculate Revenue Stats
    const revenueStats = {
        bookedValue: units.filter(u => u.status === UnitStatus.BOOKED).reduce((sum, u) => sum + (u.totalPrice || 0), 0),
        availableValue: units.filter(u => [UnitStatus.AVAILABLE, UnitStatus.RESERVED, UnitStatus.NEGOTIATION].includes(u.status)).reduce((sum, u) => sum + (u.totalPrice || 0), 0),
        hasPrices: units.some(u => (u.totalPrice || 0) > 0)
    };

    const formatCurrency = (amount: number) => {
        if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
        return `₹${amount.toLocaleString()}`;
    };

    return (

        <div className="premium-card overflow-hidden mb-8">
            {/* Hero / Banner Section */}
            <div className="relative h-[280px] sm:h-[320px] group">
                {property.primaryImageUrl ? (
                    <img
                        src={property.primaryImageUrl}
                        alt={property.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                        <Building2 className="w-16 h-16 text-slate-300" />
                    </div>
                )}
                {/* Premium Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent pointer-events-none" />

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white z-10">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            {/* Status Pill - Light/Dark adapted */}
                            <div className="flex items-center gap-3 mb-3">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-lg
                                    ${property.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/30' :
                                        property.status === 'UNDER_CONSTRUCTION' ? 'bg-blue-500/20 text-blue-100 border border-blue-500/30' :
                                            property.status === 'ON_HOLD' ? 'bg-red-500/20 text-red-100 border border-red-500/30' :
                                                'bg-white/20 text-white border border-white/20'}`}>
                                    {getStatusIcon(property.status)}
                                    {property.status?.replace('_', ' ')}
                                </span>
                                {property.reraId && (
                                    <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-black/30 text-xs font-mono text-slate-300 border border-white/10">
                                        RERA: {property.reraId}
                                    </span>
                                )}
                            </div>

                            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2 shadow-sm">
                                {property.name}
                            </h1>

                            <div className="flex items-center gap-4 text-slate-200 text-sm font-medium">
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4 text-white/80" />
                                    <span>{property.location.locality}, {property.location.city}</span>
                                </div>
                                {property.developerName && (
                                    <div className="hidden sm:flex items-center gap-1.5">
                                        <div className="w-1 h-1 rounded-full bg-slate-400" />
                                        <span>{property.developerName}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions or decorative element could go here */}
                    </div>
                </div>
            </div>

            {/* Quick Stats Strip */}
            <div className="px-6 py-4 border-b border-slate-100 bg-white overflow-x-auto">
                <div className="flex flex-nowrap items-center gap-x-8 gap-y-4 text-sm divide-x divide-slate-100 [&>div+div]:pl-8 min-w-max">
                    <div>
                        <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-0.5">Total Towers</div>
                        <div className="text-slate-900 font-bold text-lg">{property.totalTowers}</div>
                    </div>
                    <div>
                        <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-0.5">Total Units</div>
                        <div className="text-slate-900 font-bold text-lg">{property.totalUnits}</div>
                    </div>
                    <div>
                        <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-0.5">Available</div>
                        <div className="text-emerald-600 font-bold text-lg">{property.availableUnits}</div>
                    </div>
                    <div>
                        <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-0.5">Occupancy</div>
                        <div className="text-blue-600 font-bold text-lg">{occupancyRate}%</div>
                    </div>
                    {(property.launchDate || property.expectedCompletion) && (
                        <div>
                            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-0.5">Timeline</div>
                            <div className="text-slate-700 font-medium whitespace-nowrap">
                                {property.launchDate ? new Date(property.launchDate).getFullYear() : 'N/A'} - {property.expectedCompletion ? new Date(property.expectedCompletion).getFullYear() : 'Ongoing'}
                            </div>
                        </div>
                    )}
                    {revenueStats.hasPrices && (
                        <>
                            <div>
                                <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-0.5">Total Sales</div>
                                <div className="text-indigo-600 font-bold text-lg">{formatCurrency(revenueStats.bookedValue)}</div>
                            </div>
                            <div>
                                <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-0.5">Unsold Value</div>
                                <div className="text-slate-600 font-bold text-lg">{formatCurrency(revenueStats.availableValue)}</div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Content Body (Highlights + Description) */}
            <div className="p-6">

                {/* Highlights */}
                {property.highlights && property.highlights.length > 0 && (
                    <div className="mt-4 mb-6">
                        <div className="flex flex-wrap gap-2">
                            {property.highlights.map((highlight, index) => (
                                <span
                                    key={index}
                                    className="badge-pill bg-indigo-50 text-indigo-700 border-indigo-100"
                                >
                                    <Sparkles className="w-3 h-3" />
                                    {highlight}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Description */}
                <div className="prose prose-sm prose-slate max-w-none mb-6">
                    <p className="text-slate-600 leading-relaxed">{property.description}</p>
                </div>

                {/* Amenities */}
                {property.amenities && property.amenities.length > 0 && (
                    <div className="pt-6 border-t border-slate-100">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Lifestyle Amenities</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {property.amenities.map((amenity, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-2.5 text-sm text-slate-700 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    <span className="p-1.5 bg-slate-100 rounded-md text-slate-500">
                                        <CheckCircle2 size={16} />
                                    </span>
                                    <span className="font-medium">{typeof amenity === 'string' ? amenity : amenity.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
