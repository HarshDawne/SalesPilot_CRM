import React, { useState } from 'react';
import { Tower } from '@/types/property';
import { propertiesAPI } from '@/lib/api/properties';
import { X, Building2, Save } from 'lucide-react';

interface TowerModalProps {
    propertyId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (tower: Tower) => void;
}

export function TowerModal({ propertyId, isOpen, onClose, onSuccess }: TowerModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        totalFloors: '',
        totalUnits: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            setLoading(true);
            const res = await propertiesAPI.createTower(propertyId, {
                propertyId,
                name: formData.name,
                code: formData.code || undefined,
                totalFloors: formData.totalFloors ? parseInt(formData.totalFloors) : undefined,
                totalUnits: formData.totalUnits ? parseInt(formData.totalUnits) : 0,
            });

            onSuccess(res.data);
            setFormData({ name: '', code: '', totalFloors: '', totalUnits: '' });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create tower');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="filter-panel max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-copper/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-copper" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-charcoal">Add Tower</h2>
                            <p className="text-sm text-muted">Create a new tower or building</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                    >
                        <X size={20} className="text-muted" />
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-900">{error}</p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Tower Name */}
                    <div>
                        <label className="block text-xs font-bold text-copper uppercase mb-2">
                            Tower Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="input-premium focus-ring-copper w-full"
                            placeholder="e.g., Tower A, North Block"
                            autoFocus
                        />
                        <p className="text-xs text-muted mt-1">Required - Unique identifier for this tower</p>
                    </div>

                    {/* Tower Code */}
                    <div>
                        <label className="block text-xs font-bold text-copper uppercase mb-2">
                            Tower Code
                        </label>
                        <input
                            type="text"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            className="input-premium focus-ring-copper w-full"
                            placeholder="e.g., T-A, BLK-01"
                        />
                        <p className="text-xs text-muted mt-1">Optional - Short code for internal reference</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Floors */}
                        <div>
                            <label className="block text-xs font-bold text-copper uppercase mb-2">
                                Number of Floors
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={formData.totalFloors}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '' || /^\d+$/.test(val)) {
                                        setFormData({ ...formData, totalFloors: val });
                                    }
                                }}
                                className="input-premium focus-ring-copper w-full appearance-none"
                                placeholder="e.g., 20"
                            />
                        </div>

                        {/* Total Units */}
                        <div>
                            <label className="block text-xs font-bold text-copper uppercase mb-2">
                                Total Units
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={formData.totalUnits}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '' || /^\d+$/.test(val)) {
                                        setFormData({ ...formData, totalUnits: val });
                                    }
                                }}
                                className="input-premium focus-ring-copper w-full appearance-none"
                                placeholder="e.g., 40"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary-charcoal flex-1"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary-copper flex-1"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Create Tower
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
