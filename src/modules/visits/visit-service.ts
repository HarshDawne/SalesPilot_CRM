import fs from 'fs/promises';
import path from 'path';

export interface SiteVisit {
    id: string;
    leadId: string;
    leadName: string;
    leadPhone: string;
    propertyId?: string;
    propertyName: string;
    campaignId?: string;
    jobId?: string; // If booked from call

    scheduledDate: string; // YYYY-MM-DD
    scheduledTime: string; // HH:MM

    assignedAgent?: string;
    meetingPoint?: string;

    status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export class VisitService {
    private static VISITS_FILE = path.join(process.cwd(), 'data', 'site-visits.json');

    /**
     * Create a new site visit
     */
    static async createVisit(visit: Omit<SiteVisit, 'id' | 'createdAt' | 'updatedAt'>): Promise<SiteVisit> {
        const visits = await this.loadVisits();

        const newVisit: SiteVisit = {
            ...visit,
            id: `visit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        visits.push(newVisit);
        await this.saveVisits(visits);

        console.log(`[VisitService] ✅ Created visit ${newVisit.id} for ${visit.leadName}`);

        return newVisit;
    }

    /**
     * Get all upcoming visits
     */
    static async getUpcomingVisits(daysAhead: number = 30): Promise<SiteVisit[]> {
        const visits = await this.loadVisits();
        const now = new Date();
        const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

        return visits.filter(v => {
            if (v.status === 'CANCELLED' || v.status === 'COMPLETED') return false;
            const visitDate = new Date(v.scheduledDate);
            return visitDate >= now && visitDate <= futureDate;
        }).sort((a, b) => {
            const dateA = new Date(`${a.scheduledDate}T${a.scheduledTime}`);
            const dateB = new Date(`${b.scheduledDate}T${b.scheduledTime}`);
            return dateA.getTime() - dateB.getTime();
        });
    }

    /**
     * Get visit by ID
     */
    static async getVisitById(id: string): Promise<SiteVisit | null> {
        const visits = await this.loadVisits();
        return visits.find(v => v.id === id) || null;
    }

    /**
     * Update visit status
     */
    static async updateVisit(id: string, updates: Partial<SiteVisit>): Promise<SiteVisit | null> {
        const visits = await this.loadVisits();
        const index = visits.findIndex(v => v.id === id);

        if (index === -1) return null;

        visits[index] = {
            ...visits[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        await this.saveVisits(visits);

        console.log(`[VisitService] Updated visit ${id}`);

        return visits[index];
    }

    /**
     * Get visits for today
     */
    static async getTodayVisits(): Promise<SiteVisit[]> {
        const visits = await this.loadVisits();
        const today = new Date().toISOString().split('T')[0];

        return visits.filter(v =>
            v.scheduledDate === today &&
            v.status !== 'CANCELLED'
        );
    }

    /**
     * Load visits from file
     */
    private static async loadVisits(): Promise<SiteVisit[]> {
        try {
            const content = await fs.readFile(this.VISITS_FILE, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            return [];
        }
    }

    /**
     * Save visits to file
     */
    private static async saveVisits(visits: SiteVisit[]): Promise<void> {
        await fs.writeFile(this.VISITS_FILE, JSON.stringify(visits, null, 2));
    }
}
