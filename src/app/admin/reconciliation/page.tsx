'use client';

import { useState, useEffect } from 'react';
import TransitionModal from '@/components/TransitionModal';

export default function ReconciliationPage() {
    const [invalidLeads, setInvalidLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchInvalidLeads();
    }, []);

    const fetchInvalidLeads = async () => {
        setLoading(true);
        try {
            // We need an API to fetch invalid leads. 
            // For now, we'll fetch all and filter client-side or use a query param if implemented
            // Assuming GET /api/leads?invalid=true or similar
            // Since we didn't implement that filter yet, we'll just fetch all and check locally for demo
            const res = await fetch('/api/leads');
            const leads = await res.json();

            const ALLOWED_STAGES: string[] = [
                "New", "AI_Calling", "Qualified", "Visit_Booked",
                "Visit_Completed", "Negotiation", "Booking_Done", "Disqualified"
            ];

            const invalid = leads.filter((l: any) => !ALLOWED_STAGES.includes(l.currentStage));
            setInvalidLeads(invalid);
        } catch (error) {
            console.error('Failed to fetch leads', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFix = (lead: any) => {
        setSelectedLead(lead);
        setIsModalOpen(true);
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Admin Reconciliation</h1>
            <p className="mb-4 text-gray-600">Fix leads with invalid states.</p>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="bg-white rounded shadow overflow-hidden">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stage (Invalid)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {invalidLeads.map((lead) => (
                                <tr key={lead.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{lead.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-red-600 font-bold">{lead.currentStage}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => handleFix(lead)}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            Fix Stage
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {invalidLeads.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500">No invalid leads found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {selectedLead && (
                <TransitionModal
                    lead={selectedLead}
                    isOpen={isModalOpen}
                    allowedStages={[
                        "New", "AI_Calling", "Qualified", "Visit_Booked",
                        "Visit_Completed", "Negotiation", "Booking_Done", "Disqualified"
                    ]}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        fetchInvalidLeads();
                        setIsModalOpen(false);
                    }}
                />
            )}
        </div>
    );
}
