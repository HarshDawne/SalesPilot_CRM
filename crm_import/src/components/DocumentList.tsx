'use client';

import { useState, useEffect } from 'react';
import { PropertyDocument, DocumentCategory } from '@/types/property';
import { FileText, Download, Trash2, Eye, Search, Filter } from 'lucide-react';

interface DocumentListProps {
  propertyId: string;
  towerId?: string;
  unitId?: string;
}

export default function DocumentList({ propertyId, towerId, unitId }: DocumentListProps) {
  const [documents, setDocuments] = useState<PropertyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<DocumentCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    fetchDocuments();
  }, [propertyId, towerId, unitId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (towerId) params.append('towerId', towerId);
      if (unitId) params.append('unitId', unitId);

      const response = await fetch(`/api/properties/${propertyId}/documents?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setDocuments(data.data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`/api/properties/${propertyId}/documents/${documentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setDocuments(prev => prev.filter(d => d.id !== documentId));
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const handleDownload = (document: PropertyDocument) => {
    // In real implementation, this would download the file
    window.open(document.fileUrl, '_blank');
  };

  const getCategoryColor = (category: DocumentCategory) => {
    switch (category) {
      case 'BROCHURE':
        return 'bg-blue-100 text-blue-800';
      case 'PRICE_SHEET':
        return 'bg-green-100 text-green-800';
      case 'FLOOR_PLAN':
        return 'bg-purple-100 text-purple-800';
      case 'RERA_CERTIFICATE':
        return 'bg-orange-100 text-orange-800';
      case 'LAYOUT':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Filter documents
  let filteredDocs = documents;
  if (filterCategory !== 'ALL') {
    filteredDocs = filteredDocs.filter(d => d.category === filterCategory);
  }
  if (searchQuery) {
    filteredDocs = filteredDocs.filter(d =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Group by category
  const groupedDocs = filteredDocs.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<DocumentCategory, PropertyDocument[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as DocumentCategory | 'ALL')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Categories</option>
            {Object.values(DocumentCategory).map(cat => (
              <option key={cat} value={cat}>
                {cat.replace('_', ' ')}
              </option>
            ))}
          </select>

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            {filteredDocs.length} document(s)
          </div>
        </div>
      </div>

      {/* Documents List */}
      {filteredDocs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No documents found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedDocs).map(([category, docs]) => (
            <div key={category} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {category.replace('_', ' ')}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(category as DocumentCategory)}`}>
                    {docs.length}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {doc.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {doc.fileName}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span>{formatFileSize(doc.fileSize)}</span>
                            <span>•</span>
                            <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>Uploaded by {doc.uploadedBy}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
