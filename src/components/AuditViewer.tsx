import { Activity } from "@/lib/db";
import { X, ShieldCheck, FileJson } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditViewerProps {
    isOpen: boolean;
    onClose: () => void;
    activities: Activity[];
}

export default function AuditViewer({ isOpen, onClose, activities }: AuditViewerProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Audit Log</h2>
                            <p className="text-sm text-slate-500">Immutable record of all activities and evidence</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                    {activities.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">No activities recorded</div>
                    ) : (
                        activities.map((activity) => (
                            <div key={activity.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-slate-50 flex justify-between items-start bg-slate-50/30">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono text-xs text-slate-400">#{activity.id.slice(0, 8)}</span>
                                            <span className={cn(
                                                "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider",
                                                activity.immutable ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-slate-100 text-slate-500"
                                            )}>
                                                {activity.immutable ? "Immutable" : "Standard"}
                                            </span>
                                        </div>
                                        <h3 className="font-medium text-slate-900">{activity.summary}</h3>
                                    </div>
                                    <div className="text-xs text-slate-500 font-mono">
                                        {new Date(activity.createdAt).toISOString()}
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-900 text-slate-50 overflow-x-auto">
                                    <pre className="text-xs font-mono">
                                        {JSON.stringify(activity, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-slate-100 flex justify-end bg-white rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
