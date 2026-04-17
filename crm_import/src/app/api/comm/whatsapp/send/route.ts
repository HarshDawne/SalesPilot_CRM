import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { MockAdapter } from '@/lib/comm/adapters/mock-adapter';
import { addTimelineEvent } from '@/lib/timeline';
import { v4 as uuidv4 } from 'uuid';

const dialer = new MockAdapter();

export async function POST(request: NextRequest) {
    // 1. RBAC Check
    const authError = await requireRole(request, ['admin', 'manager', 'sales']);
    if (authError) return authError;

    try {
        const body = await request.json();
        const { lead_id, template_id, variables, media_url } = body;
        const actor_id = request.headers.get('x-user-id') || 'system';

        if (!lead_id || !template_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const lead = db.leads.findById(lead_id);
        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        // 2. Create WhatsApp Message Entity
        const waMsg = db.whatsappMessages.create({
            id: uuidv4(),
            leadId: lead_id,
            direction: 'outbound',
            template_id,
            status: 'sent', // Optimistic
            media_url,
            created_at: new Date().toISOString(),
            metadata: variables
        });

        // 3. Send via Adapter
        const { providerMsgId } = await dialer.sendWhatsApp(
            template_id,
            lead.primaryPhone,
            variables || {},
            media_url
        );

        // 4. Log Timeline Event
        addTimelineEvent({
            leadId: lead_id,
            type: 'wa_sent',
            summary: `WhatsApp template ${template_id} sent`,
            actor: actor_id,
            payload: {
                messageId: waMsg.id,
                providerMsgId,
                template_id
            }
        });

        return NextResponse.json({
            success: true,
            messageId: waMsg.id,
            providerMsgId
        });

    } catch (error) {
        console.error('WhatsApp Error:', error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
