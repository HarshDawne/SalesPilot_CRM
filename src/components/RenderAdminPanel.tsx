'use client';

import { useState, useEffect } from 'react';
import { RenderRequest, RenderStatus, Render3D } from '@/types/render';
import { Upload, Check, Clock, AlertCircle, Eye, Download, Trash2 } from 'lucide-react';

export default function RenderAdminPanel() {
  const [requests, setRequests] = useState<RenderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<RenderStatus | 'ALL'>('ALL');
  const [selectedRequest, setSelectedRequest] = useState<RenderRequest | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/renders/admin');
      const data = await response.json();
      if (data.success) {
        setRequests(data.data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (requestId: string, status: RenderStatus) => {
    try {
      const response = await fetch(`/api/renders/admin/${requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchRequests();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleFileUpload = async (requestId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('requestId', requestId);

    try {
      const response = await fetch(`/api/renders/admin/${requestId}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        fetchRequests();
        alert('Render uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading render:', error);
    }
  };

  const getStatusColor = (status: RenderStatus) => {
    switch (status) {
      case 'REQUESTED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'READY':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'DELIVERED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: RenderStatus) => {
    switch (status) {
      case 'REQUESTED':
        return <AlertCircle className="w-4 h-4" />;
      case 'IN_PROGRESS':
        return <Clock className="w-4 h-4" />;
      case 'READY':
        return <Check className="w-4 h-4" />;
      case 'DELIVERED':
        return <Check className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredRequests = filterStatus === 'ALL' 
    ? requests 
    : requests.filter(r => r.status === filterStatus);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">3D Render Admin Panel</h1>
          <p className="text-sm text-gray-600 mt-1">Manage render requests and uploads</p>
        </div>
        <button
          onClick={fetchRequests}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Requested', status: 'REQUESTED', color: 'yellow' },
          { label: 'In Progress', status: 'IN_PROGRESS', color: 'blue' },
          { label: 'Ready', status: 'READY', color: 'green' },
          { label: 'Delivered', status: 'DELIVERED', color: 'gray' },
        ].map((stat) => {
          const count = requests.filter(r => r.status === stat.status).length;
          return (
            <div
              key={stat.status}
              className={`bg-${stat.color}-50 border border-${stat.color}-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => setFilterStatus(stat.status as RenderStatus)}
            >
              <div className={`text-2xl font-bold text-${stat.color}-700`}>{count}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as RenderStatus | 'ALL')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Requests ({requests.length})</option>
          <option value="REQUESTED">Requested</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="READY">Ready</option>
          <option value="DELIVERED">Delivered</option>
        </select>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-600">No requests found</p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {request.renderType.replace('_', ' ')} Render
                    </h3>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      {request.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      request.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                      request.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                      request.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {request.priority}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Requested by: <span className="font-medium">{request.requestedByName}</span></div>
                    <div>Property ID: <span className="font-medium">{request.propertyId}</span></div>
                    {request.unitId && <div>Unit ID: <span className="font-medium">{request.unitId}</span></div>}
                    <div>Requested: {new Date(request.requestedAt).toLocaleString()}</div>
                  </div>
                </div>

                {/* Status Actions */}
                <div className="flex flex-col gap-2">
                  {request.status === 'REQUESTED' && (
                    <button
                      onClick={() => updateStatus(request.id, 'IN_PROGRESS')}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Start Working
                    </button>
                  )}
                  {request.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => updateStatus(request.id, 'READY')}
                      className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Mark as Ready
                    </button>
                  )}
                  {request.status === 'READY' && (
                    <button
                      onClick={() => updateStatus(request.id, 'DELIVERED')}
                      className="px-3 py-1.5 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                    >
                      Mark Delivered
                    </button>
                  )}
                </div>
              </div>

              {/* Description */}
              {request.description && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs font-medium text-gray-700 mb-1">Description:</div>
                  <div className="text-sm text-gray-600">{request.description}</div>
                </div>
              )}

              {/* Specifications */}
              {request.specifications && (
                <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {request.specifications.viewAngle && (
                    <div>
                      <span className="text-gray-600">View:</span>
                      <div className="font-medium">{request.specifications.viewAngle}</div>
                    </div>
                  )}
                  {request.specifications.timeOfDay && (
                    <div>
                      <span className="text-gray-600">Time:</span>
                      <div className="font-medium capitalize">{request.specifications.timeOfDay}</div>
                    </div>
                  )}
                  {request.specifications.weather && (
                    <div>
                      <span className="text-gray-600">Weather:</span>
                      <div className="font-medium capitalize">{request.specifications.weather}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Upload Section */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Renders ({request.renders.length})
                  </h4>
                  <label className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 cursor-pointer inline-flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Render
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(request.id, file);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Renders List */}
                {request.renders.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {request.renders.map((render) => (
                      <div
                        key={render.id}
                        className="border border-gray-200 rounded-lg p-2 hover:shadow-md transition-shadow"
                      >
                        <div className="aspect-video bg-gray-100 rounded mb-2 flex items-center justify-center">
                          <Eye className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="text-xs font-medium text-gray-900 truncate mb-1">
                          {render.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {render.resolution} • {(render.fileSize / 1024 / 1024).toFixed(1)} MB
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
