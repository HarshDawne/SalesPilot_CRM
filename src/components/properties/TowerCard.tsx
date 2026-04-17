"use client";

import React from 'react';
import Link from 'next/link';
import { Calendar, ChevronRight, Edit3, Check, XCircle } from 'lucide-react';

export function TowerCard({ tower, propertyId, onRename }: { tower: any, propertyId: string, onRename?: (id: string, newName: string) => void }) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [tempName, setTempName] = React.useState(tower.name);

    // Determine status color
    const statusColors: Record<string, string> = {
        'Structural Complete': 'bg-emerald-100 text-emerald-700',
        'Plinth Level': 'bg-amber-100 text-amber-700',
        'Handed Over': 'bg-blue-100 text-blue-700',
        'Pre-Launch': 'bg-purple-100 text-purple-700'
    };

    // Fallback if status doesn't match keys
    const badgeClass = statusColors[tower.status] || 'bg-slate-100 text-slate-600';

    const handleEditClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsEditing(true);
        setTempName(tower.name);
    };

    const handleSave = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onRename && tempName.trim()) {
            onRename(tower.id, tempName);
        }
        setIsEditing(false);
    };

    const handleCancel = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setTempName(tower.name);
        setIsEditing(false);
    };

    const handleInputClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    return (
        <Link
            href={`/properties/${propertyId}/towers/${tower.id}`}
            className="block group transition-all duration-300 hover:-translate-y-1 col-span-1"
        >
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group-hover:border-copper/50 group-hover:shadow-md transition-all">

                {/* Header Card */}
                <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-lg group-hover:bg-copper group-hover:text-white transition-colors">
                                {tempName.substring(0, 1)}
                            </div>
                            <div className="flex-1">
                                {isEditing ? (
                                    <div className="flex items-center gap-2" onClick={handleInputClick}>
                                        <input
                                            type="text"
                                            value={tempName}
                                            onChange={(e) => setTempName(e.target.value)}
                                            className="w-full text-base font-bold text-slate-900 border-b border-copper focus:outline-none bg-transparent"
                                            autoFocus
                                        />
                                        <button onClick={handleSave} className="p-1 hover:bg-emerald-100 text-emerald-600 rounded">
                                            <Check size={14} />
                                        </button>
                                        <button onClick={handleCancel} className="p-1 hover:bg-red-100 text-red-500 rounded">
                                            <XCircle size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 group/title">
                                        <h3 className="font-bold text-slate-900 text-base group-hover:text-copper transition-colors">{tower.name}</h3>
                                        {onRename && (
                                            <button
                                                onClick={handleEditClick}
                                                className="text-slate-400 hover:text-copper transition-colors p-1"
                                                title="Edit Name"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                        )}
                                    </div>
                                )}
                                <p className="text-xs text-slate-500 font-medium">
                                    {tower.totalFloors} Floors • {tower.unitsPerFloor} Units/Floor
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${badgeClass}`}>
                                {tower.status}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                        <span className="flex items-center gap-1.5 font-medium">
                            <Calendar size={14} className="text-copper" />
                            Possession: {new Date(tower.possessionDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                        </span>
                        <div className="flex items-center gap-1 text-copper font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                            View Inventory <ChevronRight size={14} />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
