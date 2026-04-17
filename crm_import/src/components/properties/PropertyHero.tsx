
import React from 'react';
import { Badge } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { MapPin, Building2, Users } from 'lucide-react';

export function PropertyHero({ property }: { property: any }) {
    return (
        <div className="bg-white border-b border-slate-200">
            {/* Banner */}
            <div className="relative h-64 lg:h-80 bg-slate-900 group overflow-hidden">
                <img
                    src={property.heroImage || property.coverImage || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00"}
                    alt={property.name}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent flex items-end">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-8 w-full">
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <StatusBadge status={property.constructionStatus || property.status} />
                                    <span className="text-white/80 text-sm font-semibold tracking-wide uppercase px-2 py-0.5 border border-white/20 rounded">
                                        {property.propertyType || (property.projectType === 'RESIDENTIAL' ? 'Residential' : 
                                         property.projectType === 'COMMERCIAL' ? 'Commercial' : 
                                         property.projectType === 'MIXED_USE' ? 'Mixed-Use' : 
                                         property.projectType)}
                                    </span>
                                </div>
                                <h1 className="text-4xl font-bold text-white font-heading mb-2">{property.name}</h1>
                                <p className="text-slate-300 text-lg flex items-center gap-2">
                                    <MapPin size={18} className="text-copper" />
                                    {property.microMarket || property.area}, {property.city}
                                </p>
                            </div>
                            <div className="lg:text-right">
                                <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Developer</p>
                                <div className="text-white font-bold text-xl flex items-center lg:justify-end gap-2">
                                    <Building2 size={20} className="text-copper" />
                                    {property.developer}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="grid grid-cols-4 divide-x divide-slate-100 py-6">
                    <div className="px-4 first:pl-0 text-center lg:text-left">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Towers</div>
                        <div className="text-2xl font-bold text-slate-900">{property.totalTowers || property.towers?.length || 0}</div>
                    </div>
                    <div className="px-4 text-center lg:text-left">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Total Units</div>
                        <div className="text-2xl font-bold text-slate-900">{property.totalUnits}</div>
                    </div>
                    <div className="px-4 text-center lg:text-left">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Price Range</div>
                        <div className="text-2xl font-bold text-emerald-700">
                            ₹{(property.startingPrice / 10000000).toFixed(2)} - {(property.highestPrice / 10000000).toFixed(2)} Cr
                        </div>
                    </div>
                    <div className="px-4 text-center lg:text-left">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Occupancy</div>
                        <div className="text-2xl font-bold text-slate-900">--%</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
