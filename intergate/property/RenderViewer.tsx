'use client';

import React, { useState } from 'react';
import { Play, Lock, DollarSign, Box, Check } from 'lucide-react';
import Button from '../ui/Button';
import { MockRender } from '@/app/properties/mock-data';
import toast from 'react-hot-toast';

interface RenderViewerProps {
    renders: MockRender[];
    onPurchase?: (renderId: string) => void;
}

export default function RenderViewer({ renders, onPurchase }: RenderViewerProps) {
    const [playingVideo, setPlayingVideo] = useState<string | null>(null);

    const handlePurchase = (render: MockRender) => {
        if (onPurchase) {
            onPurchase(render.id);
            toast.success(`3D Render "${render.name}" unlocked successfully!`, {
                icon: '🎨',
                duration: 3000,
            });
        }
    };

    const formatPrice = (price: number) => `₹${price.toLocaleString('en-IN')}`;

    if (renders.length === 0) {
        return (
            <div className="py-12 text-center">
                <Box className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600 font-inter">No 3D renders available</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {renders.map((render) => (
                <div
                    key={render.id}
                    className="overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-lg"
                >
                    {/* Thumbnail/Video */}
                    <div className="relative aspect-video bg-gray-100">
                        {playingVideo === render.id && render.purchased && render.videoUrl ? (
                            <video
                                src={render.videoUrl}
                                controls
                                autoPlay
                                className="h-full w-full object-cover"
                                onEnded={() => setPlayingVideo(null)}
                            />
                        ) : (
                            <>
                                <img
                                    src={render.thumbnailUrl}
                                    alt={render.name}
                                    className={`h-full w-full object-cover ${!render.purchased ? 'filter blur-sm' : ''
                                        }`}
                                />
                                {!render.purchased && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                        <div className="text-center">
                                            <Lock className="mx-auto h-12 w-12 text-white" />
                                            <p className="mt-2 text-sm font-medium text-white font-inter">
                                                Locked
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {render.purchased && render.videoUrl && (
                                    <button
                                        onClick={() => setPlayingVideo(render.id)}
                                        className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity hover:bg-black/40"
                                    >
                                        <div className="rounded-full bg-white/90 p-4">
                                            <Play className="h-8 w-8 text-gray-900" />
                                        </div>
                                    </button>
                                )}
                            </>
                        )}
                        {render.purchased && (
                            <div className="absolute right-2 top-2">
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                                    <Check className="h-3 w-3" />
                                    Purchased
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 font-outfit">
                                    {render.name}
                                </h3>
                                <p className="mt-1 text-sm text-gray-600 font-inter">
                                    {render.description}
                                </p>
                            </div>
                            {!render.purchased && (
                                <div className="flex-shrink-0">
                                    <div className="rounded-lg bg-primary-100 px-3 py-1">
                                        <p className="text-sm font-semibold text-primary-600 font-inter">
                                            {formatPrice(render.price)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Button */}
                        <div className="mt-4">
                            {render.purchased ? (
                                render.videoUrl && (
                                    <Button
                                        onClick={() => setPlayingVideo(render.id)}
                                        variant="secondary"
                                        className="w-full"
                                    >
                                        <Play className="h-4 w-4" />
                                        Play 3D Render
                                    </Button>
                                )
                            ) : (
                                <Button onClick={() => handlePurchase(render)} className="w-full">
                                    <Lock className="h-4 w-4" />
                                    Unlock 3D Render - {formatPrice(render.price)}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            ))}

            <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3">
                <p className="text-xs text-indigo-800 font-inter">
                    <strong>About 3D Renders:</strong> High-quality 3D renders help visualize the project before
                    construction. Purchase unlocks full HD video walkthroughs.
                </p>
            </div>
        </div>
    );
}
