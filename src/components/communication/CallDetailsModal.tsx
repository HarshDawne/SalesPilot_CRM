import React from 'react';
import { X, Play, Clock, Phone, FileText, Activity, Calendar, DollarSign, Zap, MessageSquare, ShieldCheck, Users } from 'lucide-react';

interface CallDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    job: any;
}

export function CallDetailsModal({ isOpen, onClose, job: initialJob }: CallDetailsModalProps) {
    const [job, setJob] = React.useState<any>(initialJob);
    const [loading, setLoading] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState<'transcript' | 'summary' | 'raw'>('transcript');

    React.useEffect(() => {
        if (initialJob) {
            // Use the data passed directly from props (which now comes from the enriched jobs API)
            // fallback logic ensures we display whatever we have
            const merged = {
                ...initialJob,
                // Ensure cost/duration are not lost if they are in metadata
                durationSeconds: initialJob.durationSeconds ?? initialJob.metadata?.duration ?? 0,
                cost: initialJob.cost ?? initialJob.metadata?.cost ?? 0,
                metadata: {
                    ...initialJob.metadata,
                    // Fallbacks for display
                    transcript: initialJob.transcript ?? initialJob.metadata?.transcript,
                    summary: initialJob.summary ?? initialJob.metadata?.summary ?? "AI is synthesizing the conversation...",
                    recordingUrl: initialJob.recordingUrl ?? initialJob.metadata?.recordingUrl
                }
            };
            setJob(merged);
        }
    }, [initialJob, isOpen]);

    if (!isOpen || !job) return null;

    const formatDuration = (seconds: number) => {
        const total = Math.round(seconds || 0);
        const mins = Math.floor(total / 60);
        const secs = total % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">

                {/* Header */}
                <div className="p-8 border-b border-slate-100 bg-slate-50/30">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                <Users size={28} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                    {job.leadName || 'System Process'}
                                </h2>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-sm font-bold text-indigo-600">{job.phoneNumber}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border
                                ${job.status === 'COMPLETED' || job.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    job.status === 'FAILED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                        'bg-blue-50 text-blue-600 border-blue-100'}
                            `}>
                                {job.status}
                            </span>
                            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-all text-slate-400">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        <QuickStat icon={<Clock size={16} />} label="Duration" value={formatDuration(job.durationSeconds || 0)} />
                        <QuickStat icon={<DollarSign size={16} />} label="Session Cost" value={`₹ ${job.cost || '0.00'}`} />
                        <QuickStat icon={<Zap size={16} />} label="Intent" value={job.intent || 'Unknown'} color="indigo" />
                        <QuickStat icon={<Activity size={16} />} label="Sentiment" value={job.sentiment || 'Analyzing'} color={job.sentiment === 'positive' ? 'emerald' : 'slate'} />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex px-8 border-b border-slate-100 bg-white">
                    <Tab active={activeTab === 'transcript'} onClick={() => setActiveTab('transcript')} icon={<FileText size={16} />} label="Transcript" />
                    <Tab active={activeTab === 'summary'} onClick={() => setActiveTab('summary')} icon={<MessageSquare size={16} />} label="AI Summary" />
                    <Tab active={activeTab === 'raw'} onClick={() => setActiveTab('raw')} icon={<Activity size={16} />} label="Raw Data" />
                    {loading && <div className="ml-auto self-center text-[10px] font-black text-indigo-500 animate-pulse uppercase tracking-widest">Syncing...</div>}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/20">
                    {activeTab === 'transcript' ? (
                        <div className="space-y-6">
                            {job.metadata?.recordingUrl && (
                                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Play size={12} className="text-indigo-600" /> Audio Recording
                                    </p>
                                    <audio controls className="w-full h-10">
                                        <source src={job.metadata.recordingUrl} type="audio/mpeg" />
                                    </audio>
                                </div>
                            )}
                            <div className="bg-white border border-slate-200 rounded-3xl p-6 text-sm text-slate-700 leading-relaxed font-mono whitespace-pre-wrap shadow-sm min-h-[300px]">
                                {job.metadata?.transcript || "Transcript is being processed..."}
                            </div>
                        </div>
                    ) : activeTab === 'summary' ? (
                        <div className="bg-indigo-50/30 border border-indigo-100 rounded-3xl p-8 space-y-4">
                            <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                                <Zap size={20} className="fill-indigo-600 text-indigo-600" /> AI Insights
                            </h3>
                            <p className="text-slate-700 leading-relaxed">
                                {job.metadata?.summary || "AI is preparing a summary of this conversation..."}
                            </p>
                        </div>
                    ) : (
                        <div className="bg-slate-900 rounded-3xl p-6 overflow-x-auto shadow-2xl">
                            <pre className="text-emerald-400 text-xs font-mono leading-relaxed">
                                {JSON.stringify(job, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center px-8">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Timestamp: {new Date(job.createdAt).toLocaleString()}
                    </p>
                    <button onClick={onClose} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all">
                        Close Log
                    </button>
                </div>
            </div>
        </div>
    );
}

function QuickStat({ icon, label, value, color = "slate" }: any) {
    const colors: any = {
        slate: "text-slate-500",
        indigo: "text-indigo-600",
        emerald: "text-emerald-600",
    };
    return (
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className={`flex items-center gap-2 ${colors[color]} mb-1`}>
                {icon}
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</span>
            </div>
            <p className={`text-lg font-black tracking-tight ${color !== 'slate' ? colors[color] : 'text-slate-900'}`}>{value}</p>
        </div>
    );
}

function Tab({ active, onClick, icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2
                ${active ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}
            `}
        >
            {icon}
            {label}
        </button>
    );
}
