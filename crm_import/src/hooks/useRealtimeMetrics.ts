import { useState, useEffect } from 'react';

interface Metrics {
    leadsToday: number;
    pendingFollowUps: number;
    futureVisits: number;
    conversionRate: number;
}

export function useRealtimeMetrics() {
    const [metrics, setMetrics] = useState<Metrics>({
        leadsToday: 0,
        pendingFollowUps: 0,
        futureVisits: 0,
        conversionRate: 0
    });

    const fetchMetrics = async () => {
        try {
            const res = await fetch('/api/reports/metrics');
            const data = await res.json();
            setMetrics(data);
        } catch (error) {
            console.error('Failed to fetch metrics:', error);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchMetrics();

        // Set up SSE connection
        const eventSource = new EventSource('/api/realtime/leads');

        // Refetch metrics on any lead/booking change
        eventSource.addEventListener('leads:updated', () => {
            fetchMetrics();
        });

        eventSource.addEventListener('bookings:updated', () => {
            fetchMetrics();
        });

        eventSource.addEventListener('metrics:updated', () => {
            fetchMetrics();
        });

        return () => {
            eventSource.close();
        };
    }, []);

    return metrics;
}
