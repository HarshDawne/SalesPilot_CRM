import React, { useState } from 'react';
import { Box, Share2, Plus, View, ExternalLink, Image as ImageIcon, Video, Upload, Trash2 } from 'lucide-react';
import { RenderAsset, RenderRequest } from '@/types/render';

interface ThreeDRenderSectionProps {
    renders?: RenderAsset[];
    requests?: RenderRequest[];
    isReadOnly?: boolean;
    onRequestNew: () => void;
    onView: (render: RenderAsset) => void;
    onShare: (render: RenderAsset) => void;
    onDeleteRequest?: (requestId: string) => Promise<void>;
    compact?: boolean;
}

export function ThreeDRenderSection({
    renders = [],
    requests = [],
    isReadOnly = false,
    onRequestNew,
    onView,
    onShare,
    onDeleteRequest,
    compact = false
}: ThreeDRenderSectionProps) {
    const hasRenders = renders.length > 0;
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (e: React.MouseEvent, requestId: string) => {
        e.stopPropagation();
        e.preventDefault();
        if (!onDeleteRequest) return;
        if (!confirm('Are you sure you want to delete this specific render request?')) return;

        try {
            setDeletingId(requestId);
            await onDeleteRequest(requestId);
        } catch (error) {
            console.error("Failed to delete request", error);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <section className="bg-white rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <Box size={18} className="text-copper" />
                    <span>3D Renders</span>
                </div>
                {!isReadOnly && (
                    <button
                        onClick={onRequestNew}
                        className="text-xs font-bold text-copper hover:text-copper-600 flex items-center gap-1 transition-colors"
                    >
                        <Plus size={14} /> Request 3D Render
                    </button>
                )}
            </div>

            <div className="p-6">
                {!hasRenders ? (
                    <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-300 mb-3">
                            <Box size={24} />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mb-1">No 3D renders available</h4>
                        <p className="text-xs text-slate-500 mb-6 px-4">
                            Showcase your property with professional interior and exterior 3D visualizations.
                        </p>
                        {!isReadOnly && (
                            <button
                                onClick={onRequestNew}
                                className="px-4 py-2 bg-copper text-white rounded-lg text-xs font-bold hover:bg-copper-600 transition-all flex items-center gap-2 mx-auto"
                            >
                                <Plus size={14} /> Request 3D Render
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {renders.map((render) => {
                            const mainMedia = render.media[0];
                            return (
                                <div key={render.id} className="group relative flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-copper/30 hover:bg-copper/5 transition-all">
                                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                                        {mainMedia?.type === 'IMAGE' ? (
                                            <img src={mainMedia.url} alt={render.renderType} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                {mainMedia?.type === 'VIDEO' ? <Video size={24} /> : <ImageIcon size={24} />}
                                            </div>
                                        )}
                                        <div className="absolute top-1 right-1 bg-black/50 backdrop-blur-md px-1 py-0.5 rounded text-[8px] font-bold text-white uppercase">
                                            {render.renderType}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-slate-900 truncate group-hover:text-copper transition-colors">
                                            {render.renderType.replace('_', ' ')} Visualization
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">
                                                {render.media.length} {render.media.length === 1 ? 'Asset' : 'Assets'}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                {new Date(render.uploadedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => onView(render)}
                                            className="p-2 text-slate-400 hover:text-copper hover:bg-copper/10 rounded-lg transition-all"
                                            title="View Render"
                                        >
                                            <ExternalLink size={18} />
                                        </button>
                                        <button
                                            onClick={() => onShare(render)}
                                            className="p-2 text-slate-400 hover:text-copper hover:bg-copper/10 rounded-lg transition-all"
                                            title="Share with Clients"
                                        >
                                            <Share2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Pending Requests Status */}
                        {requests.filter(r => r.status === 'PENDING' || r.status === 'IN_PROGRESS').length > 0 && (
                            <div className="mt-6 pt-4 border-t border-slate-100">
                                <h5 className="text-[10px] font-bold text-slate-400 uppercase mb-3 px-1">Active Requests</h5>
                                {requests.filter(r => r.status === 'PENDING' || r.status === 'IN_PROGRESS').map(req => (
                                    <div key={req.id} className="group flex items-center justify-between p-3 rounded-lg bg-orange-50/50 border border-orange-100 mb-2 last:mb-0 hover:bg-orange-100/50 transition-all">
                                        <div className="flex items-center gap-2 flex-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-medium text-orange-700">
                                                    {req.requestedRenderTypes?.join(', ')} Render
                                                </span>
                                                <span className="text-[9px] font-bold text-orange-500 uppercase tracking-wider">
                                                    {req.status === 'PENDING' ? 'Queued' : 'In Progress'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {req.status === 'PENDING' && !isReadOnly && onDeleteRequest && (
                                                <button
                                                    onClick={(e) => handleDelete(e, req.id)}
                                                    disabled={deletingId === req.id}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-red-50 text-red-500 rounded-md hover:bg-red-100 hover:text-red-700"
                                                    title="Cancel Request"
                                                >
                                                    {deletingId === req.id ? (
                                                        <div className="animate-spin w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full" />
                                                    ) : (
                                                        <Trash2 size={12} />
                                                    )}
                                                </button>
                                            )}
                                            <a
                                                href={`/admin/renders?requestId=${req.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 bg-copper text-white rounded-lg text-[10px] font-bold hover:bg-copper-600 flex items-center gap-1.5 shadow-md"
                                                title="Go to Admin Panel to add 3D render for this request"
                                            >
                                                <Upload size={12} />
                                                Add 3D Render
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
