"use client";

import { useState, useEffect } from "react";
import { X, Phone, Loader2, CheckCircle, XCircle, PhoneOff, Clock, AlertCircle, TrendingUp, BarChart3 } from "lucide-react";

interface LiveCallStatusModalProps {
    campaignId: string;
    isOpen: boolean;
    onClose: () => void;
}

interface CallStatus {
    progress: {
        total: number;
        processed: number;
        current: number;
        completed: number;
        failed: number;
        queued: number;
    };
    currentCall: {
        leadName: string;
        leadPhone: string;
        status: string;
        executionId: string;
        callRecord?: any;
    } | null;
    lastCompletedCall: {
        leadName: string;
        leadPhone: string;
        status: string;
        outcome: string;
        callRecord?: any;
    } | null;
}

interface CampaignAnalytics {
    totalCalls: number;
    completedCalls: number;
    failedCalls: number;
    successRate: number;
    outcomes: {
        completed: number;
        no_answer: number;
        declined: number;
        busy: number;
        failed: number;
    };
    avgDuration: number;
    intents: Record<string, number>;
}

interface AnalyticsResponse {
    success: boolean;
    analytics: CampaignAnalytics;
    insights: string[];
}

export function LiveCallStatusModal({ campaignId, isOpen, onClose }: LiveCallStatusModalProps) {
    const [status, setStatus] = useState<CallStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        // Initial fetch
        fetchStatus();

        // Poll every 3 seconds
        const interval = setInterval(fetchStatus, 3000);

        return () => clearInterval(interval);
    }, [isOpen, campaignId]);

    const fetchStatus = async () => {
        try {
            const response = await fetch(`/api/campaigns/${campaignId}/status`);
            const data = await response.json();

            if (data.success) {
                setStatus(data);
                setLoading(false);

                // Fetch analytics if campaign is complete
                if (data.progress.processed === data.progress.total && data.progress.total > 0 && !analytics) {
                    fetchAnalytics();
                }

                // Auto-close if campaign is complete and analytics shown
                if (data.progress.processed === data.progress.total && data.progress.total > 0 && analytics) {
                    setTimeout(() => {
                        onClose();
                    }, 10000); // 10 seconds to review analytics
                }
            }
        } catch (error) {
            console.error('Failed to fetch campaign status:', error);
        }
    };

    const fetchAnalytics = async () => {
        setLoadingAnalytics(true);
        try {
            const response = await fetch(`/api/campaigns/${campaignId}/analytics`);
            const data = await response.json();

            if (data.success) {
                setAnalytics(data);
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoadingAnalytics(false);
        }
    };

    const getOutcomeIcon = (outcome: string) => {
        switch (outcome) {
            case 'completed':
                return <CheckCircle className="text-green-600" size={20} />;
            case 'no_answer':
                return <PhoneOff className="text-amber-600" size={20} />;
            case 'declined':
            case 'busy':
                return <XCircle className="text-red-600" size={20} />;
            case 'failed':
                return <AlertCircle className="text-red-600" size={20} />;
            default:
                return <Clock className="text-slate-400" size={20} />;
        }
    };

    const getOutcomeLabel = (outcome: string) => {
        switch (outcome) {
            case 'completed':
                return 'Call Completed';
            case 'no_answer':
                return 'No Answer';
            case 'declined':
                return 'Call Declined';
            case 'busy':
                return 'Line Busy';
            case 'failed':
                return 'Call Failed';
            default:
                return outcome;
        }
    };

    const getOutcomeColor = (outcome: string) => {
        switch (outcome) {
            case 'completed':
                return 'bg-green-50 border-green-200 text-green-900';
            case 'no_answer':
                return 'bg-amber-50 border-amber-200 text-amber-900';
            case 'declined':
            case 'busy':
            case 'failed':
                return 'bg-red-50 border-red-200 text-red-900';
            default:
                return 'bg-slate-50 border-slate-200 text-slate-900';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Campaign in Progress</h2>
                        {status && (
                            <p className="text-sm text-slate-500 mt-1">
                                Call {status.progress.current} of {status.progress.total}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin text-indigo-600" size={32} />
                        </div>
                    ) : status ? (
                        <>
                            {/* Progress Bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium text-slate-700">
                                    <span>Progress</span>
                                    <span>{status.progress.processed} / {status.progress.total}</span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                                        style={{ width: `${(status.progress.processed / status.progress.total) * 100}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <CheckCircle size={12} className="text-green-600" />
                                        {status.progress.completed} Completed
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <XCircle size={12} className="text-red-600" />
                                        {status.progress.failed} Failed
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock size={12} className="text-slate-400" />
                                        {status.progress.queued} Queued
                                    </span>
                                </div>
                            </div>

                            {/* Current Call */}
                            {status.currentCall && (
                                <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center animate-pulse">
                                            <Phone size={24} className="text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-indigo-900">Call in Progress</h3>
                                            <p className="text-sm text-indigo-600">Connecting with lead...</p>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full">
                                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                            LIVE
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-indigo-700 font-medium">Lead Name:</span>
                                            <span className="text-indigo-900 font-bold">{status.currentCall.leadName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-indigo-700 font-medium">Phone:</span>
                                            <span className="text-indigo-900 font-mono">{status.currentCall.leadPhone}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Last Completed Call */}
                            {status.lastCompletedCall && (
                                <div className={`border-2 rounded-xl p-6 ${getOutcomeColor(status.lastCompletedCall.outcome)}`}>
                                    <div className="flex items-center gap-3 mb-4">
                                        {getOutcomeIcon(status.lastCompletedCall.outcome)}
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold">{getOutcomeLabel(status.lastCompletedCall.outcome)}</h3>
                                            <p className="text-sm opacity-75">Previous call</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="font-medium">Lead Name:</span>
                                            <span className="font-bold">{status.lastCompletedCall.leadName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-medium">Phone:</span>
                                            <span className="font-mono">{status.lastCompletedCall.leadPhone}</span>
                                        </div>
                                        {status.lastCompletedCall.callRecord?.duration && (
                                            <div className="flex justify-between">
                                                <span className="font-medium">Duration:</span>
                                                <span className="font-bold">{status.lastCompletedCall.callRecord.duration}s</span>
                                            </div>
                                        )}
                                        {status.lastCompletedCall.callRecord?.summary && (
                                            <div className="mt-3 pt-3 border-t border-current/20">
                                                <p className="text-xs font-medium mb-1">Call Summary:</p>
                                                <p className="text-xs opacity-90">{status.lastCompletedCall.callRecord.summary}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Campaign Complete with Analytics */}
                            {status.progress.processed === status.progress.total && status.progress.total > 0 && (
                                <div className="space-y-4">
                                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
                                        <CheckCircle size={48} className="text-green-600 mx-auto mb-3" />
                                        <h3 className="text-xl font-bold text-green-900 mb-2">Campaign Completed!</h3>
                                        <p className="text-sm text-green-700">
                                            All {status.progress.total} calls have been processed.
                                        </p>
                                    </div>

                                    {/* Analytics Section */}
                                    {loadingAnalytics ? (
                                        <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-8 text-center">
                                            <Loader2 className="animate-spin text-indigo-600 mx-auto mb-2" size={32} />
                                            <p className="text-sm text-slate-600">Generating analytics...</p>
                                        </div>
                                    ) : analytics ? (
                                        <div className="space-y-4">
                                            {/* Key Metrics */}
                                            <div className="bg-white border-2 border-slate-200 rounded-xl p-6">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <BarChart3 size={20} className="text-indigo-600" />
                                                    <h4 className="text-lg font-bold text-slate-900">Campaign Analytics</h4>
                                                </div>

                                                <div className="grid grid-cols-3 gap-4 mb-4">
                                                    <div className="text-center">
                                                        <div className="text-3xl font-bold text-indigo-600">
                                                            {analytics.analytics.successRate}%
                                                        </div>
                                                        <div className="text-xs text-slate-500 mt-1">Success Rate</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-3xl font-bold text-green-600">
                                                            {analytics.analytics.completedCalls}
                                                        </div>
                                                        <div className="text-xs text-slate-500 mt-1">Completed</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-3xl font-bold text-slate-600">
                                                            {analytics.analytics.avgDuration}s
                                                        </div>
                                                        <div className="text-xs text-slate-500 mt-1">Avg Duration</div>
                                                    </div>
                                                </div>

                                                {/* Outcomes Breakdown */}
                                                <div className="space-y-2">
                                                    <div className="text-xs font-semibold text-slate-600 uppercase">Call Outcomes</div>
                                                    {Object.entries(analytics.analytics.outcomes).map(([outcome, count]) => (
                                                        count > 0 && (
                                                            <div key={outcome} className="flex items-center justify-between text-sm">
                                                                <span className="flex items-center gap-2">
                                                                    {outcome === 'completed' && <CheckCircle size={14} className="text-green-600" />}
                                                                    {outcome === 'no_answer' && <PhoneOff size={14} className="text-amber-600" />}
                                                                    {(outcome === 'declined' || outcome === 'busy') && <XCircle size={14} className="text-red-600" />}
                                                                    {outcome === 'failed' && <AlertCircle size={14} className="text-red-600" />}
                                                                    <span className="capitalize">{outcome.replace('_', ' ')}</span>
                                                                </span>
                                                                <span className="font-bold">{count}</span>
                                                            </div>
                                                        )
                                                    ))}
                                                </div>
                                            </div>

                                            {/* AI Insights */}
                                            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <TrendingUp size={20} className="text-purple-600" />
                                                    <h4 className="text-lg font-bold text-purple-900">AI Insights</h4>
                                                </div>
                                                <div className="space-y-2">
                                                    {analytics.insights.map((insight, i) => (
                                                        <div key={i} className="text-sm text-purple-900 bg-white/50 rounded-lg p-3">
                                                            {insight}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            <p>Unable to load campaign status</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
