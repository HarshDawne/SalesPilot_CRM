import React from 'react';
import { Trash2, Plus, Building2 } from 'lucide-react';

interface AmenitiesEditorProps {
    amenities: string[];
    onChange: (amenities: string[]) => void;
    isEditing?: boolean;
}

export function AmenitiesEditor({ amenities, onChange, isEditing = true }: AmenitiesEditorProps) {

    const [isAdding, setIsAdding] = React.useState(false);
    const [newAmenity, setNewAmenity] = React.useState('');

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            saveAmenity();
        } else if (e.key === 'Escape') {
            setIsAdding(false);
            setNewAmenity('');
        }
    };

    const saveAmenity = () => {
        if (newAmenity.trim()) {
            onChange([...amenities, newAmenity.trim()]);
        }
        setIsAdding(false);
        setNewAmenity('');
    };

    const handleRemoveAmenity = (index: number) => {
        // Direct remove without confirmation for smoother UX
        const newAmenities = [...amenities];
        newAmenities.splice(index, 1);
        onChange(newAmenities);
    };

    return (
        <div className="flex flex-wrap gap-2">
                {amenities.map((a, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 group">
                        {a}
                        <Building2 size={12} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                        {isEditing && (
                            <button
                                onClick={() => handleRemoveAmenity(idx)}
                                className="ml-1 text-slate-300 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={10} />
                            </button>
                        )}
                    </span>
                ))}

                {isEditing && (
                    isAdding ? (
                        <div className="flex items-center">
                            <input
                                autoFocus
                                type="text"
                                value={newAmenity}
                                onChange={(e) => setNewAmenity(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onBlur={saveAmenity}
                                placeholder="Enter amenity name"
                                className="px-3 py-1 bg-white border border-copper rounded-full text-xs font-medium text-slate-900 focus:outline-none min-w-[120px] placeholder-slate-400"
                            />
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="px-3 py-1.5 border border-dashed border-slate-300 rounded-lg text-[11px] font-bold text-slate-400 hover:text-emerald-600 hover:border-emerald-500 transition-colors flex items-center gap-2"
                        >
                            <Plus size={12} /> Add
                        </button>
                    )
                )}
            </div>
    );
}
