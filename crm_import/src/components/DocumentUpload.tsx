'use client';

import { useState } from 'react';
import { PropertyDocument, DocumentCategory } from '@/types/property';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';

interface DocumentUploadProps {
    propertyId: string;
    towerId?: string;
    unitId?: string;
    onUploadComplete?: (document: PropertyDocument) => void;
}

export default function DocumentUpload({ propertyId, towerId, unitId, onUploadComplete }: DocumentUploadProps) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [category, setCategory] = useState<DocumentCategory>(DocumentCategory.BROCHURE);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
    const [uploadStatus, setUploadStatus] = useState<Record<string, 'pending' | 'uploading' | 'success' | 'error'>>({});

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        setSelectedFiles(prev => [...prev, ...files]);

        // Initialize status for new files
        const newStatus: Record<string, 'pending'> = {};
        files.forEach(file => {
            newStatus[file.name] = 'pending';
        });
        setUploadStatus(prev => ({ ...prev, ...newStatus }));
    };

    const removeFile = (fileName: string) => {
        setSelectedFiles(prev => prev.filter(f => f.name !== fileName));
        setUploadStatus(prev => {
            const newStatus = { ...prev };
            delete newStatus[fileName];
            return newStatus;
        });
        setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileName];
            return newProgress;
        });
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;

        setUploading(true);

        for (const file of selectedFiles) {
            try {
                setUploadStatus(prev => ({ ...prev, [file.name]: 'uploading' }));

                const formData = new FormData();
                formData.append('file', file);
                formData.append('category', category);
                formData.append('propertyId', propertyId);
                if (towerId) formData.append('towerId', towerId);
                if (unitId) formData.append('unitId', unitId);

                // Simulate upload progress (in real implementation, use XMLHttpRequest for progress)
                const progressInterval = setInterval(() => {
                    setUploadProgress(prev => {
                        const current = prev[file.name] || 0;
                        if (current >= 90) {
                            clearInterval(progressInterval);
                            return prev;
                        }
                        return { ...prev, [file.name]: current + 10 };
                    });
                }, 200);

                const response = await fetch(`/api/properties/${propertyId}/documents`, {
                    method: 'POST',
                    body: formData,
                });

                clearInterval(progressInterval);
                setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

                const data = await response.json();

                if (data.success) {
                    setUploadStatus(prev => ({ ...prev, [file.name]: 'success' }));
                    if (onUploadComplete) {
                        onUploadComplete(data.data);
                    }
                } else {
                    setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }));
                }
            } catch (error) {
                console.error('Upload error:', error);
                setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }));
            }
        }

        setUploading(false);

        // Clear successful uploads after a delay
        setTimeout(() => {
            setSelectedFiles(prev => prev.filter(f => uploadStatus[f.name] !== 'success'));
        }, 2000);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'error':
                return <AlertCircle className="w-5 h-5 text-red-600" />;
            case 'uploading':
                return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>;
            default:
                return <File className="w-5 h-5 text-gray-400" />;
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Documents</h3>

            {/* Category Selection */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Category
                </label>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={uploading}
                >
                    {Object.values(DocumentCategory).map(cat => (
                        <option key={cat} value={cat}>
                            {cat.replace('_', ' ')}
                        </option>
                    ))}
                </select>
            </div>

            {/* File Drop Zone */}
            <div className="mb-4">
                <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                        </p>
                    </div>
                    <input
                        id="file-upload"
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={uploading}
                    />
                </label>
            </div>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
                <div className="mb-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Selected Files ({selectedFiles.length})</h4>
                    {selectedFiles.map((file) => {
                        const status = uploadStatus[file.name] || 'pending';
                        const progress = uploadProgress[file.name] || 0;

                        return (
                            <div
                                key={file.name}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    {getStatusIcon(status)}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 truncate">
                                            {file.name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {formatFileSize(file.size)}
                                        </div>
                                        {status === 'uploading' && (
                                            <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                                                <div
                                                    className="bg-blue-600 h-1.5 rounded-full transition-all"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {status === 'pending' && (
                                    <button
                                        onClick={() => removeFile(file.name)}
                                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                                        disabled={uploading}
                                    >
                                        <X className="w-4 h-4 text-gray-500" />
                                    </button>
                                )}
                                {status === 'success' && (
                                    <span className="text-xs text-green-600 font-medium">Uploaded</span>
                                )}
                                {status === 'error' && (
                                    <span className="text-xs text-red-600 font-medium">Failed</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Upload Button */}
            {selectedFiles.length > 0 && (
                <button
                    onClick={handleUpload}
                    disabled={uploading || selectedFiles.every(f => uploadStatus[f.name] === 'success')}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                    {uploading ? 'Uploading...' : `Upload ${selectedFiles.filter(f => uploadStatus[f.name] !== 'success').length} File(s)`}
                </button>
            )}
        </div>
    );
}
