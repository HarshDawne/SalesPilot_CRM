"use client";

import React, { useEffect, useState } from 'react';
import { useBlueprint } from '@/hooks/useBlueprint';
import { Building2, MapPin, ArrowLeft, Save, ShieldCheck, ArrowUpRight, Upload, Trash2, Pencil, Info, Shield, Plus as PlusIcon, CheckCircle2, X, Navigation, School, Hospital, Zap, Phone, Layers, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TowerEditor } from '@/components/blueprint/TowerEditor';
import { PropertyDocuments } from '@/components/properties/PropertyDocuments';
import { UnsavedChangesModal } from '@/components/blueprint/UnsavedChangesModal';
import { BlueprintProperty } from '@/lib/types/blueprint';
import { useToast } from '@/components/ui/ToastProvider';

interface PropertyBlueprintEditorProps {
    mode: 'create' | 'edit' | 'view';
    initialData?: BlueprintProperty;
    onSave: (data: BlueprintProperty) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    onBack: () => void;
    onEditToggle?: (mode: 'view' | 'edit') => void;
    title?: string;
}

export function PropertyBlueprintEditor({
    mode,
    initialData,
    onSave,
    onDelete,
    onBack,
    onEditToggle,
    title
}: PropertyBlueprintEditorProps) {
    const { showToast } = useToast();
    const router = useRouter();
    const {
        property, updateMetadata, setTowerCount, updateTowerConfig,
        activeTowerId, setActiveTowerId,
        updateUnit,
        addDocument, updateDocument, deleteDocument,
        addRenderRequest, addRender, updateRenderRequest, deleteRenderRequest,
        isDirty, saveDraft, discardChanges,
        loadBlueprint
    } = useBlueprint();

    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editingTowerId, setEditingTowerId] = useState<string | null>(null);
    const [editingTowerName, setEditingTowerName] = useState('');
    const [newAmenityName, setNewAmenityName] = useState('');
    const [isAddingAmenity, setIsAddingAmenity] = useState(false);
    const [pendingBack, setPendingBack] = useState(false);
    // Location Intelligence add-row state
    const [addingLocType, setAddingLocType] = useState<'connectivity' | 'schools' | 'hospitals' | null>(null);
    const [newLocName, setNewLocName] = useState('');
    const [newLocDist, setNewLocDist] = useState('');
    // Inline-edit state for name/location in header
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingLocation, setIsEditingLocation] = useState(false);
    const [addressSearch, setAddressSearch] = useState(property.address || '');
    const [showAddressResults, setShowAddressResults] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const MOCK_LOCATIONS = [
        { name: 'Aurum Q Parc', locality: 'Ghansoli, Navi Mumbai', address: 'Aurum Q Parc, Ghansoli, Navi Mumbai, Maharashtra 400701' },
        { name: 'Lodha World Tower', locality: 'Lower Parel, Mumbai', address: 'The World Towers, Lodha Place, Lower Parel, Mumbai, Maharashtra 400013' },
        { name: 'Hiranadani Gardens', locality: 'Powai, Mumbai', address: 'Hiranandani Gardens, Powai, Mumbai, Maharashtra 400076' },
        { name: 'Palava City', locality: 'Dombivli, Thane', address: 'Palava City, Dombivli, Maharashtra 421204' },
    ];

    const filteredLocations = MOCK_LOCATIONS.filter(loc => 
        loc.name.toLowerCase().includes(addressSearch.toLowerCase()) ||
        loc.locality.toLowerCase().includes(addressSearch.toLowerCase())
    );


    const isReadOnly = mode === 'view';

    useEffect(() => {
        if (initialData) {
            loadBlueprint(initialData);
        }
    }, [initialData, loadBlueprint]);

    useEffect(() => {
        if (!isDirty) return;
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    const handleBackClick = () => {
        if (isDirty) {
            setShowUnsavedModal(true);
        } else {
            onBack();
        }
    };

    const handleDiscard = () => {
        discardChanges();
        if (initialData) {
            loadBlueprint(initialData);
        }
        setShowUnsavedModal(false);
        if (onEditToggle) {
            onEditToggle('view');
        } else {
            onBack();
        }
    };

    const handleCancelAction = () => {
        if (isDirty) {
            setShowUnsavedModal(true);
        } else {
            if (onEditToggle) {
                onEditToggle('view');
            } else {
                onBack();
            }
        }
    };

    const handleSaveAction = async (shouldNavigateBack = false) => {
        try {
            setIsSaving(true);
            await onSave(property);
            saveDraft();
            setShowUnsavedModal(false);
            if (shouldNavigateBack) {
                onBack();
            } else {
                if (onEditToggle) onEditToggle('view');
            }
        } catch (error) {
            console.error("Failed to save:", error);
            showToast("Failed to save property.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAction = async () => {
        if (!property.id || !onDelete) return;
        try {
            setIsDeleting(true);
            await onDelete(property.id);
        } catch (error) {
            console.error("Failed to delete:", error);
            showToast("Failed to delete property.", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    const compressImage = (dataUrl: string): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const maxDim = 1200;
                
                if (width > height && width > maxDim) {
                    height *= maxDim / width;
                    width = maxDim;
                } else if (height > maxDim) {
                    width *= maxDim / height;
                    height = maxDim;
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to high-quality JPG
            };
            img.src = dataUrl;
        });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result as string;
                // Compress before saving
                const compressed = await compressImage(base64String);
                updateMetadata('heroImage', compressed);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddAmenity = () => {
        if (newAmenityName.trim()) {
            updateMetadata('amenities', [...(property.amenities || []), newAmenityName.trim()]);
            setNewAmenityName('');
            setIsAddingAmenity(false);
        }
    };

    const activeTower = property.towers.find(t => t.id === activeTowerId);
    if (activeTowerId && activeTower) {
        return (
            <TowerEditor
                propertyId={property.id}
                propertyName={property.name}
                builderName={property.developer || 'Developer'}
                tower={activeTower}
                onBack={() => setActiveTowerId(null)}
                isReadOnly={isReadOnly}
                onUpdateConfig={(updates) => updateTowerConfig(activeTower.id, updates)}
                onUpdateUnit={updateUnit}
            />
        );
    }

    // Safety fallback for empty property
    if (!property) {
        return <div className="p-6 text-sm text-muted-foreground">Loading project blueprint…</div>;
    }

    // Calculate total inventory
    const totalInventory = property.towers.reduce((sum, tower) => sum + (tower.units?.length || 0), 0);

    return (
        <div className="min-h-screen bg-slate-900">
            {/* RESTRUCTURED UNIFIED HEADER */}
            <header
                className="relative bg-slate-900 border-b border-slate-700 overflow-hidden"
                style={{
                    backgroundImage: property.heroImage ? `url(${property.heroImage})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                {/* Visual Overlay for Readability */}
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"></div>

                <div className="relative z-10 max-w-6xl mx-auto px-6">
                    {/* TOP ROW: Back, Status, and Main Actions */}
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleBackClick}
                                    className="p-1.5 hover:bg-white/10 rounded transition-colors"
                                >
                                    <ArrowLeft size={18} className="text-slate-300" />
                                </button>
                                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Builder Mode</span>
                            </div>

                            <div className="h-4 w-px bg-white/20"></div>

                            <div className="flex items-center gap-3">
                                {isReadOnly ? (
                                    <div className="flex items-center gap-3">
                                        <div className="px-2.5 py-1 bg-white/5 border border-white/10 text-white text-[10px] font-bold rounded uppercase tracking-wider">
                                            {property.status}
                                        </div>
                                        <div className="px-2.5 py-1 bg-white/5 border border-white/10 text-white text-[10px] font-bold rounded uppercase tracking-wider">
                                            {property.propertyType}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <select
                                            value={property.status}
                                            onChange={(e) => updateMetadata('status', e.target.value)}
                                            className="px-2 py-1 bg-white/10 border border-white/20 text-white text-[10px] font-bold rounded uppercase tracking-wider hover:bg-white/20 transition-colors focus:outline-none cursor-pointer"
                                        >
                                            <option value="Planning" className="bg-slate-800">Planning</option>
                                            <option value="Pre-Launch" className="bg-slate-800">Pre-Launch</option>
                                            <option value="Under Construction" className="bg-slate-800">Under Construction</option>
                                            <option value="Ready to Move" className="bg-slate-800">Ready to Move</option>
                                        </select>

                                        <select
                                            value={property.propertyType}
                                            onChange={(e) => updateMetadata('propertyType', e.target.value)}
                                            className="px-2 py-1 bg-white/10 border border-white/20 text-white text-[10px] font-bold rounded uppercase tracking-wider hover:bg-white/20 transition-colors focus:outline-none cursor-pointer"
                                        >
                                            <option value="Residential" className="bg-slate-800">Residential</option>
                                            <option value="Commercial" className="bg-slate-800">Commercial</option>
                                            <option value="Mixed Use" className="bg-slate-800">Mixed Use</option>
                                        </select>
                                    </>
                                )}

                                {!isReadOnly && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                                        Live Editor
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {isReadOnly ? (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => onEditToggle?.('edit')}
                                        className="flex items-center gap-2 px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded uppercase tracking-wider transition-all border border-white/10"
                                    >
                                        <Pencil size={14} />
                                        Edit Property
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="flex items-center gap-2 px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded uppercase tracking-wider transition-all border border-red-500/20"
                                    >
                                        <Trash2 size={14} />
                                        Delete
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={handleCancelAction}
                                        className="text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleSaveAction(false)}
                                        disabled={isSaving}
                                        className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded uppercase tracking-wider transition-colors disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                                    >
                                        <Save size={14} />
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* MIDDLE ROW: Name, Location (Left) and Developer (Right) */}
                    <div className="flex items-center justify-between pt-8 pb-10">
                        <div className="space-y-2">
                            <div className="group relative">
                                {isEditingName ? (
                                    <input
                                        autoFocus
                                        value={property.name}
                                        onChange={(e) => updateMetadata('name', e.target.value)}
                                        onBlur={() => setIsEditingName(false)}
                                        onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                                        className="bg-white/10 border border-emerald-400/50 text-white text-4xl font-bold px-2 py-1 rounded focus:outline-none w-full max-w-xl"
                                    />
                                ) : (
                                    <h1
                                        onClick={() => !isReadOnly && setIsEditingName(true)}
                                        className={`text-4xl font-bold text-white px-2 py-1 -ml-2 rounded transition-all ${!isReadOnly ? 'cursor-pointer hover:bg-white/5' : ''}`}
                                    >
                                        {property.name || 'New Project Blueprint'}
                                    </h1>
                                )}
                            </div>

                            <div className="flex items-center gap-2 relative">
                                <MapPin size={14} className="text-red-400" />
                                {isEditingLocation ? (
                                    <div className="relative group">
                                        <input
                                            autoFocus
                                            value={addressSearch}
                                            onChange={(e) => {
                                                setAddressSearch(e.target.value);
                                                setShowAddressResults(true);
                                            }}
                                            onFocus={() => setShowAddressResults(true)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    updateMetadata('address', addressSearch);
                                                    setIsEditingLocation(false);
                                                    setShowAddressResults(false);
                                                }
                                                if (e.key === 'Escape') {
                                                    setAddressSearch(property.address);
                                                    setIsEditingLocation(false);
                                                }
                                            }}
                                            placeholder="Search project location..."
                                            className="bg-white/10 border border-emerald-400/50 text-white text-sm px-3 py-1 rounded-xl focus:outline-none w-64 focus:bg-white/20 transition-all shadow-xl"
                                        />
                                        {showAddressResults && addressSearch.length > 1 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-[60] animate-in slide-in-from-top-2 w-72">
                                                <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Local Suggestions</span>
                                                    <Navigation size={10} className="text-emerald-500 mr-2" />
                                                </div>
                                                {filteredLocations.map((loc, i) => (
                                                    <button
                                                        key={i}
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            setAddressSearch(loc.address);
                                                            updateMetadata('address', loc.address);
                                                            setIsEditingLocation(false);
                                                            setShowAddressResults(false);
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition-colors border-b last:border-0 border-slate-50 group/item"
                                                    >
                                                        <div className="text-[11px] font-bold text-slate-900 group-hover/item:text-emerald-700">{loc.name}</div>
                                                        <div className="text-[9px] text-slate-400 font-medium group-hover/item:text-emerald-600/70">{loc.locality}</div>
                                                    </button>
                                                ))}
                                                {filteredLocations.length === 0 && (
                                                    <div className="p-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                                                        No results found...
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <span
                                        onClick={() => !isReadOnly && setIsEditingLocation(true)}
                                        className={`text-sm text-slate-400 transition-colors ${!isReadOnly ? 'cursor-pointer hover:text-white' : ''}`}
                                    >
                                        {property.address || 'Enter Project Location'}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="text-right pb-1">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-1">Developer</div>
                            <div className="text-2xl font-black text-white tracking-tight leading-tight">
                                {property.developer || 'Aurum Group'}
                            </div>
                        </div>
                    </div>

                    {/* CHANGE COVER BUTTON - Bottom Right Overlay */}
                    {!isReadOnly && (
                        <div className="absolute bottom-6 right-6">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 bg-black/40 hover:bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white/70 hover:text-white transition-all text-[10px] font-bold uppercase tracking-wider border border-white/10"
                            >
                                <Upload size={12} />
                                Change Cover
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <div className="bg-slate-100 min-h-screen">

                {/* THIN HORIZONTAL STRIP - Total Towers, Total Inventory, and SET TOWERS */}
                <div className="bg-white border-b border-slate-200">
                    <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
                        {/* Left: Totals */}
                        {/* Left: Totals */}
                        <div className="flex items-center gap-10">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Total Infrastructure</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-black text-slate-900">{property.towers.length}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Towers</span>
                                </div>
                            </div>
                            <div className="w-px h-8 bg-slate-100"></div>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Asset Inventory</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-black text-slate-900">{totalInventory}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Units</span>
                                </div>
                            </div>
                        </div>

                        {/* Right: SET TOWERS Control */}
                        {!isReadOnly ? (
                            <div className="flex items-center gap-4 bg-slate-50 p-1 rounded-xl border border-slate-200">
                                <span className="text-[10px] uppercase tracking-widest font-black text-slate-400 px-3">Structure Config</span>
                                <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-0.5">
                                    <button
                                        onClick={() => setTowerCount(Math.max(0, property.towers.length - 1))}
                                        className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 rounded text-slate-900 font-black transition-colors disabled:opacity-30"
                                        disabled={property.towers.length === 0}
                                    >
                                        −
                                    </button>
                                    <div className="w-10 text-center text-sm font-black text-slate-900">
                                        {property.towers.length}
                                    </div>
                                    <button
                                        onClick={() => setTowerCount(property.towers.length + 1)}
                                        className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 rounded text-slate-900 font-black transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-lg shadow-lg shadow-slate-900/10">
                                <Building2 size={14} className="text-emerald-400" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Active Infrastructure Blueprint</span>
                            </div>
                        )}
                    </div>
                </div>



                {/* TWO-COLUMN LAYOUT */}
                <div className="max-w-6xl mx-auto px-6 py-6">
                    <div className="grid grid-cols-[1fr_1.2fr] gap-6">
                        {/* LEFT COLUMN */}
                        <div className="space-y-6">
                            {/* TOWERS CONFIGURATION */}
                            <section className="bg-white rounded-lg shadow-sm p-5">
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Building2 size={14} className="text-orange-500" />
                                    Towers Configuration
                                </h3>

                                <div className="space-y-3">
                                <div className="grid grid-cols-1 gap-4">
                                    {property.towers.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
                                            <Building2 size={32} className="text-slate-200 mb-3" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Towers Configured</p>
                                        </div>
                                    ) : (
                                        property.towers.map((tower) => (
                                            <div
                                                key={tower.id}
                                                onClick={() => setActiveTowerId(tower.id)}
                                                className="group relative bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/5 transition-all cursor-pointer overflow-hidden"
                                            >
                                                {/* Background Accent */}
                                                <div className="absolute top-0 right-0 w-24 h-24 -bg-emerald-500/5 rounded-bl-full translate-x-12 -translate-y-12 group-hover:bg-emerald-500/10 transition-colors"></div>

                                                <div className="relative flex items-center gap-5">
                                                    {/* Circular Icon */}
                                                    <div className="w-14 h-14 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors">
                                                        <span className="text-xl font-black text-slate-400 group-hover:text-emerald-600 transition-colors">
                                                            {tower.name.match(/[A-Z0-9]+$/)?.[0] || tower.name.charAt(0)}
                                                        </span>
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="text-base font-black text-slate-900 truncate tracking-tight">{tower.name}</h4>
                                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black rounded uppercase tracking-widest">
                                                                {tower.status || 'Planning'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                                                <Layers size={12} className="text-slate-400" />
                                                                {tower.totalFloors} Floors
                                                            </div>
                                                            <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                                                <LayoutGrid size={12} className="text-slate-400" />
                                                                {tower.units?.length || 0} Assets
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end gap-2">
                                                        <div className="p-2 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                                            <ArrowUpRight size={16} strokeWidth={3} />
                                                        </div>
                                                        {!isReadOnly && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingTowerId(tower.id);
                                                                    setEditingTowerName(tower.name);
                                                                }}
                                                                className="p-1.5 text-slate-300 hover:text-emerald-600 transition-colors opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Pencil size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Progress Bar (Visual only for now) */}
                                                <div className="mt-5 h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 w-2/3 group-hover:bg-emerald-600 transition-all rounded-full"></div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                </div>
                            </section>

                            {/* LOCATION INTELLIGENCE */}
                            <section className="bg-white rounded-lg shadow-sm p-5">
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <MapPin size={14} className="text-blue-500" />
                                    Location Intelligence
                                </h3>

                                <div className="space-y-6">
                                    {(['connectivity', 'schools', 'hospitals'] as const).map((cat) => {
                                        const icons = { connectivity: Navigation, schools: School, hospitals: Hospital };
                                        const labels = { connectivity: 'Connectivity Hub', schools: 'Academic Institutions', hospitals: 'Healthcare Facilities' };
                                        const themeColors = { connectivity: 'blue', schools: 'violet', hospitals: 'rose' };
                                        const CatIcon = icons[cat];
                                        const items = (property.locationIntelligence?.[cat] ?? []) as { name: string; distance: string }[];

                                        return (
                                            <div key={cat} className="group/cat">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`p-1.5 rounded-lg bg-${themeColors[cat]}-50 text-${themeColors[cat]}-500 group-hover/cat:scale-110 transition-transform`}>
                                                            <CatIcon size={14} />
                                                        </div>
                                                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{labels[cat]}</span>
                                                    </div>
                                                    {!isReadOnly && (
                                                        <button
                                                            onClick={() => { setAddingLocType(cat); setNewLocName(''); setNewLocDist(''); }}
                                                            className="text-[10px] font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
                                                        >
                                                            Add Endpoint
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    {items.map((item, idx) => (
                                                        <div key={idx} className="flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl group transition-all">
                                                            <span className="text-xs font-bold text-slate-700">{item.name}</span>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[10px] font-black text-slate-400 px-2 py-0.5 bg-white border border-slate-100 rounded-md">
                                                                    {item.distance}
                                                                </span>
                                                                {!isReadOnly && (
                                                                    <button
                                                                        onClick={() => {
                                                                            const updated = items.filter((_, i) => i !== idx);
                                                                            updateMetadata('locationIntelligence', {
                                                                                ...property.locationIntelligence,
                                                                                [cat]: updated
                                                                            });
                                                                        }}
                                                                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1"
                                                                    >
                                                                        <X size={12} strokeWidth={3} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {addingLocType === cat && (
                                                        <div className="p-4 bg-white border border-emerald-500/20 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200">
                                                            <div className="grid grid-cols-1 gap-3">
                                                                <input
                                                                    autoFocus
                                                                    type="text"
                                                                    placeholder="Endpoint Name (e.g., Terminal 2)"
                                                                    value={newLocName}
                                                                    onChange={e => setNewLocName(e.target.value)}
                                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-emerald-500"
                                                                />
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Distance (e.g., 2.4 km)"
                                                                        value={newLocDist}
                                                                        onChange={e => setNewLocDist(e.target.value)}
                                                                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-emerald-500"
                                                                    />
                                                                    <button
                                                                        onClick={() => {
                                                                            if (!newLocName.trim()) return;
                                                                            updateMetadata('locationIntelligence', {
                                                                                ...property.locationIntelligence,
                                                                                [cat]: [...items, { name: newLocName.trim(), distance: newLocDist.trim() || '–' }]
                                                                            });
                                                                            setAddingLocType(null);
                                                                        }}
                                                                        className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-black transition-colors"
                                                                    >
                                                                        Secure
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {items.length === 0 && addingLocType !== cat && (
                                                        <div className="py-8 text-center border border-dashed border-slate-100 rounded-xl">
                                                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Intel Pending</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="space-y-5">
                            {/* PROJECT BRIEF */}
                            <section className="bg-white rounded-lg shadow-sm p-5">
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                                    Project Brief
                                </h3>
                                <textarea
                                    value={property.projectBrief || ''}
                                    onChange={(e) => updateMetadata('projectBrief', e.target.value)}
                                    disabled={isReadOnly}
                                    rows={4}
                                    placeholder="A premium development featuring world-class amenities and sustainable design architecture defined by excellence."
                                    className="w-full text-sm text-slate-600 leading-relaxed border-none focus:outline-none resize-none disabled:bg-white p-0"
                                />
                            </section>

                            {/* KEY AMENITIES */}
                            <section className="bg-white rounded-lg shadow-sm p-5">
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                                    Key Amenities
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {property.amenities && property.amenities.length > 0 ? (
                                        property.amenities.map((amenity, idx) => (
                                            <span key={idx} className={`px-3 py-1.5 border border-slate-200 text-slate-600 text-xs rounded-full transition-colors ${!isReadOnly ? 'hover:border-emerald-400 cursor-pointer' : ''}`}>
                                                {typeof amenity === 'string' ? amenity : (amenity as any).name}
                                            </span>
                                        ))
                                    ) : (
                                        <>
                                            <span className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs rounded-full">Clubhouse 🏛️</span>
                                            <span className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs rounded-full">Swimming Pool 🏊</span>
                                            <span className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs rounded-full">Gymnasium 💪</span>
                                            <span className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs rounded-full">Kids</span>
                                        </>
                                    )}
                                    {isAddingAmenity ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                autoFocus
                                                type="text"
                                                value={newAmenityName}
                                                onChange={(e) => setNewAmenityName(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddAmenity()}
                                                onBlur={() => !newAmenityName && setIsAddingAmenity(false)}
                                                placeholder="Amenity name..."
                                                className="px-3 py-1.5 border border-emerald-400 bg-white text-xs rounded-full focus:outline-none w-32"
                                            />
                                            <button
                                                onClick={handleAddAmenity}
                                                className="text-[10px] font-bold text-emerald-600 uppercase"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    ) : (
                                        !isReadOnly && (
                                            <button
                                                onClick={() => setIsAddingAmenity(true)}
                                                className="px-3 py-1.5 border border-dashed border-slate-300 text-slate-400 hover:text-emerald-600 hover:border-emerald-400 text-xs rounded-full transition-colors"
                                            >
                                                + Add
                                            </button>
                                        )
                                    )}
                                </div>
                            </section>

                            {/* DOCUMENT UPLOAD / ATTACHMENTS */}
                            <PropertyDocuments
                                documents={property.documents || []}
                                onAdd={addDocument}
                                onDelete={deleteDocument}
                                onUpdate={updateDocument}
                                isReadOnly={isReadOnly}
                            />

                            {/* LEGAL & COMPLIANCE */}
                            <section className="bg-white rounded-lg shadow-sm p-5">
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Shield size={14} className="text-slate-500" />
                                    Legal & Compliance
                                </h3>
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">RERA Number</label>
                                    <input
                                        type="text"
                                        value={property.legalCompliance?.reraNumber || ''}
                                        onChange={(e) => updateMetadata('legalCompliance', { ...property.legalCompliance, reraNumber: e.target.value })}
                                        disabled={isReadOnly}
                                        placeholder="Enter RERA No."
                                        className="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded text-sm disabled:bg-slate-50 focus:outline-none focus:border-emerald-400"
                                    />
                                    <div className="mt-3 grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Authority</label>
                                            <input
                                                type="text"
                                                value={property.legalCompliance?.authority || ''}
                                                onChange={(e) => updateMetadata('legalCompliance', { ...property.legalCompliance, authority: e.target.value })}
                                                disabled={isReadOnly}
                                                placeholder="e.g. MahaRERA"
                                                className="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded text-sm disabled:bg-slate-50 focus:outline-none focus:border-emerald-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Status</label>
                                            <select
                                                value={property.legalCompliance?.status || ''}
                                                onChange={(e) => updateMetadata('legalCompliance', { ...property.legalCompliance, status: e.target.value })}
                                                disabled={isReadOnly}
                                                className="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded text-sm disabled:bg-slate-50 focus:outline-none focus:border-emerald-400 bg-white"
                                            >
                                                <option value="">Select Status</option>
                                                <option value="Approved">Approved</option>
                                                <option value="Pending">Pending</option>
                                                <option value="In Review">In Review</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Approval Date</label>
                                        <input
                                            type="date"
                                            value={property.legalCompliance?.expiryDate || ''}
                                            onChange={(e) => updateMetadata('legalCompliance', { ...property.legalCompliance, expiryDate: e.target.value })}
                                            disabled={isReadOnly}
                                            className="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded text-sm disabled:bg-slate-50 focus:outline-none focus:border-emerald-400"
                                        />
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODALS */}
            <UnsavedChangesModal
                isOpen={showUnsavedModal}
                onSave={() => handleSaveAction(true)}
                onDiscard={handleDiscard}
                onCancel={() => setShowUnsavedModal(false)}
            />

            {showDeleteModal && onDelete && property.id && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Delete Property</h3>
                        <p className="text-slate-600 mb-6">
                            Are you sure you want to delete this property? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAction}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
            />
        </div>
    );
}

