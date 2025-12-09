'use client';

import React from 'react';
import { FileText, Download, Eye, Calendar, User } from 'lucide-react';
import Button from '../ui/Button';
import { MockDocument } from '@/app/properties/mock-data';

interface DocumentListProps {
    documents: MockDocument[];
    onPreview?: (doc: MockDocument) => void;
    onDownload?: (doc: MockDocument) => void;
}

export default function DocumentList({ documents, onPreview, onDownload }: DocumentListProps) {
    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const getCategoryIcon = (category: string) => {
        return <FileText className="h-5 w-5" />;
    };

    const groupedDocs = documents.reduce((acc, doc) => {
        if (!acc[doc.category]) {
            acc[doc.category] = [];
        }
        acc[doc.category].push(doc);
        return acc;
    }, {} as Record<string, MockDocument[]>);

    if (documents.length === 0) {
        return (
            <div className="py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600 font-inter">No documents available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {Object.entries(groupedDocs).map(([category, docs]) => (
                <div key={category}>
                    <h3 className="mb-3 text-sm font-semibold text-gray-900 uppercase tracking-wide font-inter">
                        {category}
                    </h3>
                    <div className="space-y-3">
                        {docs.map((doc) => (
                            <div
                                key={doc.id}
                                className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
                            >
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-primary-600">
                                    {getCategoryIcon(doc.category)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-gray-900 font-inter truncate">
                                        {doc.name}
                                    </h4>
                                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-600 font-inter">
                                        <span className="flex items-center gap-1">
                                            <FileText className="h-3 w-3" />
                                            {formatFileSize(doc.fileSize)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {formatDate(doc.uploadedAt)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {doc.uploadedBy}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-shrink-0 gap-2">
                                    {onPreview && (
                                        <button
                                            onClick={() => onPreview(doc)}
                                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-primary-600"
                                            title="Preview"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                    )}
                                    {onDownload && (
                                        <button
                                            onClick={() => onDownload(doc)}
                                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-primary-600"
                                            title="Download"
                                        >
                                            <Download className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
