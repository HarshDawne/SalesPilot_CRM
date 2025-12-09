import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { addTimelineEvent } from '@/lib/timeline';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        // Verify signature (omitted for brevity, similar to call log)

        const { from, body: content, media_url, message_id } = body;

        // 1. Find Lead by Phone
        const lead = db.leads.findByPhoneOrEmail(from);

        if (lead) {
            // 2. Create Inbound Message
            db.whatsappMessages.create({
                id: uuidv4(),
                leadId: lead.id,
                direction: 'inbound',
                content,
                media_url,
                status: 'delivered',
                provider_msg_id: message_id,
                created_at: new Date().toISOString()
            });

            // 3. Log to Timeline
            addTimelineEvent({
                leadId: lead.id,
                type: 'note_added', // Use note or custom type for inbound WA
                summary: `Inbound WhatsApp: ${content}`,
                actor: 'system',
                payload: {
                    content,
                    media_url,
                    from
                }
            });

            // 4. Trigger Automations (Placeholder)
            // if (content.toLowerCase().includes('interested')) { ... }
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('WA Webhook Error:', error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
