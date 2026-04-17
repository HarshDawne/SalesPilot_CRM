import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService } from '@/modules/communication/whatsapp-service';

/**
 * Test endpoint for WhatsApp integration
 * POST /api/comm/test-whatsapp
 */
export async function POST(request: NextRequest) {
    try {
        const { phone, name } = await request.json();

        if (!phone || !name) {
            return NextResponse.json({
                error: 'Missing phone or name'
            }, { status: 400 });
        }

        const result = await WhatsAppService.sendMessage({
            to: phone,
            templateId: 'brochure_send',
            data: {
                leadName: name,
                propertyName: 'Test Property',
                bedrooms: '3',
                priceFormatted: '₹2.5 Cr',
                locality: 'Bandra',
                salesTeamName: 'Test Team'
            }
        });

        return NextResponse.json(result);

    } catch (error) {
        return NextResponse.json({
            error: String(error)
        }, { status: 500 });
    }
}
