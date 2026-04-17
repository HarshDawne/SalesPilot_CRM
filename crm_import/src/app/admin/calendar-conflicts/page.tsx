'use client';

import { useEffect, useState } from 'react';

export default function CalendarConflictsPage() {
    const [conflicts, setConflicts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchConflicts();
    }, []);

    const fetchConflicts = async () => {
        try {
            const response = await fetch('/api/calendar/conflicts', {
                headers: { 'x-user-id': 'user-1' } // Admin user
            });
            const data = await response.json();
            setConflicts(data.conflicts || []);
        } catch (error) {
            console.error('Failed to fetch conflicts:', error);
        } finally {
            setLoading(false);
        }
    };

    const resolveConflict = async (conflictId: string, action: string) => {
        if (!confirm(`Are you sure you want to ${action}?`)) return;

        try {
            await fetch(`/api/calendar/conflicts/${conflictId}/resolve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': 'user-1'
                },
                body: JSON.stringify({
                    action,
                    resolution: `Resolved via admin panel: ${action}`,
                    resolved_by: 'user-1'
                })
            });

            // Refresh conflicts
            fetchConflicts();
        } catch (error) {
            console.error('Failed to resolve conflict:', error);
            alert('Failed to resolve conflict');
        }
    };

    if (loading) {
        return <div className="p-8">Loading conflicts...</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Calendar Conflicts</h1>

            {conflicts.length === 0 ? (
                <div className="bg-green-50 p-6 rounded-lg text-center">
                    <div className="text-2xl mb-2">✅</div>
                    <div className="text-lg font-semibold">No conflicts found</div>
                    <div className="text-gray-600 mt-2">All bookings are conflict-free</div>
                </div>
            ) : (
                <div className="space-y-6">
                    {conflicts.map((conflict) => (
                        <div key={conflict.id} className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-red-600">
                                        {conflict.conflict_type.replace(/_/g, ' ').toUpperCase()}
                                    </h3>
                                    <div className="text-sm text-gray-600">
                                        Detected: {new Date(conflict.detected_at).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                {/* Booking A */}
                                <div className="border p-4 rounded">
                                    <h4 className="font-semibold mb-2">Booking A</h4>
                                    {conflict.booking_a_details ? (
                                        <>
                                            <div className="text-sm space-y-1">
                                                <div><strong>Lead:</strong> {conflict.booking_a_details.lead_name}</div>
                                                <div><strong>Time:</strong> {new Date(conflict.booking_a_details.time).toLocaleString()}</div>
                                                <div><strong>Status:</strong> {conflict.booking_a_details.status}</div>
                                                <div><strong>Agent:</strong> {conflict.booking_a_details.agent_id}</div>
                                            </div>
                                            <button
                                                onClick={() => resolveConflict(conflict.id, 'cancel_booking_a')}
                                                className="mt-3 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                            >
                                                Cancel This Booking
                                            </button>
                                        </>
                                    ) : (
                                        <div className="text-gray-500">Booking not found</div>
                                    )}
                                </div>

                                {/* Booking B */}
                                <div className="border p-4 rounded">
                                    <h4 className="font-semibold mb-2">Booking B</h4>
                                    {conflict.booking_b_details ? (
                                        <>
                                            <div className="text-sm space-y-1">
                                                <div><strong>Lead:</strong> {conflict.booking_b_details.lead_name}</div>
                                                <div><strong>Time:</strong> {new Date(conflict.booking_b_details.time).toLocaleString()}</div>
                                                <div><strong>Status:</strong> {conflict.booking_b_details.status}</div>
                                                <div><strong>Agent:</strong> {conflict.booking_b_details.agent_id}</div>
                                            </div>
                                            <button
                                                onClick={() => resolveConflict(conflict.id, 'cancel_booking_b')}
                                                className="mt-3 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                            >
                                                Cancel This Booking
                                            </button>
                                        </>
                                    ) : (
                                        <div className="text-gray-500">Booking not found</div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => resolveConflict(conflict.id, 'reschedule_booking_a')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Reschedule Booking A
                                </button>
                                <button
                                    onClick={() => resolveConflict(conflict.id, 'reschedule_booking_b')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Reschedule Booking B
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
