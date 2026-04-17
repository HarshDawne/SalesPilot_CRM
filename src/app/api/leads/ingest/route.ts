import { NextRequest, NextResponse } from 'next/server';
import { LeadService } from '@/modules/leads/lead-service';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Basic API Key check (for external sources like Webhooks)
        // const apiKey = req.headers.get('x-api-key');
        // if (apiKey !== process.env.LEAD_INGEST_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const lead = await LeadService.createLead(body);

        return NextResponse.json({
            success: true,
            leadId: lead.id,
            message: 'Lead captured successfully'
        });

    } catch (error: any) {
        console.error('Lead Ingest Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status: 400 }
        );
    }
}
