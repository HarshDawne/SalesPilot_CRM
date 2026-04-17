import { v4 as uuidv4 } from 'uuid';

// Mock Job Interface
export interface Job {
    id: string;
    data: any;
}

// Mock Queue Interface
export class Queue {
    name: string;
    jobs: Job[] = [];
    processor: ((job: Job) => Promise<void>) | null = null;

    constructor(name: string) {
        this.name = name;
    }

    async add(name: string, data: any, opts?: any) {
        const job = { id: uuidv4(), data };
        this.jobs.push(job);
        console.log(`[Queue:${this.name}] Job added:`, name, job.id);

        // Simulate async processing
        if (this.processor) {
            setTimeout(async () => {
                try {
                    console.log(`[Queue:${this.name}] Processing job:`, job.id);
                    await this.processor!(job);
                    console.log(`[Queue:${this.name}] Job completed:`, job.id);
                } catch (error) {
                    console.error(`[Queue:${this.name}] Job failed:`, job.id, error);
                }
            }, 100); // Small delay to simulate async
        }
        return job;
    }

    process(handler: (job: Job) => Promise<void>) {
        this.processor = handler;
    }
}

// Global Queue Instances
export const callQueue = new Queue('call_jobs');
export const waQueue = new Queue('wa_jobs');

// Initialize Workers (Simulated)
import { db } from './db';

callQueue.process(async (job) => {
    const { lead_id, attempt } = job.data;
    const lead = db.leads.findById(lead_id);
    if (!lead) {
        console.error("Lead not found for call job:", lead_id);
        return;
    }

    // Simulate Call Provider API Call
    console.log(`[CallWorker] Initiating call to ${lead.phone} (Attempt ${attempt})`);

    // Log 'call_initiated' activity
    db.activities.create({
        id: uuidv4(),
        leadId: lead_id,
        type: 'call_initiated',
        summary: `Call initiated to ${lead.phone}`,
        createdAt: new Date().toISOString(),
        metadata: { job_id: job.id, attempt },
        immutable: true
    });

    // In a real system, the provider would hit the webhook. 
    // Here, we can't easily self-trigger the webhook without a real HTTP request, 
    // but the verification script will simulate the webhook.
});
