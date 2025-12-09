'use client';
import React, { useEffect, useState } from 'react';

export default function CommReconciliationPage() {
    const [jobs, setJobs] = useState<any[]>([]);

    useEffect(() => {
        // Mock fetch of failed jobs
        // In real app: fetch('/api/comm/jobs?status=failed')
        setJobs([
            { id: 'job_1', campaignId: 'camp_1', leadId: 'lead_1', status: 'failed', last_error: 'Provider timeout' }
        ]);
    }, []);

    const handleRetry = (id: string) => {
        alert(`Retrying job ${id}`);
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Communication Job Reconciliation</h1>
            <table className="w-full bg-white shadow rounded">
                <thead>
                    <tr className="bg-gray-50 text-left">
                        <th className="p-4">Job ID</th>
                        <th className="p-4">Campaign</th>
                        <th className="p-4">Error</th>
                        <th className="p-4">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {jobs.map(job => (
                        <tr key={job.id} className="border-t">
                            <td className="p-4">{job.id}</td>
                            <td className="p-4">{job.campaignId}</td>
                            <td className="p-4 text-red-600">{job.last_error}</td>
                            <td className="p-4">
                                <button
                                    onClick={() => handleRetry(job.id)}
                                    className="text-blue-600 hover:underline"
                                >
                                    Retry
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
