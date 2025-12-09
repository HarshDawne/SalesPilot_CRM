import { NextRequest, NextResponse } from 'next/server';
import { db, Lead } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const text = await file.text();
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());

        const leadsToCreate: any[] = [];
        const errors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = line.split(',').map(v => v.trim());
            const leadData: any = {};

            headers.forEach((header, index) => {
                leadData[header] = values[index];
            });

            // Basic Validation
            if (!leadData.firstName || !leadData.phone) {
                errors.push(`Row ${i + 1}: Missing Name or Phone`);
                continue;
            }

            leadsToCreate.push(leadData);
        }

        let createdCount = 0;
        let duplicateCount = 0;

        for (const data of leadsToCreate) {
            // Deduplication Check
            const existingLead = db.leads.findByPhoneOrEmail(data.phone, data.email);

            if (existingLead) {
                duplicateCount++;
                // Log duplicate activity
                db.activities.create({
                    id: uuidv4(),
                    leadId: existingLead.id,
                    type: 'form_submission',
                    summary: 'Duplicate lead from Import',
                    createdAt: new Date().toISOString(),
                    metadata: { ...data, duplicate: true }
                });
                continue;
            }

            const newLead: Lead = {
                id: uuidv4(),
                firstName: data.firstName,
                lastName: data.lastName || "",
                email: data.email || "",
                phone: data.phone,
                source: data.source || "Import",
                budgetMin: Number(data.budgetMin) || 0,
                budgetMax: Number(data.budgetMax) || 0,
                preferredLocation: data.preferredLocation || "",
                status: "New",
                dedupe_keys: [`phone:${data.phone}`, `email:${data.email}`],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastContactedAt: new Date().toISOString(),
                tags: ["Imported"],
                score: 10
            };

            const createdLead = db.leads.create(newLead);
            createdCount++;

            // Log creation activity
            db.activities.create({
                id: uuidv4(),
                leadId: createdLead.id,
                type: 'form_submission',
                summary: 'Lead created via Import',
                createdAt: new Date().toISOString(),
                metadata: data
            });
        }

        return NextResponse.json({
            status: "success",
            created: createdCount,
            duplicates: duplicateCount,
            errors: errors
        });

    } catch (error) {
        console.error("Import Error:", error);
        return NextResponse.json({ error: "Failed to import leads" }, { status: 500 });
    }
}
