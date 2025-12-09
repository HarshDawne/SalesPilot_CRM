'use client';

import { useState } from 'react';
import DocumentUpload from './DocumentUpload';
import DocumentList from './DocumentList';
import { FileText, Upload as UploadIcon } from 'lucide-react';

interface DocumentManagerProps {
  propertyId: string;
  towerId?: string;
  unitId?: string;
}

export default function DocumentManager({ propertyId, towerId, unitId }: DocumentManagerProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'upload'>('list');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadComplete = () => {
    // Refresh the document list
    setRefreshKey(prev => prev + 1);
    // Switch to list view
    setActiveTab('list');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Document Management</h2>
          <p className="text-sm text-gray-600 mt-1">Upload and manage property documents</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('list')}
            className={`
              flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'list'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <FileText className="w-4 h-4" />
            Documents
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`
              flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'upload'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <UploadIcon className="w-4 h-4" />
            Upload
          </button>
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'list' && (
          <DocumentList
            key={refreshKey}
            propertyId={propertyId}
            towerId={towerId}
            unitId={unitId}
          />
        )}
        {activeTab === 'upload' && (
          <DocumentUpload
            propertyId={propertyId}
            towerId={towerId}
            unitId={unitId}
            onUploadComplete={handleUploadComplete}
          />
        )}
      </div>
    </div>
  );
}
