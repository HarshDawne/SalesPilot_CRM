import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/modules/communication/email-service';

/**
 * Test endpoint for Email integration
 * POST /api/comm/test-email
 */
export async function POST(request: NextRequest) {
    try {
        const { email, name } = await request.json();

        if (!email || !name) {
            return NextResponse.json({
                error: 'Missing email or name'
            }, { status: 400 });
        }

        const result = await EmailService.sendTemplateEmail({
            leadEmail: email,
            leadName: name,
            templateId: 'project_details',
            data: {
                propertyName: 'Test Property',
                locality: 'Bandra West',
                city: 'Mumbai',
                bedrooms: '3',
                areaRange: '1200-1500',
                priceRange: '₹2.2 Cr - ₹2.8 Cr',
                amenitiesHtml: '<span class="amenity">Swimming Pool</span><span class="amenity">Gym</span>',
                scheduleSiteVisitUrl: 'https://example.com/schedule',
                salesPhone: '+91 98765 43210',
                salesTeamName: 'Test Sales Team'
            }
        });

        return NextResponse.json(result);

    } catch (error) {
        return NextResponse.json({
            error: String(error)
        }, { status: 500 });
    }
}
