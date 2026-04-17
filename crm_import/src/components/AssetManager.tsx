"use client";

import { useState } from "react";
import { Upload, X, FileText, Image as ImageIcon, Link as LinkIcon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Asset {
    id: string;
    name: string;
    type: "image" | "document" | "video";
    url: string;
    linkedTo: "property" | "tower" | "unit" | null;
    linkedId: string | null;
}

interface AssetManagerProps {
    level: "property" | "tower" | "unit";
    id: string; // The ID of the property/tower/unit we are managing assets for
}

export default function AssetManager({ level, id }: AssetManagerProps) {
    const [assets, setAssets] = useState<Asset[]>([
        // Mock Data
        { id: "1", name: "Brochure.pdf", type: "document", url: "#", linkedTo: "property", linkedId: "1" },
        { id: "2", name: "Main Facade.jpg", type: "image", url: "#", linkedTo: "property", linkedId: "1" },
    ]);
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = () => {
        setIsUploading(true);
        // Simulate upload delay
        setTimeout(() => {
            const newAsset: Asset = {
                id: Math.random().toString(),
                name: `New Asset ${assets.length + 1}.jpg`,
                type: "image",
                url: "#",
                linkedTo: level,
                linkedId: id
            };
            setAssets([...assets, newAsset]);
            setIsUploading(false);
        }, 1500);
    };

    const handleDelete = (assetId: string) => {
        setAssets(assets.filter(a => a.id !== assetId));
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <LinkIcon size={16} className="text-slate-400" />
                    Linked Assets ({level})
                </h3>
                <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
                >
                    {isUploading ? "Uploading..." : <><Upload size={14} /> Upload New</>}
                </button>
            </div>

            <div className="p-4 grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                {assets.length === 0 ? (
                    <div className="col-span-2 text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
                        No assets linked yet.
                    </div>
                ) : (
                    assets.map((asset) => (
                        <div key={asset.id} className="group relative flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all">
                            <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center text-slate-500",
                                asset.type === "image" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                            )}>
                                {asset.type === "image" ? <ImageIcon size={18} /> : <FileText size={18} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-slate-800 truncate">{asset.name}</div>
                                <div className="text-xs text-slate-400 capitalize">{asset.type} • {formatBytes(1240000)}</div>
                            </div>
                            <button
                                onClick={() => handleDelete(asset.id)}
                                className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function formatBytes(bytes: number, decimals = 0) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
