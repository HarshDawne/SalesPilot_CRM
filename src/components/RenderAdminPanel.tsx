'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { RenderRequest, RenderStatus, RenderType, RenderAsset, RenderMedia } from '@/types/render';
import {
  Upload, Check, Clock, AlertCircle, Eye,
  Download, Trash2, Phone, Mail, User,
  Building2, LayoutGrid, Info, ChevronRight,
  MapPin, Calendar, FileText, CheckCircle2
} from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

export default function RenderAdminPanel() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const highlightRequestId = searchParams.get('requestId');
  const [requests, setRequests] = useState<RenderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<RenderStatus | 'ALL'>('ALL');
  const [selectedRequest, setSelectedRequest] = useState<RenderRequest | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/render-requests');
      const data = await response.json();
      if (data.success) {
        setRequests(data.data);
        
        // Auto-select request if deep linked
        if (highlightRequestId) {
          const target = data.data.find((r: RenderRequest) => r.id === highlightRequestId);
          if (target) {
            setSelectedRequest(target);
            // Ensure we're viewing the correct status filter
            if (target.status !== 'PENDING' && target.status !== 'IN_PROGRESS' && target.status !== 'COMPLETED') {
               // keep ALL
            } else if (filterStatus === 'ALL') {
               // optional: could switch filter, but ALL works
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (requestId: string, status: RenderStatus) => {
    try {
      const response = await fetch(`/api/admin/render-requests/${requestId}`, {
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

  const handleCompleteRequest = async (request: RenderRequest, renderType: RenderType, mediaFiles: File[]) => {
    try {
      setIsCompleting(true);
      
      // 1. Upload Final Render Media
      const formData = new FormData();
      mediaFiles.forEach(file => formData.append('files', file));
      
      console.log('[ADMIN] Uploading render media files:', mediaFiles.map(f => f.name));
      const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
      });
      const uploadData = await uploadRes.json();
      
      console.log('[ADMIN] Upload response:', uploadData);
      if (!uploadData.success) {
          const errorMsg = uploadData.error || 'Upload failed';
          console.error('[ADMIN] Upload failed:', errorMsg);
          throw new Error(errorMsg);
      }

      const mediaUrls = uploadData.urls;
      const mediaAssets: RenderMedia[] = mediaUrls.map((url: string, index: number) => ({
          id: crypto.randomUUID(),
          type: url.match(/\.(mp4|webm|ogg)$/i) ? 'VIDEO' : 'IMAGE',
          url,
          fileName: mediaFiles[index].name,
          fileSize: mediaFiles[index].size,
          mimeType: mediaFiles[index].type,
          uploadedAt: new Date().toISOString()
      }));

      // 2. Complete Request & Auto-Route
      console.log('[ADMIN] Submitting render completion for request:', request.id);
      console.log('[ADMIN] Auto-routing to:', request.sourceType, { propertyId: request.propertyId, towerId: request.towerId, unitId: request.unitId });
      
      const response = await fetch(`/api/admin/render-requests/${request.id}/add-render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ media: mediaAssets, renderType }),
      });

      const data = await response.json();
      console.log('[ADMIN] Add render response:', { status: response.status, data });
      
      if (data.success) {
        showToast('Render completed successfully!', "success");
        fetchRequests();
        setSelectedRequest(null);
      } else {
        const errorMsg = data.error || 'Failed to complete request';
        console.error('[ADMIN] Backend error:', errorMsg);
        showToast(`Error: ${errorMsg}`, "error");
      }
    } catch (error: any) {
      console.error('[ADMIN] CRITICAL ERROR in handleCompleteRequest:', error);
      showToast(error.message || 'An error occurred', "error");
    } finally {
      setIsCompleting(false);
    }
  };

  const deleteRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this entire render request? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/render-requests/${requestId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        showToast('Render request deleted successfully', "success");
        fetchRequests();
      } else {
        showToast(`Error: ${data.error || 'Failed to delete request'}`, "error");
      }
    } catch (error: any) {
      console.error('Error deleting request:', error);
      showToast('An error occurred while deleting the request', "error");
    }
  };

  const getStatusColor = (status: RenderStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'IN_PROGRESS':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CANCELLED':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: RenderStatus) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-3.5 h-3.5" />;
      case 'IN_PROGRESS':
        return <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />;
      case 'COMPLETED':
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      default:
        return <AlertCircle className="w-3.5 h-3.5" />;
    }
  };

  const filteredRequests = filterStatus === 'ALL'
    ? requests
    : requests.filter(r => r.status === filterStatus);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-slate-100 border-t-copper"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hydrating Requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      {/* Header Section */}
      <div className="flex items-end justify-between bg-white p-8 rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-50" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3">
              <LayoutGrid size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">3D Render Studio</h1>
              <p className="text-sm text-slate-500 font-medium">Enterprise Visualization Pipeline & Auto-Routing</p>
            </div>
          </div>

          <div className="flex gap-4">
            {(['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all border ${filterStatus === status
                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-105'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                  }`}
              >
                {status === 'ALL' ? 'Everything' : status.replace('_', ' ')}
                <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] ${filterStatus === status ? 'bg-white/20' : 'bg-slate-100'
                  }`}>
                  {status === 'ALL' ? requests.length : requests.filter(r => r.status === status).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={fetchRequests}
          className="relative z-10 px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-2xl font-bold text-sm hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-md flex items-center gap-2"
        >
          <Clock size={18} className="text-slate-400" />
          Refresh Pipeline
        </button>
      </div>

      {/* Main Grid */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
              <LayoutGrid size={40} className="text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Queue is Empty</h3>
            <p className="text-slate-400 text-sm max-w-sm">No requests found with the selected status. All clear for now!</p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div
              key={request.id}
              className={`bg-white rounded-3xl border p-6 transition-all hover:shadow-2xl hover:border-slate-300 group ${request.status === 'COMPLETED' ? 'opacity-75 grayscale-[0.5]' : ''
                } ${selectedRequest?.id === request.id ? 'ring-2 ring-copper/50 border-copper' : 'border-slate-200'}`}
            >
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Side: Request Origin & Identity */}
                <div className="flex-1 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 font-black text-xl border border-slate-200 group-hover:bg-slate-900 group-hover:text-white transition-all transform group-hover:rotate-6">
                        {request.propertyName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-black text-slate-900 tracking-tight">{request.propertyName}</h3>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${getStatusColor(request.status)}`}>
                            {getStatusIcon(request.status)}
                            {request.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 font-bold uppercase tracking-wider">
                          <span className="flex items-center gap-1"><Building2 size={12} /> {request.builderName}</span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                          <span className="flex items-center gap-1"><Info size={12} /> {request.sourceType} {request.unitId ? 'REQUEST' : 'LEVEL'}</span>
                          {request.unitId && (
                            <>
                              <span className="w-1 h-1 bg-slate-300 rounded-full" />
                              <span className="text-slate-600">UNIT {request.unitId}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-slate-400">
                        <User size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Contact Name</span>
                        <span className="text-sm font-bold text-slate-700">{request.contactDetails?.name || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-slate-400">
                        <Phone size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</span>
                        <span className="text-sm font-bold text-slate-700">{request.contactDetails?.phone || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-slate-400">
                        <Mail size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Business Email</span>
                        <span className="text-sm font-bold text-slate-700 truncate max-w-[150px]">{request.contactDetails?.email || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
 
                  {/* Render Types Requested */}
                  <div className="flex flex-wrap gap-2">
                    {(request.requestedRenderTypes || []).map(type => (
                      <span key={type} className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-copper" />
                        {type.replace('_', ' ')}
                      </span>
                    ))}
                  </div>

                  {/* User Uploaded Media */}
                  {request.mediaUrls && request.mediaUrls.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference Media</h4>
                      <div className="flex flex-wrap gap-3">
                        {request.mediaUrls.map((url, idx) => {
                          // Guard against undefined/null URLs
                          if (!url) {
                            return (
                              <div 
                                key={idx}
                                className="relative w-20 h-20 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center"
                              >
                                <span className="text-[8px] text-slate-400 text-center px-1">Media unavailable</span>
                              </div>
                            );
                          }

                          const isVideo = url.match(/\.(mp4|webm|mov|ogg)$/i);

                          return (
                            <div 
                              key={idx} 
                              className="group/media relative w-20 h-20 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 hover:border-copper transition-all"
                            >
                              {isVideo ? (
                                <video 
                                  src={url} 
                                  className="w-full h-full object-cover"
                                  muted
                                  playsInline
                                />
                              ) : (
                                <img 
                                  src={url} 
                                  className="w-full h-full object-cover" 
                                  alt="Request Media" 
                                  onError={(e) => {
                                    // Fallback if image fails to load
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement!.innerHTML = '<span class="text-[8px] text-slate-400 text-center px-1 flex items-center justify-center h-full">Media unavailable</span>';
                                  }}
                                />
                              )}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/media:opacity-100 flex items-center justify-center transition-all">
                                <a
                                  href={url}
                                  download
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-2 bg-white/90 hover:bg-white text-slate-700 rounded-lg transition-all shadow-lg"
                                  title="Download"
                                >
                                  <Download size={16} />
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side: Instructions & Actions */}
                <div className="w-full lg:w-96 flex flex-col justify-between border-l border-slate-100 pl-0 lg:pl-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Instructions</h4>
                      <span className="text-[10px] font-bold text-slate-400">{new Date(request.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 italic min-h-[100px]">
                      "{request.instructions || 'No specific instructions provided.'}"
                    </p>
                  </div>

                  <div className="mt-8 flex flex-col gap-3">
                    {request.status === 'PENDING' && (
                      <button
                        onClick={() => updateStatus(request.id, 'IN_PROGRESS')}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-2 group/btn"
                      >
                        <Clock size={18} className="text-slate-400 group-hover/btn:text-white transition-colors" />
                        Initialize Workflow
                      </button>
                    )}

                    {(request.status === 'IN_PROGRESS' || request.status === 'COMPLETED') && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedRequest(request === selectedRequest ? null : request)}
                          className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${request.status === 'COMPLETED'
                              ? 'bg-slate-100 text-slate-400 cursor-default'
                              : 'bg-copper text-white hover:bg-copper-600 shadow-xl shadow-copper/20'
                            }`}
                        >
                          <Upload size={18} />
                          {request.status === 'COMPLETED' ? 'Work Completed' : 'Add 3D Render'}
                        </button>
                        <button className="p-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-colors">
                          <Eye size={18} />
                        </button>
                      </div>
                    )}

                    {selectedRequest?.id === request.id && request.status !== 'COMPLETED' && (
                      <div className="mt-4 p-6 bg-slate-900 rounded-2xl animate-in slide-in-from-top-4 duration-300">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Final Submission</h5>
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Select Render Type</label>
                            <select
                              id={`render-type-${request.id}`}
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white font-bold outline-none"
                            >
                              {(request.requestedRenderTypes || []).map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Upload Render File</label>
                            <input
                              type="file"
                              id={`render-file-${request.id}`}
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-400 outline-none"
                              accept="image/*,video/*"
                            />
                          </div>
                          <button
                            disabled={isCompleting}
                            onClick={() => {
                              const type = (document.getElementById(`render-type-${request.id}`) as HTMLSelectElement).value as RenderType;
                              const fileInput = document.getElementById(`render-file-${request.id}`) as HTMLInputElement;
                              const files = fileInput.files ? Array.from(fileInput.files) : [];
                              if (files.length === 0) {
                                  showToast('Please select a file to upload', "warning");
                                  return;
                              }
                              handleCompleteRequest(request, type, files);
                            }}
                            className="w-full py-3 bg-copper text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-copper-600 transition-all flex items-center justify-center gap-2"
                          >
                            {isCompleting ? <Clock size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                            Submit & Attach
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Delete Request Button */}
                    {request.status !== 'COMPLETED' && (
                      <button
                        onClick={() => deleteRequest(request.id)}
                        className="w-full py-3 mt-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl font-bold text-xs hover:bg-red-100 hover:border-red-300 transition-all flex items-center justify-center gap-2"
                        title="Delete this render request"
                      >
                        <Trash2 size={14} />
                        Delete Request
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Request Timeline / Attachments Footer */}
              {request.renders.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed Assets ({request.renders.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {request.renders.map(asset => {
                      // Guard against missing or empty media
                      const mediaUrl = asset.media && asset.media.length > 0 ? asset.media[0]?.url : null;
                      const isVideo = mediaUrl ? mediaUrl.match(/\.(mp4|webm|mov|ogg)$/i) : false;

                      return (
                        <div key={asset.id} className="group/asset relative w-32 aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                          {mediaUrl ? (
                            isVideo ? (
                              <video 
                                src={mediaUrl} 
                                className="w-full h-full object-cover opacity-80 group-hover/asset:opacity-100 transition-opacity" 
                                muted
                                playsInline
                              />
                            ) : (
                              <img 
                                src={mediaUrl} 
                                className="w-full h-full object-cover opacity-80 group-hover/asset:opacity-100 transition-opacity" 
                                alt="Render"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-[8px] text-slate-400 text-center px-1">Media unavailable</div>';
                                }}
                              />
                            )
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400 text-center px-1">
                              Media unavailable
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-2 opacity-0 group-hover/asset:opacity-100 transition-all">
                            <span className="text-[8px] font-black text-white uppercase truncate">{asset.renderType}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
