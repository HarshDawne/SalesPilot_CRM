import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    const leads = db.leads.findAll();

    const headers = ["ID", "First Name", "Last Name", "Phone", "Email", "Status", "Source", "Created At"];
    const rows = leads.map(lead => [
        lead.id,
        lead.firstName || "",
        lead.lastName || "",
        lead.primaryPhone,
        lead.email || "",
        lead.currentStage,
        lead.createdVia || "",
        lead.createdAt
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="leads_export_${new Date().toISOString().split('T')[0]}.csv"`,
        },
    });
}
