'use client';

import React, { useState } from 'react';
import { Image as ImageIcon, Video, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { MockMedia } from '@/app/properties/mock-data';

interface MediaGalleryProps {
    media: MockMedia[];
}

export default function MediaGallery({ media }: MediaGalleryProps) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const openLightbox = (index: number) => setLightboxIndex(index);
    const closeLightbox = () => setLightboxIndex(null);

    const goToPrevious = () => {
        if (lightboxIndex !== null && lightboxIndex > 0) {
            setLightboxIndex(lightboxIndex - 1);
        }
    };

    const goToNext = () => {
        if (lightboxIndex !== null && lightboxIndex < media.length - 1) {
            setLightboxIndex(lightboxIndex + 1);
        }
    };

    if (media.length === 0) {
        return (
            <div className="py-12 text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600 font-inter">No media available</p>
            </div>
        );
    }

    return (
        <>
            {/* Gallery Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {media.map((item, index) => (
                    <button
                        key={item.id}
                        onClick={() => openLightbox(index)}
                        className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100"
                    >
                        <img
                            src={item.thumbnailUrl}
                            alt={item.caption || `Media ${index + 1}`}
                            className="h-full w-full object-cover transition-transform group-hover:scale-110"
                        />
                        {item.type === 'video' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <div className="rounded-full bg-white/90 p-3">
                                    <Video className="h-6 w-6 text-gray-900" />
                                </div>
                            </div>
                        )}
                        {item.caption && (
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                <p className="text-xs text-white font-inter line-clamp-2">{item.caption}</p>
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* Lightbox */}
            {lightboxIndex !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
                    <button
                        onClick={closeLightbox}
                        className="absolute right-4 top-4 rounded-lg bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                    >
                        <X className="h-6 w-6" />
                    </button>

                    {lightboxIndex > 0 && (
                        <button
                            onClick={goToPrevious}
                            className="absolute left-4 rounded-lg bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                    )}

                    {lightboxIndex < media.length - 1 && (
                        <button
                            onClick={goToNext}
                            className="absolute right-4 rounded-lg bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>
                    )}

                    <div className="max-h-[90vh] max-w-[90vw]">
                        {media[lightboxIndex].type === 'video' ? (
                            <video
                                src={media[lightboxIndex].url}
                                controls
                                autoPlay
                                className="max-h-[90vh] max-w-full rounded-lg"
                            />
                        ) : (
                            <img
                                src={media[lightboxIndex].url}
                                alt={media[lightboxIndex].caption || `Media ${lightboxIndex + 1}`}
                                className="max-h-[90vh] max-w-full rounded-lg object-contain"
                            />
                        )}
                        {media[lightboxIndex].caption && (
                            <p className="mt-4 text-center text-sm text-white font-inter">
                                {media[lightboxIndex].caption}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
