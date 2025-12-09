import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
    const authError = await requireRole(request, ['admin', 'manager']);
    if (authError) return authError;

    const campaigns = db.campaigns.findAll();
    return NextResponse.json(campaigns);
}

export async function POST(request: NextRequest) {
    const authError = await requireRole(request, ['admin', 'manager']);
    if (authError) return authError;

    try {
        const body = await request.json();
        const { name, lead_query, script_id, mode, concurrency, retry_policy, fallback } = body;
        const user_id = request.headers.get('x-user-id') || 'system';

        if (!name || !lead_query || !script_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const campaign = db.campaigns.create({
            id: uuidv4(),
            name,
            created_by: user_id,
            lead_query,
            script_id,
            mode: mode || 'ai_call',
            start_at: new Date().toISOString(), // Default to now or schedule
            status: 'draft',
            concurrency: concurrency || 5,
            retry_policy: retry_policy || { attempts: 3, backoff: 'exponential', interval_seconds: 300 },
            fallback: fallback || 'whatsapp',
            metrics: {
                total: 0,
                attempted: 0,
                connected: 0,
                answered: 0,
                qualified: 0,
                failed: 0,
                cost: 0
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json(campaign);

    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
