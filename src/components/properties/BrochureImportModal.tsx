'use client';

import { useState } from 'react';
import { Upload, FileText, Sparkles, AlertCircle, CheckCircle2, X, Loader2 } from 'lucide-react';
import { BrochureImportResponse } from '@/types/brochure-extraction';

interface BrochureImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (extractionId: string) => void;
}

type UploadState = 'idle' | 'uploading' | 'extracting' | 'success' | 'error';

export default function BrochureImportModal({ isOpen, onClose, onSuccess }: BrochureImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [extractedFieldsCount, setExtractedFieldsCount] = useState(0);

  if (!isOpen) return null;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadState('uploading');
    setError(null);
    setWarnings([]);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Simulate upload delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUploadState('extracting');

      const response = await fetch('/api/properties/import', {
        method: 'POST',
        body: formData,
      });

      const result: BrochureImportResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to process brochure');
      }

      // Count extracted fields for UI feedback
      const fieldsCount = result.data ? Object.keys(result.data).filter(
        key => result.data![key as keyof typeof result.data] !== undefined
      ).length : 0;
      
      setExtractedFieldsCount(fieldsCount);
      setWarnings(result.warnings || []);
      setUploadState('success');

      // Navigate to form after showing success state
      setTimeout(() => {
        if (result.extractionId) {
          onSuccess(result.extractionId);
        }
      }, 1500);

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'An unexpected error occurred');
      setUploadState('error');
    }
  };

  const resetState = () => {
    setSelectedFile(null);
    setUploadState('idle');
    setError(null);
    setWarnings([]);
    setExtractedFieldsCount(0);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
            disabled={uploadState === 'uploading' || uploadState === 'extracting'}
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Import from Brochure</h2>
              <p className="text-sm text-indigo-100 mt-1">AI-powered property data extraction</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Idle State - File Upload */}
          {uploadState === 'idle' && (
            <>
              <label
                htmlFor="brochure-upload"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/50 transition-all"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-12 h-12 text-slate-400 mb-3" />
                  <p className="text-sm text-slate-600 font-medium">
                    <span className="text-indigo-600">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    PDF brochures only (Max 10MB)
                  </p>
                  {selectedFile && (
                    <div className="mt-4 flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-lg">
                      <FileText className="w-5 h-5 text-indigo-600" />
                      <div className="text-left">
                        <div className="text-sm font-medium text-slate-900">{selectedFile.name}</div>
                        <div className="text-xs text-slate-500">{formatFileSize(selectedFile.size)}</div>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  id="brochure-upload"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>

              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!selectedFile}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200 disabled:shadow-none flex items-center justify-center gap-2"
              >
                <Sparkles size={18} />
                Extract Property Details with AI
              </button>
            </>
          )}

          {/* Uploading State */}
          {uploadState === 'uploading' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <Upload className="w-6 h-6 text-indigo-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="mt-6 text-slate-700 font-medium">Uploading brochure...</p>
              <p className="text-sm text-slate-500 mt-1">Please wait</p>
            </div>
          )}

          {/* Extracting State */}
          {uploadState === 'extracting' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                <Sparkles className="w-6 h-6 text-purple-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <p className="mt-6 text-slate-700 font-medium">AI is reading your brochure...</p>
              <p className="text-sm text-slate-500 mt-1">Extracting property details</p>
              <div className="mt-4 flex gap-2">
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}

          {/* Success State */}
          {uploadState === 'success' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-slate-900 font-bold text-lg">Extraction Successful!</p>
              <p className="text-slate-600 mt-2">
                Found <span className="font-semibold text-indigo-600">{extractedFieldsCount} fields</span> from your brochure
              </p>
              
              {warnings.length > 0 && (
                <div className="mt-4 w-full space-y-2">
                  {warnings.map((warning, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-sm text-slate-500 mt-4">Redirecting to form...</p>
              <div className="w-32 h-1 bg-slate-200 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-indigo-600 animate-[progress_1.5s_ease-in-out]" style={{
                  animation: 'progress 1.5s ease-in-out forwards',
                }}></div>
              </div>
            </div>
          )}

          {/* Error State */}
          {uploadState === 'error' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-slate-900 font-bold text-lg">Extraction Failed</p>
              <p className="text-slate-600 mt-2 text-center px-4">{error}</p>
              
              <div className="mt-6 flex gap-3">
                <button
                  onClick={resetState}
                  className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => {
                    handleClose();
                    window.location.href = '/properties/new';
                  }}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Fill Manually
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
