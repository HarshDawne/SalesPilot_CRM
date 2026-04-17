'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto-dismiss logic: 4s for all except errors which stay for 6s
        const duration = type === 'error' ? 6000 : 4000;
        setTimeout(() => {
            removeToast(id);
        }, duration);
    }, [removeToast]);

    const getToastColors = (type: ToastType) => {
        switch (type) {
            case 'success': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
            case 'error': return 'bg-rose-500/10 border-rose-500/20 text-rose-500';
            case 'warning': return 'bg-amber-500/10 border-amber-500/20 text-amber-500';
            default: return 'bg-blue-500/10 border-blue-500/20 text-blue-500';
        }
    };

    const getToastIcon = (type: ToastType) => {
        switch (type) {
            case 'success': return <CheckCircle2 size={18} />;
            case 'error': return <XCircle size={18} />;
            case 'warning': return <AlertCircle size={18} />;
            default: return <Info size={18} />;
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container - Top Right Positioning */}
            <div className="fixed top-24 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={cn(
                            "group pointer-events-auto flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl animate-in slide-in-from-right-10 duration-500",
                            getToastColors(toast.type)
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className="shrink-0">
                                {getToastIcon(toast.type)}
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-widest leading-tight">
                                {toast.message}
                            </span>
                        </div>
                        <button 
                            onClick={() => removeToast(toast.id)}
                            className="p-1 hover:bg-white/10 rounded-lg transition-colors text-current/50 hover:text-current"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}
