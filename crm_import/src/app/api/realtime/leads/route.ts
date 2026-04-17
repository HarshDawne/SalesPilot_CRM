import { NextRequest } from 'next/server';
import { addSSEClient } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // Set up SSE headers
    const responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();
    const encoder = new TextEncoder();

    // Send initial connection message
    writer.write(encoder.encode('data: {"type":"connected"}\n\n'));

    // Register this client for broadcasts
    const sendToClient = (data: string) => {
        try {
            writer.write(encoder.encode(data));
        } catch (error) {
            console.error('Error writing to SSE client:', error);
        }
    };

    const unsubscribe = addSSEClient(sendToClient);

    // Keep connection alive with heartbeat
    const heartbeat = setInterval(() => {
        try {
            writer.write(encoder.encode(': heartbeat\n\n'));
        } catch (error) {
            clearInterval(heartbeat);
            unsubscribe();
        }
    }, 30000); // Every 30 seconds

    // Clean up on disconnect
    req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        unsubscribe();
        writer.close();
    });

    return new Response(responseStream.readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
