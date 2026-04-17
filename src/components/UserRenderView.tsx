'use client';

import { useState, useEffect } from 'react';
import { RenderRequest } from '@/types/render';
import { Image as ImageIcon, Download, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface UserRenderViewProps {
    propertyId: string;
}

export default function UserRenderView({ propertyId }: UserRenderViewProps) {
    const [requests, setRequests] = useState<RenderRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();

        // Set up real-time updates
        const eventSource = new EventSource('/api/realtime');
        eventSource.addEventListener('render-status-update', (e) => {
            const data = JSON.parse(e.data);
            if (data.propertyId === propertyId) {
                fetchRequests();
            }
        });

        return () => eventSource.close();
    }, [propertyId]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/renders/request?propertyId=${propertyId}`);
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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                        <Clock className="w-4 h-4" />
                        Requested
                    </span>
                );
            case 'IN_PROGRESS':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        <Clock className="w-4 h-4 animate-spin" />
                        In Progress
                    </span>
                );
            case 'COMPLETED':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Ready
                    </span>
                );
            case 'DELIVERED':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Delivered
                    </span>
                );
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No render requests yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Your 3D Render Requests</h3>

            {requests.map((request) => (
                <div key={request.id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h4 className="font-medium text-gray-900">
                                {request.requestedRenderTypes[0]?.replace('_', ' ') || '3D'} Render
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                                Requested on {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                        {getStatusBadge(request.status)}
                    </div>

                    {request.instructions && (
                        <p className="text-sm text-gray-700 mb-3">{request.instructions}</p>
                    )}

                    {/* Status Messages */}
                    {request.status === 'PENDING' && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-3">
                            <p className="text-sm text-yellow-800">
                                <strong>Your request has been received!</strong> Our design team will start working on it soon.
                            </p>
                        </div>
                    )}

                    {request.status === 'IN_PROGRESS' && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-3">
                            <p className="text-sm text-blue-800">
                                <strong>Work in progress!</strong> Our team is creating your 3D render. We'll notify you when it's ready.
                            </p>
                        </div>
                    )}

                    {request.status === 'COMPLETED' && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-3">
                            <p className="text-sm text-green-800">
                                <strong>Your render is ready!</strong> You can download it below.
                            </p>
                        </div>
                    )}

                    {/* Renders */}
                    {request.renders.length > 0 && (
                        <div className="mt-4">
                            <h5 className="text-sm font-semibold text-gray-900 mb-2">
                                Available Renders ({request.renders.length})
                            </h5>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {request.renders.map((render) => {
                                    const media = render.media?.[0];
                                    return (
                                        <div
                                            key={render.id}
                                            className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                                        >
                                            <div className="aspect-video bg-gray-100 rounded mb-2 flex items-center justify-center relative overflow-hidden">
                                                {media ? (
                                                    <img src={media.url} className="w-full h-full object-cover" alt="Render" />
                                                ) : (
                                                    <ImageIcon className="w-8 h-8 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="text-sm font-medium text-gray-900 truncate mb-1">
                                                {render.renderType}
                                            </div>
                                            <div className="text-xs text-gray-500 mb-2">
                                                {new Date(render.uploadedAt).toLocaleDateString()}
                                            </div>
                                            {media && (
                                                <a
                                                    href={media.url}
                                                    download
                                                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                                                >
                                                    <Download className="w-3 h-3" />
                                                    Download
                                                </a>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
