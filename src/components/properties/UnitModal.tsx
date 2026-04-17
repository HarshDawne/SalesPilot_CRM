import React, { useState } from 'react';
import { Unit } from '@/lib/types/properties';
import { propertiesAPI } from '@/lib/api/properties';
import { X, Home, Save } from 'lucide-react';

interface UnitModalProps {
    towerId: string;
    propertyId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (unit: Unit) => void;
}

export function UnitModal({ towerId, propertyId, isOpen, onClose, onSuccess }: UnitModalProps) {
    const [formData, setFormData] = useState({
        label: '',
        floor: '',
        sizeSqft: '',
        bedrooms: '',
        bathrooms: '',
        category: 'residential' as const,
        price: '',
        status: 'available' as const,
        bookedByName: '',
        bookedByContact: '',
        bookingDate: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            setLoading(true);

            const res = await propertiesAPI.createUnit(towerId, {
                towerId,
                propertyId,
                label: formData.label,
                floor: formData.floor ? parseInt(formData.floor) : undefined,
                sizeSqft: formData.sizeSqft ? parseInt(formData.sizeSqft) : undefined,
                bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
                bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
                category: formData.category,
                price: formData.price ? parseFloat(formData.price) : undefined,
                status: formData.status,
                bookedBy: (formData.status !== 'available' && formData.bookedByName) ? {
                    name: formData.bookedByName,
                    contact: formData.bookedByContact || undefined,
                    bookingDate: formData.bookingDate || undefined,
                } : null,
            });

            onSuccess(res.data);
            // Reset form
            setFormData({
                label: '',
                floor: '',
                sizeSqft: '',
                bedrooms: '',
                bathrooms: '',
                category: 'residential',
                price: '',
                status: 'available',
                bookedByName: '',
                bookedByContact: '',
                bookingDate: '',
            });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create unit');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const showBookingFields = formData.status !== 'available';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="filter-panel max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-copper/10 flex items-center justify-center">
                            <Home className="w-5 h-5 text-copper" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-charcoal">Add Unit</h2>
                            <p className="text-sm text-muted">Create a new unit in this tower</p>
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
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div>
                        <h3 className="text-sm font-bold text-charcoal mb-3">Basic Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-copper uppercase mb-2">
                                    Unit Number/Label <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.label}
                                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                    className="input-premium focus-ring-copper w-full"
                                    placeholder="e.g., A-101, 201"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-copper uppercase mb-2">Floor</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={formData.floor}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '' || /^\d+$/.test(val)) {
                                            setFormData({ ...formData, floor: val });
                                        }
                                    }}
                                    className="input-premium focus-ring-copper w-full appearance-none"
                                    placeholder="e.g., 10"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-copper uppercase mb-2">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                                    className="input-premium focus-ring-copper w-full"
                                >
                                    <option value="residential">Residential</option>
                                    <option value="office">Office</option>
                                    <option value="rental">Rental</option>
                                    <option value="commercial">Commercial</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-copper uppercase mb-2">Area (sqft)</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={formData.sizeSqft}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '' || /^\d+$/.test(val)) {
                                            setFormData({ ...formData, sizeSqft: val });
                                        }
                                    }}
                                    className="input-premium focus-ring-copper w-full appearance-none"
                                    placeholder="e.g., 1200"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-copper uppercase mb-2">Bedrooms</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={formData.bedrooms}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '' || /^\d+$/.test(val)) {
                                            setFormData({ ...formData, bedrooms: val });
                                        }
                                    }}
                                    className="input-premium focus-ring-copper w-full appearance-none"
                                    placeholder="e.g., 2"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-copper uppercase mb-2">Bathrooms</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={formData.bathrooms}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '' || /^\d+$/.test(val)) {
                                            setFormData({ ...formData, bathrooms: val });
                                        }
                                    }}
                                    className="input-premium focus-ring-copper w-full appearance-none"
                                    placeholder="e.g., 2"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pricing & Status */}
                    <div>
                        <h3 className="text-sm font-bold text-charcoal mb-3">Pricing & Status</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-copper uppercase mb-2">Price (₹)</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={formData.price}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        // Allow only digits or empty string
                                        if (val === '' || /^\d+$/.test(val)) {
                                            setFormData({ ...formData, price: val });
                                        }
                                    }}
                                    className="input-premium focus-ring-copper w-full appearance-none"
                                    placeholder="e.g., 75000000"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-copper uppercase mb-2">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                    className="input-premium focus-ring-copper w-full"
                                >
                                    <option value="available">Available</option>
                                    <option value="booked">Booked</option>
                                    <option value="sold">Sold</option>
                                    <option value="blocked">Blocked</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Booking Info - Conditional */}
                    {showBookingFields && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <h3 className="text-sm font-bold text-charcoal mb-3">Booking Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-copper uppercase mb-2">
                                        Booked By
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.bookedByName}
                                        onChange={(e) => setFormData({ ...formData, bookedByName: e.target.value })}
                                        className="input-premium focus-ring-copper w-full"
                                        placeholder="Customer name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-copper uppercase mb-2">
                                        Contact
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.bookedByContact}
                                        onChange={(e) => setFormData({ ...formData, bookedByContact: e.target.value })}
                                        className="input-premium focus-ring-copper w-full"
                                        placeholder="Phone/Email"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-copper uppercase mb-2">
                                        Booking Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.bookingDate}
                                        onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
                                        className="input-premium focus-ring-copper w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

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
                                    Create Unit
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
