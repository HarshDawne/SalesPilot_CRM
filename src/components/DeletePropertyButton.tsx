"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

interface DeletePropertyButtonProps {
    propertyId: string;
    propertyName: string;
}

export default function DeletePropertyButton({ propertyId, propertyName }: DeletePropertyButtonProps) {
    const { showToast } = useToast();
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);

        try {
            const res = await fetch(`/api/properties/${propertyId}`, {
                method: 'DELETE',
            });

            const result = await res.json();

            if (!res.ok || !result.success) {
                throw new Error(result.error || 'Failed to delete property');
            }

            // Success - redirect to properties list
            router.push('/properties');
            router.refresh();
        } catch (error: any) {
            console.error('Delete error:', error);
            showToast(error.message || 'Failed to delete property', "error");
            setIsDeleting(false);
            setShowConfirm(false);
        }
    };

    if (showConfirm) {
        return (
            <div className="inline-flex items-center gap-2">
                <div className="text-sm text-red-600 font-medium">
                    Delete "{propertyName}"?
                </div>
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                    {isDeleting ? 'Deleting...' : 'Confirm'}
                </button>
                <button
                    onClick={() => setShowConfirm(false)}
                    disabled={isDeleting}
                    className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                    Cancel
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => setShowConfirm(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
        >
            <Trash2 className="w-4 h-4" />
            Delete Property
        </button>
    );
}
