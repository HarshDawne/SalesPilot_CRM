import { NextRequest, NextResponse } from 'next/server';
import { db, Lead, LeadStage } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { realtimeEvents } from '@/lib/realtime';
import { addTimelineEvent, logLeadCreated } from '@/lib/timeline';
import { enrichLead } from '@/lib/enrichment';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search')?.toLowerCase();
    const stage = searchParams.get('stage') as LeadStage | null;
    const assignedAgent = searchParams.get('assignedAgent');
    const minScore = searchParams.get('minScore');

    let leads = db.leads.findAll();

    // Filter by search query
    if (search) {
        leads = leads.filter(lead => {
            const name = lead.name?.toLowerCase() || '';
            const firstName = lead.firstName?.toLowerCase() || '';
            const lastName = lead.lastName?.toLowerCase() || '';
            const phone = lead.primaryPhone || '';
            const email = lead.email?.toLowerCase() || '';

            return name.includes(search) ||
                firstName.includes(search) ||
                lastName.includes(search) ||
                phone.includes(search) ||
                email.includes(search);
        });
    }

    // Filter by stage
    if (stage) {
        leads = leads.filter(lead => lead.currentStage === stage);
    }

    // Filter by assigned agent
    if (assignedAgent) {
        leads = leads.filter(lead => lead.assignedAgentId === assignedAgent);
    }

    // Filter by minimum AI score
    if (minScore) {
        const minScoreNum = parseInt(minScore);
        leads = leads.filter(lead => (lead.aiScore || 0) >= minScoreNum);
    }

    // Sort by updatedAt desc (most recent first)
    leads.sort((a, b) => {
        const dateA = new Date(a.updatedAt).getTime();
        const dateB = new Date(b.updatedAt).getTime();
        return dateB - dateA;
    });

    return NextResponse.json(leads);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Consent check
        if ((body.source === 'FB_ADS' || body.source === 'META') && !body.consent) {
            return NextResponse.json(
                { error: "CONSENT_REQUIRED", message: "Consent required for this source" },
                { status: 409 }
            );
        }

        // Honeypot
        if (body.hp_field) {
            return NextResponse.json(
                { error: "SPAM", message: "Spam detected" },
                { status: 400 }
            );
        }

        // Deduplication
        const normalizedPhone = body.phone?.replace(/\D/g, '');
        const dedupeKeys = [
            `phone:${normalizedPhone}`,
            ...(body.email ? [`email:${body.email.toLowerCase()}`] : []),
            ...(body.dedupe_key ? [`dedupe:${body.dedupe_key}`] : [])
        ];

        // Strong Match
        const allLeads = db.leads.findAll();
        const strongMatch = allLeads.find(l => l.dedupe_keys?.some(k => dedupeKeys.includes(k)));

        if (strongMatch) {
            // Log duplicate submission in timeline
            addTimelineEvent({
                leadId: strongMatch.id,
                type: "note_added",
                summary: "Duplicate lead submission detected",
                actor: "system",
                payload: { source: body.source, formData: body }
            });

            return NextResponse.json({
                status: "duplicate",
                lead_id: strongMatch.id,
                duplicate: true,
                existing_lead_status: strongMatch.currentStage
            }, { status: 200 });
        }

        // Soft Match (Last 7 digits of phone)
        const phoneLast7 = normalizedPhone?.slice(-7);
        const softMatch = allLeads.find(l => {
            const leadPhone = l.primaryPhone?.replace(/\D/g, '');
            return leadPhone?.endsWith(phoneLast7 || '');
        });

        if (softMatch) {
            addTimelineEvent({
                leadId: softMatch.id,
                type: "note_added",
                summary: "Soft duplicate lead submission (phone match)",
                actor: "system",
                payload: { source: body.source, formData: body, note: 'soft_dedupe' }
            });

            return NextResponse.json({
                status: "duplicate",
                lead_id: softMatch.id,
                duplicate: true,
                existing_lead_status: softMatch.currentStage,
                note: "soft_dedupe"
            }, { status: 200 });
        }

        // Create New Lead
        const now = new Date().toISOString();
        const nameParts = body.name?.split(' ') || [];

        const newLead: Lead = {
            // Core identifiers
            id: uuidv4(),
            createdAt: now,
            updatedAt: now,

            // Source tracking
            createdVia: body.source?.toLowerCase() || "website",
            sourceCampaignId: body.campaign_id,
            page_url: body.page_url,
            form_id: body.form_id,

            // Contact information
            name: body.name || `${body.firstName || ''} ${body.lastName || ''}`.trim() || "Unknown",
            firstName: body.firstName || nameParts[0] || "Unknown",
            lastName: body.lastName || nameParts.slice(1).join(' ') || "",
            primaryPhone: body.phone,
            secondaryPhone: body.altPhone,
            email: body.email,
            preferredContactMethod: body.preferredContactMethod || "whatsapp",
            preferredLanguage: body.preferredLanguage || "en",
            address: body.address,

            // Lead management
            leadTags: body.tags || ["New"],
            assignedAgentId: body.assignedAgentId,
            currentStage: "New",
            aiScore: 0,

            // Device & tracking
            device: body.device,
            consent: body.consent,
            meta: body.meta,
            dedupe_keys: dedupeKeys,
            utm: body.utm,

            // Capture details
            captureDetails: {
                formData: body,
                ip: body.device?.ip,
                utm: body.utm,
                referrer: body.referrer
            },

            // Legacy compatibility
            source: body.source || "WEBSITE",
            budgetMin: body.budgetMin,
            budgetMax: body.budgetMax,
            preferredLocation: body.preferredLocation,
            unitType: body.unitType,
            version: 1
        };

        // Apply AI Enrichment
        const enrichedLead = enrichLead(newLead);

        const createdLead = db.leads.create(enrichedLead);

        // Log lead creation in timeline
        logLeadCreated(createdLead.id, createdLead.createdVia, {
            source: body.source,
            page_url: body.page_url,
            form_id: body.form_id,
            utm: body.utm
        });

        // Emit real-time event
        realtimeEvents.emitLeadCreated(createdLead);

        // Enqueue AI Call Job
        const { callQueue } = await import('@/lib/queue');
        await callQueue.add('call_job', {
            job_id: uuidv4(),
            lead_id: newLead.id,
            attempt: 1,
            max_attempts: 3,
            trace_id: uuidv4()
        });

        // Log AI call queued
        addTimelineEvent({
            leadId: createdLead.id,
            type: "ai_call_attempt",
            summary: "AI call queued (attempt #1)",
            actor: "system",
            payload: { attempt: 1, max_attempts: 3 }
        });

        // Emit metrics update
        realtimeEvents.emitMetricsUpdated();

        return NextResponse.json({
            status: "created",
            lead_id: newLead.id
        }, { status: 201 });

    } catch (error) {
        console.error("Lead creation error:", error);
        return NextResponse.json(
            { error: "ServerError", message: "Failed to create lead" },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { leadId, updates, actor } = body;

        if (!leadId) {
            return NextResponse.json(
                { error: "Missing leadId" },
                { status: 400 }
            );
        }

        const existingLead = db.leads.findById(leadId);
        if (!existingLead) {
            return NextResponse.json(
                { error: "Lead not found" },
                { status: 404 }
            );
        }

        // Track stage changes
        if (updates.currentStage && updates.currentStage !== existingLead.currentStage) {
            addTimelineEvent({
                leadId,
                type: "stage_changed",
                summary: `Stage changed from ${existingLead.currentStage} to ${updates.currentStage}`,
                actor: actor || "system",
                payload: {
                    fromStage: existingLead.currentStage,
                    toStage: updates.currentStage
                }
            });
        }

        const updatedLead = db.leads.update(leadId, updates);

        // Emit real-time update
        realtimeEvents.emitMetricsUpdated();

        return NextResponse.json(updatedLead);

    } catch (error) {
        console.error("Lead update error:", error);
        return NextResponse.json(
            { error: "ServerError", message: "Failed to update lead" },
            { status: 500 }
        );
    }
}
