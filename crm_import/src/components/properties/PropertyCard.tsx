import React from 'react';
import Link from 'next/link';
import { Property } from '@/types/property';
import { StatusBadge } from './StatusBadge';
import { Building2, MapPin, Pencil, Trash2 } from 'lucide-react';

interface PropertyCardProps {
    property: Property;
    onDelete?: (id: string, e: React.MouseEvent) => void;
}

export function PropertyCard({ property, onDelete }: PropertyCardProps) {
    // Adapter for Demo Data vs Real Data property names
    const image = property.primaryImageUrl;
    const price = property.startingPrice;
    const towers = property.totalTowers;

    return (
        <div className="group relative block bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 overflow-hidden transform hover:-translate-y-1">
             <Link href={`/properties/${property.id}`} className="block h-full">
            {/* Image */}
            <div className="aspect-[4/3] relative bg-slate-100 overflow-hidden">
                {image ? (
                    <img
                        src={image}
                        alt={property.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">
                        <Building2 size={48} strokeWidth={1} />
                    </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-4 right-4 shadow-sm">
                    <StatusBadge status={property.status} />
                </div>

                {/* Developer Badge */}
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Building2 size={12} className="text-copper" />
                    {property.developerName || 'Developer'}
                </div>

                {/* ACTIONS OVERLAY (Visible on Hover) */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                     <Link
                        href={`/properties/${property.id}`}
                        className="p-3 bg-white text-slate-700 rounded-full hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-lg"
                        title="Edit Property"
                        onClick={(e) => e.stopPropagation()} 
                     >
                        <Pencil size={18} />
                     </Link>
                     <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (onDelete) onDelete(property.id, e);
                        }}
                        className="p-3 bg-white text-slate-700 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors shadow-lg"
                        title="Delete Property"
                     >
                        <Trash2 size={18} />
                     </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-5">
                <div className="mb-4">
                    <h3 className="text-lg font-bold font-heading text-slate-900 mb-1.5 group-hover:text-copper transition-colors truncate">
                        {property.name}
                    </h3>
                    <p className="text-slate-500 text-sm flex items-center gap-1.5 font-medium">
                        <MapPin size={14} />
                        {property.location?.locality ? `${property.location.locality}, ${property.location.city}` : property.location?.city || 'Location TBA'}
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 py-3 border-t border-slate-100 mb-3">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Configuration</span>
                        <span className="text-sm font-semibold text-slate-700">{towers} Towers • {property.totalUnits} Units</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type</span>
                        <span className="text-sm font-semibold text-slate-700 capitalize">{property.projectType || 'Residential'}</span>
                    </div>
                </div>

                {/* Price */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Starting from</span>
                    {price ? (
                        <span className="text-lg font-bold text-emerald-700 flex items-center gap-1">
                            ₹{(price / 10000000).toFixed(2)} Cr
                        </span>
                    ) : (
                        <span className="text-sm font-bold text-slate-400">Price on Request</span>
                    )}
                </div>
            </div>
            </Link>
        </div>
    );
}
