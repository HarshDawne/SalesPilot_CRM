"use client";

import React, { useState } from 'react';
import { 
    FileText, 
    Upload, 
    Trash2, 
    Download, 
    Eye, 
    MoreVertical, 
    Plus,
    File,
    AlertCircle
} from 'lucide-react';
import { BlueprintDocument } from '@/lib/types/blueprint';

interface PropertyDocumentsProps {
    documents: BlueprintDocument[];
    isReadOnly: boolean;
    onAdd: (doc: Omit<BlueprintDocument, 'id'>) => void;
    onUpdate: (id: string, updates: Partial<BlueprintDocument>) => void;
    onDelete: (id: string) => void;
}

export function PropertyDocuments({ 
    documents = [], 
    isReadOnly, 
    onAdd, 
    onUpdate, 
    onDelete 
}: PropertyDocumentsProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Mock upload logic
        setIsUploading(true);
        setTimeout(() => {
            const extension = file.name.split('.').pop()?.toUpperCase();
            let type: 'PDF' | 'DOC' | 'IMG' = 'PDF';
            if (['JPG', 'PNG', 'JPEG'].includes(extension || '')) type = 'IMG';
            else if (['DOC', 'DOCX'].includes(extension || '')) type = 'DOC';

            onAdd({
                name: file.name.split('.')[0],
                type,
                docType: 'Other',
                url: URL.createObjectURL(file) // Mock URL
            });
            setIsUploading(false);
            e.target.value = ''; // Reset input
        }, 1000);
    };

    const documentCategories = [
        'Brochure',
        'Floor Plan',
        'Legal Approval',
        'Price Sheet',
        'Other'
    ];

    const getFileIcon = (type: string) => {
        switch (type) {
            case 'PDF': return <FileText className="text-red-500" size={20} />;
            case 'IMG': return <File className="text-blue-500" size={20} />;
            case 'DOC': return <FileText className="text-indigo-500" size={20} />;
            default: return <File className="text-slate-400" size={20} />;
        }
    };

    return (
        <section className="bg-white rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileText className="text-copper" size={18} />
                    <h3 className="font-bold text-slate-900">Property Documents</h3>
                </div>
                {!isReadOnly && (
                    <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1 bg-copper hover:bg-copper-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm shadow-copper/20">
                        <Plus size={12} /> Add Document
                        <input 
                            type="file" 
                            className="hidden" 
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx,.jpg,.png,.jpeg"
                        />
                    </label>
                )}
            </div>

            <div className="p-6">
                {documents.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-500 text-xs font-medium italic">No documents added</p>
                        {!isReadOnly && (
                            <button 
                                onClick={() => document.getElementById('prop-doc-upload')?.click()}
                                className="mt-4 text-copper hover:text-copper-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1 mx-auto"
                            >
                                <Plus size={14} /> Add First Document
                            </button>
                        )}
                        <input 
                            id="prop-doc-upload"
                            type="file" 
                            className="hidden" 
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx,.jpg,.png,.jpeg"
                        />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {documents.map((doc) => (
                            <div key={doc.id} className="group relative flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-copper/30 hover:bg-copper/5 transition-all">
                                <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                                    {getFileIcon(doc.type)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    {isReadOnly ? (
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 truncate text-sm">{doc.name}</span>
                                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                                {doc.docType || 'Other'} • {doc.type}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-1">
                                            <input 
                                                type="text"
                                                value={doc.name}
                                                onChange={(e) => onUpdate(doc.id, { name: e.target.value })}
                                                className="bg-transparent border-none p-0 font-bold text-slate-900 text-sm focus:ring-0 w-full"
                                                placeholder="Document Name"
                                            />
                                            <select
                                                value={doc.docType || 'Other'}
                                                onChange={(e) => onUpdate(doc.id, { docType: e.target.value })}
                                                className="bg-transparent border-none p-0 text-[10px] uppercase font-bold text-slate-400 tracking-wider focus:ring-0 cursor-pointer w-fit"
                                            >
                                                {documentCategories.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-1">
                                    <a 
                                        href={doc.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-2 text-slate-400 hover:text-copper transition-colors"
                                        title="View/Download"
                                    >
                                        <Eye size={16} />
                                    </a>
                                    {!isReadOnly && (
                                        <button 
                                            onClick={() => setShowDeleteConfirm(doc.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>

                                {/* Confirmation Overlay */}
                                {showDeleteConfirm === doc.id && (
                                    <div className="absolute inset-0 z-10 bg-white/95 backdrop-blur-sm rounded-xl flex items-center justify-between px-6 border border-red-200">
                                        <div className="flex items-center gap-2 text-red-600">
                                            <AlertCircle size={16} />
                                            <span className="text-xs font-bold">Delete this document?</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setShowDeleteConfirm(null)}
                                                className="px-3 py-1 text-[10px] font-bold uppercase text-slate-500 hover:text-slate-700"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    onDelete(doc.id);
                                                    setShowDeleteConfirm(null);
                                                }}
                                                className="px-3 py-1 bg-red-600 text-white text-[10px] font-bold uppercase rounded shadow-sm hover:bg-red-700"
                                            >
                                                Confirm
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isUploading && (
                <div className="px-6 py-2 bg-slate-900 flex items-center justify-center gap-2">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Uploading...</span>
                </div>
            )}
        </section>
    );
}
