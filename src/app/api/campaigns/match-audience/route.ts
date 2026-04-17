import { NextRequest, NextResponse } from 'next/server';
import { leadService } from '@/lib/db';
import { Lead } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { propertyId, towerIds, unitIds, criteria } = body;

        // Mock Logic: In a real app, this would query a vector DB or advanced filter
        // Here we simulate AI matching based on Budget and Preferences
        const allLeads = leadService.getAllResults();

        // 1. Filter by Status (active leads only)
        let matches = allLeads.filter(l =>
            !['Booking_Done', 'Disqualified'].includes(l.currentStage)
        );

        // 2. Filter by Intent (Hot/Warm)
        // If "High Intent" requested
        if (criteria?.intent === 'high') {
            matches = matches.filter(l => (l.aiScore || 0) > 70);
        }

        // 3. Mock Budget Matching (Randomized for demo if no budget set)
        // In real app: matches = matches.filter(l => l.budgetMax >= unitPrice);

        return NextResponse.json({
            count: matches.length,
            leads: matches.slice(0, 50).map(l => ({
                id: l.id,
                name: l.name,
                matches: Math.floor(Math.random() * 20) + 80, // Mock Match Score %
                matchReason: "Matches budget and preferred location",
                tags: l.leadTags,
                score: l.aiScore
            }))
        });

    } catch (error) {
        console.error("Audience Matching Error:", error);
        return NextResponse.json({ error: "Failed to match audience" }, { status: 500 });
    }
}
