import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
    const authError = await requireRole(request, ['admin']);
    if (authError) return authError;

    const configs = db.providerConfigs.findAll();
    // Mask credentials
    const safeConfigs = configs.map(c => ({
        ...c,
        credentials: { ...c.credentials, apiKey: '***' }
    }));

    return NextResponse.json(safeConfigs);
}

export async function POST(request: NextRequest) {
    const authError = await requireRole(request, ['admin']);
    if (authError) return authError;

    try {
        const body = await request.json();
        const { provider, name, credentials, settings } = body;

        if (!provider || !name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newConfig = db.providerConfigs.create({
            id: uuidv4(),
            provider,
            name,
            enabled: true,
            credentials,
            settings: settings || {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json(newConfig);
    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
