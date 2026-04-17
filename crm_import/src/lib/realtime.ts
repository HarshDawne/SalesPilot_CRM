import { EventEmitter } from 'events';

// Global event emitter for real-time updates
class RealtimeEventEmitter extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(100); // Support many concurrent connections
    }

    // Emit lead events
    emitLeadCreated(lead: any) {
        this.emit('lead:created', lead);
        this.emit('leads:updated'); // General update event
    }

    emitLeadUpdated(leadId: string, updates: any) {
        this.emit('lead:updated', { id: leadId, ...updates });
        this.emit('leads:updated');
    }

    emitLeadStatusChanged(leadId: string, oldStatus: string, newStatus: string) {
        this.emit('lead:status_changed', { id: leadId, oldStatus, newStatus });
        this.emit('leads:updated');
    }

    // Emit activity events
    emitActivityAdded(activity: any) {
        this.emit('activity:added', activity);
        this.emit(`lead:${activity.leadId}:activity`, activity);
    }

    // Emit booking events
    emitBookingCreated(booking: any) {
        this.emit('booking:created', booking);
        this.emit('bookings:updated');
    }

    emitBookingUpdated(bookingId: string, updates: any) {
        this.emit('booking:updated', { id: bookingId, ...updates });
        this.emit('bookings:updated');
    }

    // Emit metrics events
    emitMetricsUpdated() {
        this.emit('metrics:updated');
    }
}

// Singleton instance
export const realtimeEvents = new RealtimeEventEmitter();

// Helper to broadcast to all SSE clients
const sseClients = new Set<(data: string) => void>();

export function addSSEClient(sendFn: (data: string) => void) {
    sseClients.add(sendFn);
    return () => sseClients.delete(sendFn);
}

export function broadcastSSE(event: string, data: any) {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    sseClients.forEach(send => {
        try {
            send(message);
        } catch (error) {
            console.error('SSE broadcast error:', error);
        }
    });
}

// Listen to all events and broadcast via SSE
realtimeEvents.on('lead:created', (data) => broadcastSSE('lead:created', data));
realtimeEvents.on('lead:updated', (data) => broadcastSSE('lead:updated', data));
realtimeEvents.on('lead:status_changed', (data) => broadcastSSE('lead:status_changed', data));
realtimeEvents.on('activity:added', (data) => broadcastSSE('activity:added', data));
realtimeEvents.on('booking:created', (data) => broadcastSSE('booking:created', data));
realtimeEvents.on('booking:updated', (data) => broadcastSSE('booking:updated', data));
realtimeEvents.on('leads:updated', () => broadcastSSE('leads:updated', {}));
realtimeEvents.on('bookings:updated', () => broadcastSSE('bookings:updated', {}));
realtimeEvents.on('metrics:updated', () => broadcastSSE('metrics:updated', {}));
