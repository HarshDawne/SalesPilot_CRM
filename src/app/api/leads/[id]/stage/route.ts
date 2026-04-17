import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const leadId = id;
        const { stage } = await request.json();

        // Read existing leads
        const fs = require('fs').promises;
        const path = require('path');
        const leadsPath = path.join(process.cwd(), 'data', 'leads.json');

        // Ensure directory exists
        const dataDir = path.dirname(leadsPath);
        await fs.mkdir(dataDir, { recursive: true }).catch(() => { });

        let leadsData = { leads: [] };
        try {
            const content = await fs.readFile(leadsPath, 'utf-8');
            leadsData = JSON.parse(content);
        } catch (error) {
            // If file doesn't exist, we can't update anything
            return NextResponse.json(
                { success: false, error: 'Lead database not found' },
                { status: 404 }
            );
        }

        // Find lead
        const leadIndex = leadsData.leads.findIndex((l: any) => l.id === leadId);
        if (leadIndex === -1) {
            return NextResponse.json(
                { success: false, error: 'Lead not found' },
                { status: 404 }
            );
        }

        // Update stage
        const lead = leadsData.leads[leadIndex] as any;
        lead.currentStage = stage;
        lead.updatedAt = new Date().toISOString();

        // Save back
        await fs.writeFile(leadsPath, JSON.stringify(leadsData, null, 2));

        return NextResponse.json({
            success: true,
            lead: leadsData.leads[leadIndex]
        });
    } catch (error) {
        console.error('Error updating lead stage:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update lead stage' },
            { status: 500 }
        );
    }
}
