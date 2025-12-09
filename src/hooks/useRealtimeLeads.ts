import { useState, useEffect, useCallback } from 'react';
import { Lead } from '@/lib/db';

export function useRealtimeLeads(initialLeads: Lead[] = []) {
    const [leads, setLeads] = useState<Lead[]>(initialLeads);
    const [isConnected, setIsConnected] = useState(false);

    const fetchLeads = useCallback(async () => {
        try {
            const res = await fetch('/api/leads');
            const data = await res.json();
            setLeads(data);
        } catch (error) {
            console.error('Failed to fetch leads:', error);
        }
    }, []);

    useEffect(() => {
        // Initial fetch
        fetchLeads();

        // Set up SSE connection
        const eventSource = new EventSource('/api/realtime/leads');

        eventSource.onopen = () => {
            console.log('SSE connected');
            setIsConnected(true);
        };

        eventSource.onerror = (error) => {
            console.error('SSE error:', error);
            setIsConnected(false);
            // Will auto-reconnect
        };

        // Handle lead created
        eventSource.addEventListener('lead:created', (event) => {
            const newLead = JSON.parse(event.data);
            setLeads(prev => [newLead, ...prev]);
        });

        // Handle lead updated
        eventSource.addEventListener('lead:updated', (event) => {
            const updates = JSON.parse(event.data);
            setLeads(prev => prev.map(lead =>
                lead.id === updates.id ? { ...lead, ...updates } : lead
            ));
        });

        // Handle status changed
        eventSource.addEventListener('lead:status_changed', (event) => {
            const { id, newStatus } = JSON.parse(event.data);
            setLeads(prev => prev.map(lead =>
                lead.id === id ? { ...lead, status: newStatus } : lead
            ));
        });

        // Handle general updates (fallback)
        eventSource.addEventListener('leads:updated', () => {
            fetchLeads();
        });

        return () => {
            eventSource.close();
        };
    }, [fetchLeads]);

    return { leads, isConnected, refetch: fetchLeads };
}
