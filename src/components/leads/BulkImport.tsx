"use client";

import { useState } from "react";
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertCircle, ArrowRight, Loader2 } from "lucide-react";

export function BulkImport() {
    const [step, setStep] = useState<'UPLOAD' | 'MAPPING' | 'PROCESSING' | 'DONE'>('UPLOAD');
    const [file, setFile] = useState<File | null>(null);
    const [progress, setProgress] = useState(0);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStep('MAPPING');
        }
    };

    const processImport = () => {
        setStep('PROCESSING');
        // Simulate processing
        let p = 0;
        const interval = setInterval(() => {
            p += 10;
            setProgress(p);
            if (p >= 100) {
                clearInterval(interval);
                setStep('DONE');
            }
        }, 300);
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-2xl mx-auto">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileSpreadsheet className="text-emerald-600" /> Bulk Lead Import
            </h2>

            {step === 'UPLOAD' && (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center hover:bg-slate-50 transition-colors">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <UploadCloud size={32} />
                    </div>
                    <h3 className="font-bold text-slate-700">Click to Upload CSV / Excel</h3>
                    <p className="text-sm text-slate-500 mb-6">Supports .csv, .xlsx (Max 5MB)</p>
                    <input type="file" className="hidden" id="csv-upload" accept=".csv,.xlsx" onChange={handleFile} />
                    <label htmlFor="csv-upload" className="cursor-pointer px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800">
                        Select File
                    </label>
                </div>
            )}

            {step === 'MAPPING' && file && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <FileSpreadsheet size={20} className="text-emerald-600" />
                        <span className="font-medium text-sm flex-1 truncate">{file.name}</span>
                        <button onClick={() => setStep('UPLOAD')} className="text-xs text-red-500 hover:underline">Change</button>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase">Column Mapping</h4>
                        {[
                            { system: 'Name', csv: 'Full Name' },
                            { system: 'Phone', csv: 'Mobile No' },
                            { system: 'Email', csv: 'Email Addr' },
                            { system: 'Budget', csv: 'Budget Range' }
                        ].map((field, i) => (
                            <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-slate-100">
                                <span className="font-medium text-slate-700">{field.system}</span>
                                <ArrowRight size={14} className="text-slate-300" />
                                <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs font-mono">{field.csv}</span>
                            </div>
                        ))}
                    </div>

                    <button onClick={processImport} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2">
                        Start Import
                    </button>
                </div>
            )}

            {step === 'PROCESSING' && (
                <div className="text-center py-10">
                    <Loader2 size={48} className="text-emerald-500 animate-spin mx-auto mb-4" />
                    <h3 className="font-bold text-slate-800">Importing Leads...</h3>
                    <p className="text-sm text-slate-500 mb-4">Analyzing duplicates & enriching data</p>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            )}

            {step === 'DONE' && (
                <div className="text-center py-8 animate-in zoom-in">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                        <CheckCircle size={32} />
                    </div>
                    <h3 className="font-bold text-slate-800 text-xl">Import Complete</h3>
                    <p className="text-slate-500 mb-6">Successfully added 142 leads.</p>

                    <div className="bg-amber-50 rounded-lg p-4 text-left text-sm text-amber-800 border border-amber-100 mb-6">
                        <div className="font-bold flex items-center gap-2 mb-1">
                            <AlertCircle size={14} /> Attention
                        </div>
                        <p>18 duplicates were skipped.</p>
                        <p>5 leads had invalid phone numbers.</p>
                    </div>

                    <button onClick={() => setStep('UPLOAD')} className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg">
                        Import More
                    </button>
                </div>
            )}
        </div>
    );
}
