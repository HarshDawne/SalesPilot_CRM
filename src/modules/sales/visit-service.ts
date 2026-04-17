import { db, Booking } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export type CreateVisitDTO = Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>;

export class VisitService {
    static async createVisit(data: Partial<Booking>): Promise<Booking> {
        const newVisit: Booking = {
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'confirmed', // Default to confirmed if AI extracts it
            mode: 'site_visit',
            visitType: 'first_visit',
            duration: 60, // Default 1 hour
            // Defaults for required fields if missing
            leadId: data.leadId || 'unknown',
            slotStart: data.slotStart || new Date().toISOString(),
            slotEnd: data.slotEnd || new Date(Date.now() + 3600000).toISOString(),
            ...data
        } as Booking;

        db.bookings.create(newVisit);
        return newVisit;
    }

    static async getVisits(startDate?: Date, endDate?: Date): Promise<Booking[]> {
        if (startDate && endDate) {
            return db.bookings.findByDateRange(startDate.toISOString(), endDate.toISOString());
        }
        return db.bookings.findAll();
    }

    static async getVisitsByLead(leadId: string): Promise<Booking[]> {
        return db.bookings.findByLeadId(leadId);
    }
}
