import React from 'react';
import Link from 'next/link';
import { Property } from '@/types/property';
import { StatusBadge } from './StatusBadge';
import { Building2, MapPin, Pencil, Trash2, Zap, ArrowUpRight, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        <div className="group relative flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 border border-border-subtle overflow-hidden h-full">
            {/* Visual Header / Image */}
            <div className="aspect-[16/10] relative bg-slate-50 overflow-hidden shrink-0 border-b border-border-subtle">
                {image ? (
                    <img
                        src={image}
                        alt={property.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200">
                        <Building2 size={56} strokeWidth={1} />
                    </div>
                )}

                {/* Status Nodes */}
                <div className="absolute top-4 right-4 z-20">
                    <StatusBadge status={property.status} />
                </div>

                <div className="absolute bottom-4 left-4 z-20 flex gap-2">
                    <div className="bg-white/90 backdrop-blur-md px-2 py-1 rounded-md shadow-xs text-[9px] font-black text-text-main flex items-center gap-1.5 border border-white/50 uppercase tracking-widest">
                        <div className="w-1.5 h-1.5 rounded-full bg-ai-accent animate-pulse"></div>
                        {property.developerName || 'Strategic Asset'}
                    </div>
                </div>

                {/* TACTICAL OVERLAY */}
                <div className="absolute inset-0 bg-primary/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4 z-30">

                     <Link
                        href={`/properties/${property.id}`}
                        className="p-3 bg-white text-primary rounded-xl hover:bg-ai-accent transition-all shadow-xl hover:scale-110"
                        title="Modify Node"
                        onClick={(e) => e.stopPropagation()} 
                     >
                        <Pencil size={20} />
                     </Link>
                </div>
            </div>

            {/* Tactical Content */}
            <div className="p-6 flex flex-col flex-grow bg-white">
                <div className="mb-6">
                    <div className="flex justify-between items-start mb-1.5">
                        <h3 className="text-lg font-black text-text-main tracking-tight group-hover:text-primary transition-colors truncate pr-4">
                            {property.name}
                        </h3>
                        <ArrowUpRight size={16} className="text-slate-200 group-hover:text-primary transition-colors flex-shrink-0" />
                    </div>
                    <p className="text-text-secondary text-[11px] font-bold flex items-center gap-1.5 uppercase tracking-wider">
                        <MapPin size={12} className="text-secondary" />
                        {property.location?.locality ? `${property.location.locality}, ${property.location.city}` : property.location?.city || 'Location Code TBA'}
                    </p>
                </div>

                {/* Performance Matrix */}
                <div className="grid grid-cols-2 gap-4 py-4 border-y border-border-subtle mb-6">
                    <div className="space-y-1">
                        <span className="text-[9px] font-black text-text-secondary uppercase tracking-[0.1em]">Liquidity</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-text-main tracking-tight">{property.totalUnits} Units</span>
                            <span className="text-[10px] font-bold text-slate-400">/ {towers}T</span>
                        </div>
                    </div>
                    <div className="space-y-1 text-right">
                        <span className="text-[9px] font-black text-text-secondary uppercase tracking-[0.1em]">Class</span>
                        <div className="flex items-center justify-end gap-1.5">
                            <TrendingUp size={10} className="text-emerald-500" />
                            <span className="text-xs font-black text-text-main truncate uppercase tracking-tighter">{property.projectType || 'Residential Node'}</span>
                        </div>
                    </div>
                </div>

                {/* Valuation Tier */}
                <div className="flex items-center justify-between mt-auto">
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Target Valuation</span>
                    {price ? (
                        <span className="text-lg font-black text-primary tracking-tighter">
                            ₹{(price / 10000000).toFixed(2)} Cr+
                        </span>
                    ) : (
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded border border-slate-100">Market Request Only</span>
                    )}
                </div>
            </div>
        </div>
    );
}
