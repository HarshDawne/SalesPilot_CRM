import React, { useState } from 'react';
import { BrochureParseResult } from '@/types/property';
import { propertiesAPI } from '@/lib/api/properties';
import { Upload, CheckCircle2, AlertCircle, Loader2, Sparkles, AlertTriangle } from 'lucide-react';

interface BrochureImporterProps {
    onParsed: (result: any) => void;
    onError: (error: string) => void;
}

type ImportState = 'idle' | 'uploading' | 'parsing' | 'parsed' | 'error';

export function BrochureImporter({ onParsed, onError }: BrochureImporterProps) {
    const [state, setState] = useState<ImportState>('idle');
    const [file, setFile] = useState<File | null>(null);
    const [result, setResult] = useState<BrochureParseResult | null>(null);
    const [error, setError] = useState<string>('');
    const [warning, setWarning] = useState<string>('');

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // Lenient file type check
        setFile(selectedFile);
        await uploadAndParse(selectedFile);
    };

    const uploadAndParse = async (file: File) => {
        try {
            setState('uploading');
            setError('');
            setWarning('');

            // Simulate upload progress
            await new Promise(resolve => setTimeout(resolve, 500));

            setState('parsing');
            const parseResult = await propertiesAPI.importBrochure(file);

            // Logic: success=true means we moved forward. success=false means hard stop?
            // User requested: "NEVER throw 'unsupported' unless file is truly unreadable"
            // Our API now returns success:false only for catastrophic failure.

            if (!parseResult.success && !parseResult.data) {
                throw new Error(parseResult.warning || 'Failed to parse');
            }

            setResult(parseResult);
            setState('parsed');

            // Handle warnings (partial data)
            if (parseResult.warning) {
                setWarning(parseResult.warning);
            }

            // Pass the whole result up
            onParsed(parseResult);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to parse brochure';
            setError(errorMsg);
            setState('error');
            onError(errorMsg);
        }
    };

    const reset = () => {
        setState('idle');
        setFile(null);
        setResult(null);
        setError('');
        setWarning('');
    };

    return (
        <div className="filter-panel">
            <h3 className="text-lg font-bold text-charcoal mb-3 flex items-center gap-2">
                <Sparkles size={20} className="text-copper" />
                AI Brochure Import
            </h3>
            <p className="text-sm text-muted mb-4">
                Upload a project brochure (PDF/DOCX) - we'll extract details using AI.
            </p>

            {/* Idle State - Upload */}
            {state === 'idle' && (
                <label className="block cursor-pointer">
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-copper hover:bg-slate-50 transition-colors">
                        <Upload className="w-12 h-12 text-muted mx-auto mb-3" />
                        <p className="text-sm font-medium text-charcoal mb-1">Click to upload or drag and drop</p>
                        <p className="text-xs text-muted">Supports PDF and Word Documents</p>
                    </div>
                    <input
                        type="file"
                        // Accept wide range types to be safe
                        accept=".pdf,.docx,.doc,.txt"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </label>
            )}

            {/* Uploading State */}
            {state === 'uploading' && (
                <div className="text-center py-8">
                    <Loader2 className="w-12 h-12 text-copper animate-spin mx-auto mb-3" />
                    <p className="text-sm font-medium text-charcoal">Uploading {file?.name}...</p>
                </div>
            )}

            {/* Parsing State */}
            {state === 'parsing' && (
                <div className="text-center py-8">
                    <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-3" />
                    <p className="text-sm font-medium text-charcoal mb-1">Analyzing with AI...</p>
                    <p className="text-xs text-muted">Identifying project details, amenities, and pricing</p>
                </div>
            )}

            {/* Parsed State */}
            {state === 'parsed' && result && (
                <div>
                    <div className="flex items-start gap-2 mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-emerald-900">Analysis Complete</p>
                            {warning ? (
                                <p className="text-xs text-orange-700 mt-1 flex items-center gap-1">
                                    <AlertTriangle size={12} /> {warning}
                                </p>
                            ) : (
                                <p className="text-xs text-emerald-700 mt-1">
                                    High confidence extraction. Please verify details.
                                </p>
                            )}
                        </div>
                    </div>

                    {result.data?.structured && (
                        <div className="space-y-2 mb-4">
                            <p className="text-sm font-bold text-charcoal">Pre-filled Fields:</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                {Object.entries(result.data.structured).map(([key, value]) => {
                                    if (!value) return null;
                                    return (
                                        <div key={key}>
                                            <span className="text-muted capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                            <span className="text-charcoal font-medium truncate block" title={String(value)}>
                                                {Array.isArray(value) ? `${value.length} items` : String(value)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button onClick={reset} className="btn-secondary-charcoal flex-1">
                            Upload Different File
                        </button>
                    </div>
                </div>
            )}

            {/* Error State */}
            {state === 'error' && (
                <div>
                    <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <p className="text-sm font-medium text-red-900">{error}</p>
                    </div>
                    <button onClick={reset} className="btn-secondary-charcoal w-full">
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
}
