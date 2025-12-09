'use client';

import { Tower, BuildingStatus } from '@/types/property';
import { Building2, Layers, CheckCircle2, Clock, Hammer, AlertCircle } from 'lucide-react';

interface TowerGridProps {
    towers: Tower[];
    onTowerClick?: (tower: Tower) => void;
}

export default function TowerGrid({ towers, onTowerClick }: TowerGridProps) {
    const getStatusColor = (status: BuildingStatus) => {
        switch (status) {
            case 'READY':
                return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20';
            case 'FINISHING':
                return 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20';
            case 'STRUCTURE':
                return 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20';
            case 'FOUNDATION':
                return 'bg-orange-50 text-orange-700 ring-1 ring-orange-600/20';
            default:
                return 'bg-slate-50 text-slate-700 ring-1 ring-slate-600/20';
        }
    };

    const getStatusIcon = (status: BuildingStatus) => {
        switch (status) {
            case 'READY':
                return <CheckCircle2 className="w-4 h-4" />;
            case 'FINISHING':
                return <Hammer className="w-4 h-4" />;
            case 'STRUCTURE':
                return <Building2 className="w-4 h-4" />;
            case 'FOUNDATION':
                return <Layers className="w-4 h-4" />;
            case 'PLANNING':
                return <Clock className="w-4 h-4" />;
            default:
                return <AlertCircle className="w-4 h-4" />;
        }
    };

    if (towers.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No towers found for this property</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {towers.map((tower) => {
                const occupancyRate = tower.totalUnits > 0
                    ? ((tower.totalUnits - tower.availableUnits) / tower.totalUnits * 100).toFixed(1)
                    : '0';

                return (
                    <div
                        key={tower.id}
                        onClick={() => onTowerClick?.(tower)}
                        className={`premium-card p-5 group ${onTowerClick ? 'cursor-pointer hover:border-indigo-300' : ''}`}
                    >
                        {/* Tower Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100 group-hover:bg-indigo-100 transition-colors">
                                    <Building2 className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{tower.name}</h3>
                                    <p className="text-xs font-medium text-slate-500">{tower.floors} Floors</p>
                                </div>
                            </div>
                            <span className={`badge-pill backdrop-blur-sm ${getStatusColor(tower.status)}`}>
                                {getStatusIcon(tower.status)}
                                {tower.status.replace('_', ' ')}
                            </span>
                        </div>

                        {/* Tower Stats */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-slate-50 rounded-md p-2.5 border border-slate-100">
                                <div className="text-lg font-bold text-slate-900">{tower.totalUnits}</div>
                                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Units</div>
                            </div>
                            <div className="bg-emerald-50 rounded-md p-2.5 border border-emerald-100">
                                <div className="text-lg font-bold text-emerald-700">{tower.availableUnits}</div>
                                <div className="text-xs font-semibold text-emerald-600/80 uppercase tracking-wide">Available</div>
                            </div>
                        </div>

                        {/* Occupancy Bar */}
                        <div className="mb-3">
                            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
                                <span>Occupancy Rate</span>
                                <span className={Number(occupancyRate) > 80 ? 'text-indigo-600' : 'text-slate-600'}>{occupancyRate}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-indigo-500 h-full rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${occupancyRate}%` }}
                                />
                            </div>
                        </div>

                        {/* Specifications */}
                        {tower.specifications && (
                            <div className="text-xs text-gray-600 space-y-1">
                                {tower.specifications.height && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400">Height:</span>
                                        <span>{tower.specifications.height}</span>
                                    </div>
                                )}
                                {tower.specifications.structure && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400">Structure:</span>
                                        <span>{tower.specifications.structure}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
