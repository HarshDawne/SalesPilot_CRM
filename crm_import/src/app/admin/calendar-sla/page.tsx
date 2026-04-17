'use client';

import { useEffect, useState } from 'react';

export default function CalendarSLADashboard() {
    const [slaData, setSlaData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(30);

    useEffect(() => {
        fetchSLAData();
    }, [days]);

    const fetchSLAData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/calendar/sla?days=${days}`, {
                headers: { 'x-user-id': 'user-1' } // Admin user
            });
            const data = await response.json();
            setSlaData(data);
        } catch (error) {
            console.error('Failed to fetch SLA data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8">Loading SLA metrics...</div>;
    }

    if (!slaData) {
        return <div className="p-8">Failed to load SLA data</div>;
    }

    const { sla_metrics, operational_metrics, summary } = slaData;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Calendar SLA Dashboard</h1>
                <select
                    value={days}
                    onChange={(e) => setDays(parseInt(e.target.value))}
                    className="px-4 py-2 border rounded"
                >
                    <option value={7}>Last 7 days</option>
                    <option value={30}>Last 30 days</option>
                    <option value={90}>Last 90 days</option>
                </select>
            </div>

            {/* SLA Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* 48h Scheduling SLA */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Visit Scheduled Within 48h</h2>
                    <div className="text-4xl font-bold mb-2">
                        {Math.round(sla_metrics.scheduled_within_48h.rate)}%
                    </div>
                    <div className="text-sm text-gray-600 mb-4">
                        {sla_metrics.scheduled_within_48h.scheduled_on_time} / {sla_metrics.scheduled_within_48h.total_qualified} qualified leads
                    </div>
                    {sla_metrics.scheduled_within_48h.breaches > 0 && (
                        <div className="text-red-600 text-sm">
                            ⚠️ {sla_metrics.scheduled_within_48h.breaches} breaches
                        </div>
                    )}
                </div>

                {/* 24h Confirmation SLA */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Confirmed Within 24h Before Visit</h2>
                    <div className="text-4xl font-bold mb-2">
                        {Math.round(sla_metrics.confirmed_within_24h.rate)}%
                    </div>
                    <div className="text-sm text-gray-600 mb-4">
                        {sla_metrics.confirmed_within_24h.confirmed_on_time} / {sla_metrics.confirmed_within_24h.total_upcoming} upcoming visits
                    </div>
                    {sla_metrics.confirmed_within_24h.breaches > 0 && (
                        <div className="text-red-600 text-sm">
                            ⚠️ {sla_metrics.confirmed_within_24h.breaches} breaches
                        </div>
                    )}
                </div>
            </div>

            {/* Operational Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">No-Show Rate</h3>
                    <div className="text-3xl font-bold">{operational_metrics.no_show_rate}%</div>
                    <div className="text-sm text-gray-600 mt-2">
                        {operational_metrics.total_no_shows} no-shows / {operational_metrics.total_completed} total
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Reminder Delivery</h3>
                    <div className="text-3xl font-bold">{operational_metrics.reminder_delivery_rate}%</div>
                    <div className="text-sm text-gray-600 mt-2">
                        {operational_metrics.total_reminders_sent} sent / {operational_metrics.total_reminders_scheduled} scheduled
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Booking Rate</h3>
                    <div className="text-3xl font-bold">{summary.avg_booking_rate}%</div>
                    <div className="text-sm text-gray-600 mt-2">
                        {summary.total_bookings} bookings / {summary.total_qualified_leads} qualified
                    </div>
                </div>
            </div>

            {/* Reminder Channel Breakdown */}
            <div className="bg-white p-6 rounded-lg shadow mb-8">
                <h3 className="text-lg font-semibold mb-4">Reminder Delivery by Channel</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(operational_metrics.reminder_by_channel).map(([channel, count]) => (
                        <div key={channel} className="text-center">
                            <div className="text-2xl font-bold">{count as number}</div>
                            <div className="text-sm text-gray-600 capitalize">{channel}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* SLA Breaches */}
            {sla_metrics.scheduled_within_48h.breach_details.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Recent 48h Scheduling Breaches</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2">Lead</th>
                                    <th className="text-left py-2">Qualified At</th>
                                    <th className="text-left py-2">Booked At</th>
                                    <th className="text-left py-2">Delay (hours)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sla_metrics.scheduled_within_48h.breach_details.map((breach: any) => (
                                    <tr key={breach.lead_id} className="border-b">
                                        <td className="py-2">{breach.lead_name}</td>
                                        <td className="py-2">{new Date(breach.qualified_at).toLocaleString()}</td>
                                        <td className="py-2">{new Date(breach.booked_at).toLocaleString()}</td>
                                        <td className="py-2 text-red-600">{breach.hours_delay}h</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
