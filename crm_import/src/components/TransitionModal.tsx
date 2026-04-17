'use client';

import { useState, useEffect } from 'react';
import { Lead } from '@/lib/db';

interface TransitionModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead;
    allowedStages: string[];
    onSuccess: (updatedLead: Lead) => void;
}

export default function TransitionModal({
    isOpen,
    onClose,
    lead,
    allowedStages,
    onSuccess
}: TransitionModalProps) {
    const [targetStage, setTargetStage] = useState('');
    const [payload, setPayload] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<any[]>([]);

    const handlePrecheck = (stage: string) => {
        // Optional: Call precheck API to get required fields if dynamic
        // For now, we hardcode fields based on stage for UI responsiveness
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        setValidationErrors([]);

        try {
            const res = await fetch(`/api/leads/${lead.id}/transition`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to_stage: targetStage,
                    payload,
                    actor_id: 'current_user_id', // TODO: Get from context/auth
                    version: lead.version
                })
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 409) {
                    setError('Lead has been modified by someone else. Please refresh.');
                } else if (res.status === 400 && data.details) {
                    setValidationErrors(data.details);
                    setError('Validation failed. Please check the fields.');
                } else {
                    setError(data.message || 'Failed to update stage');
                }
            } else {
                onSuccess(data.data);
                onClose();
            }
        } catch (err) {
            setError('Network error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Move Stage</h2>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Current Stage</label>
                    <div className="p-2 bg-gray-100 rounded">{lead.currentStage}</div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Target Stage</label>
                    <select
                        className="w-full p-2 border rounded"
                        value={targetStage}
                        onChange={(e) => {
                            setTargetStage(e.target.value);
                            handlePrecheck(e.target.value);
                        }}
                    >
                        <option value="">Select Stage</option>
                        {allowedStages.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>

                {/* Dynamic Fields based on Target Stage */}
                {targetStage === 'Visit_Booked' && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Visit Date *</label>
                        <input
                            type="datetime-local"
                            className="w-full p-2 border rounded"
                            onChange={(e) => setPayload({ ...payload, visit_date: new Date(e.target.value).toISOString() })}
                        />
                        <label className="block text-sm font-medium mb-1 mt-2">Agent ID *</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded"
                            onChange={(e) => setPayload({ ...payload, agent_id: e.target.value })}
                        />
                    </div>
                )}

                {targetStage === 'Disqualified' && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Reason *</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded"
                            onChange={(e) => setPayload({ ...payload, reason: e.target.value })}
                        />
                    </div>
                )}

                {/* Error Display */}
                {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
                {validationErrors.length > 0 && (
                    <div className="mb-4 bg-red-50 p-2 rounded">
                        {validationErrors.map((e, i) => (
                            <div key={i} className="text-red-600 text-xs">{e.field}: {e.message}</div>
                        ))}
                    </div>
                )}

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!targetStage || loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Updating...' : 'Confirm Move'}
                    </button>
                </div>
            </div>
        </div>
    );
}
