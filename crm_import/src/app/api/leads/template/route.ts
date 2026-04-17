import { NextResponse } from 'next/server';

export async function GET() {
    const csvHeader = "firstName,lastName,phone,email,source,budgetMin,budgetMax,preferredLocation";
    const csvSample = "John,Doe,+919876543210,john@example.com,Import,5000000,8000000,Mumbai";
    const csvContent = `${csvHeader}\n${csvSample}`;

    return new NextResponse(csvContent, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="lead_import_template.csv"',
        },
    });
}
