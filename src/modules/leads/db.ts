// Lead Database Helper - Export for use in Communication Engine

import { LeadService } from './lead-service';
import type { Lead as LeadType } from './types';

export class LeadDb {
  static async getById(id: string): Promise<LeadType | null> {
    try {
      // Use getLeadById which falls back to persistent DB
      return await LeadService.getLeadById(id);
    } catch (error) {
      console.error('[LeadDb] Error getting lead:', error);
      return null;
    }
  }

  static async getAll(): Promise<LeadType[]> {
    try {
      return await LeadService.getLeads();
    } catch (error) {
      console.error('[LeadDb] Error getting all leads:', error);
      return [];
    }
  }

  static async getByIds(ids: string[]): Promise<LeadType[]> {
    try {
      const allLeads = await LeadService.getLeads();
      return allLeads.filter((l: LeadType) => ids.includes(l.id));
    } catch (error) {
      console.error('[LeadDb] Error getting leads by IDs:', error);
      return [];
    }
  }
}

// Export as default for easier imports
export const Lead = LeadDb;
