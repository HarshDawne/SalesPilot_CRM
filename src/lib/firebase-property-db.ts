/**
 * Firebase Property Database Service
 * Handles all property-related data storage in Firebase Realtime Database
 * Fallback to local JSON DB if Firebase is not configured
 */

import type { Property, Tower, Unit, UnitReservation, PropertyDocument } from '@/types/property';
import type { RenderRequest, Render3D } from '@/types/render';
import { db } from './db'; // Import local DB for fallback

// Firebase paths
const FIREBASE_PATHS = {
  PROPERTIES: 'propertyManagement',
  TOWERS: 'towers',
  UNITS: 'units',
  RESERVATIONS: 'unitReservations',
  DOCUMENTS: 'propertyDocuments',
  RENDER_REQUESTS: 'renderRequests',
  RENDERS: 'renders3D',
};

// Get Firebase database URL from environment
const FIREBASE_DB_URL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || process.env.FIREBASE_DATABASE_URL;

/**
 * Firebase Property Service
 * Provides CRUD operations for property management data
 */
export class FirebasePropertyService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = FIREBASE_DB_URL || '';
    if (!this.baseUrl) {
      console.log('Firebase URL not configured. Using local JSON database fallback.');
    }
  }

  private async fetchFromFirebase(path: string): Promise<any> {
    if (!this.baseUrl) return null;

    try {
      const response = await fetch(`${this.baseUrl}/${path}.json`);
      if (!response.ok) throw new Error(`Firebase fetch failed: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching from Firebase (${path}):`, error);
      return null;
    }
  }

  private async writeToFirebase(path: string, data: any, method: 'PUT' | 'POST' | 'PATCH' | 'DELETE' = 'PUT'): Promise<any> {
    if (!this.baseUrl) return data;

    try {
      const response = await fetch(`${this.baseUrl}/${path}.json`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method !== 'DELETE' ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) throw new Error(`Firebase write failed: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error(`Error writing to Firebase (${path}):`, error);
      throw error;
    }
  }

  // ==================== PROPERTIES ====================

  async getAllProperties(): Promise<Property[]> {
    if (!this.baseUrl) return db.propertyManagement.findAll();
    const data = await this.fetchFromFirebase(FIREBASE_PATHS.PROPERTIES);
    return data ? Object.values(data) : [];
  }

  async getPropertyById(id: string): Promise<Property | null> {
    if (!this.baseUrl) return db.propertyManagement.findById(id) || null;
    const data = await this.fetchFromFirebase(`${FIREBASE_PATHS.PROPERTIES}/${id}`);
    return data;
  }

  async createProperty(property: Property): Promise<Property> {
    if (!this.baseUrl) return db.propertyManagement.create(property);
    // Use PUT with property ID to replace/upsert instead of POST which creates duplicates
    await this.writeToFirebase(`${FIREBASE_PATHS.PROPERTIES}/${property.id}`, property, 'PUT');
    return property;
  }

  async updateProperty(id: string, updates: Partial<Property>): Promise<Property | null> {
    if (!this.baseUrl) return db.propertyManagement.update(id, updates);
    const existing = await this.getPropertyById(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await this.writeToFirebase(`${FIREBASE_PATHS.PROPERTIES}/${id}`, updated);
    return updated;
  }

  async deleteProperty(id: string): Promise<boolean> {
    if (!this.baseUrl) return db.propertyManagement.delete(id);
    try {
      await this.writeToFirebase(`${FIREBASE_PATHS.PROPERTIES}/${id}`, null, 'DELETE');
      return true;
    } catch (error) {
      return false;
    }
  }

  // ==================== TOWERS ====================

  async getAllTowers(): Promise<Tower[]> {
    if (!this.baseUrl) return db.towers.findAll();
    const data = await this.fetchFromFirebase(FIREBASE_PATHS.TOWERS);
    return data ? Object.values(data) : [];
  }

  async getTowerById(id: string): Promise<Tower | null> {
    if (!this.baseUrl) return db.towers.findById(id) || null;
    const data = await this.fetchFromFirebase(`${FIREBASE_PATHS.TOWERS}/${id}`);
    return data;
  }

  async getTowersByProperty(propertyId: string): Promise<Tower[]> {
    if (!this.baseUrl) return db.towers.findByProperty(propertyId);
    const towers = await this.getAllTowers();
    return towers.filter(t => t.propertyId === propertyId);
  }

  async createTower(tower: Tower): Promise<Tower> {
    if (!this.baseUrl) return db.towers.create(tower);
    // Use PUT with tower ID to replace/upsert instead of creating duplicates
    await this.writeToFirebase(`${FIREBASE_PATHS.TOWERS}/${tower.id}`, tower, 'PUT');
    return tower;
  }

  async updateTower(id: string, updates: Partial<Tower>): Promise<Tower | null> {
    if (!this.baseUrl) return db.towers.update(id, updates);
    const existing = await this.getTowerById(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await this.writeToFirebase(`${FIREBASE_PATHS.TOWERS}/${id}`, updated);
    return updated;
  }

  // ==================== UNITS ====================

  async getAllUnits(): Promise<Unit[]> {
    if (!this.baseUrl) return db.units.findAll();
    const data = await this.fetchFromFirebase(FIREBASE_PATHS.UNITS);
    return data ? Object.values(data) : [];
  }

  async getUnitById(id: string): Promise<Unit | null> {
    if (!this.baseUrl) return db.units.findById(id) || null;
    const data = await this.fetchFromFirebase(`${FIREBASE_PATHS.UNITS}/${id}`);
    return data;
  }

  async getUnitsByProperty(propertyId: string): Promise<Unit[]> {
    if (!this.baseUrl) return db.units.findByProperty(propertyId);
    const units = await this.getAllUnits();
    return units.filter(u => u.propertyId === propertyId);
  }

  async getUnitsByTower(towerId: string): Promise<Unit[]> {
    if (!this.baseUrl) return db.units.findByTower(towerId);
    const units = await this.getAllUnits();
    return units.filter(u => u.towerId === towerId);
  }

  async createUnit(unit: Unit): Promise<Unit> {
    if (!this.baseUrl) return db.units.create(unit);
    // Use PUT with unit ID to replace/upsert instead of creating duplicates
    await this.writeToFirebase(`${FIREBASE_PATHS.UNITS}/${unit.id}`, unit, 'PUT');
    return unit;
  }

  async updateUnit(id: string, updates: Partial<Unit>): Promise<Unit | null> {
    if (!this.baseUrl) return db.units.update(id, updates);
    const existing = await this.getUnitById(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await this.writeToFirebase(`${FIREBASE_PATHS.UNITS}/${id}`, updated);
    return updated;
  }

  // ==================== DOCUMENTS ====================

  async getAllDocuments(): Promise<PropertyDocument[]> {
    // Local DB doesn't have documents collection yet, so we use in-memory or empty
    if (!this.baseUrl) return [];
    const data = await this.fetchFromFirebase(FIREBASE_PATHS.DOCUMENTS);
    return data ? Object.values(data) : [];
  }

  async getDocumentsByProperty(propertyId: string, towerId?: string, unitId?: string): Promise<PropertyDocument[]> {
    const docs = await this.getAllDocuments();
    return docs.filter(d => {
      if (d.propertyId !== propertyId) return false;
      if (towerId && d.towerId !== towerId) return false;
      if (unitId && d.unitId !== unitId) return false;
      return true;
    });
  }

  async createDocument(doc: PropertyDocument): Promise<PropertyDocument> {
    if (!this.baseUrl) {
      // For local, we can't persist easily without updating db.ts schema
      // But we can just return it to simulate success
      console.log('Mock saving document locally:', doc.name);
      return doc;
    }
    await this.writeToFirebase(`${FIREBASE_PATHS.DOCUMENTS}/${doc.id}`, doc);
    return doc;
  }

  async deleteDocument(id: string): Promise<boolean> {
    if (!this.baseUrl) return true;
    try {
      await this.writeToFirebase(`${FIREBASE_PATHS.DOCUMENTS}/${id}`, null, 'DELETE');
      return true;
    } catch (error) {
      return false;
    }
  }

  // ==================== RENDER REQUESTS ====================

  async getAllRenderRequests(): Promise<RenderRequest[]> {
    if (!this.baseUrl) return [];
    const data = await this.fetchFromFirebase(FIREBASE_PATHS.RENDER_REQUESTS);
    return data ? Object.values(data) : [];
  }

  async getRenderRequestById(id: string): Promise<RenderRequest | null> {
    if (!this.baseUrl) return null;
    const data = await this.fetchFromFirebase(`${FIREBASE_PATHS.RENDER_REQUESTS}/${id}`);
    return data;
  }

  async getRenderRequestsByProperty(propertyId: string): Promise<RenderRequest[]> {
    const requests = await this.getAllRenderRequests();
    return requests.filter(r => r.propertyId === propertyId);
  }

  async createRenderRequest(request: RenderRequest): Promise<RenderRequest> {
    if (!this.baseUrl) {
      console.log('Mock saving render request locally:', request.id);
      return request;
    }
    await this.writeToFirebase(`${FIREBASE_PATHS.RENDER_REQUESTS}/${request.id}`, request);
    return request;
  }

  async updateRenderRequest(id: string, updates: Partial<RenderRequest>): Promise<RenderRequest | null> {
    if (!this.baseUrl) return null;
    const existing = await this.getRenderRequestById(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await this.writeToFirebase(`${FIREBASE_PATHS.RENDER_REQUESTS}/${id}`, updated);
    return updated;
  }

  // ==================== SEED DATA ====================

  async seedDatabase(data: {
    properties?: Property[];
    towers?: Tower[];
    units?: Unit[];
    documents?: PropertyDocument[];
    renderRequests?: RenderRequest[];
  }): Promise<void> {
    try {
      if (data.properties) {
        for (const prop of data.properties) {
          await this.createProperty(prop);
        }
      }

      if (data.towers) {
        for (const tower of data.towers) {
          await this.createTower(tower);
        }
      }

      if (data.units) {
        for (const unit of data.units) {
          await this.createUnit(unit);
        }
      }

      if (data.documents) {
        for (const doc of data.documents) {
          await this.createDocument(doc);
        }
      }

      if (data.renderRequests) {
        for (const req of data.renderRequests) {
          await this.createRenderRequest(req);
        }
      }

      console.log('Database seeded successfully');
    } catch (error) {
      console.error('Error seeding database:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const firebasePropertyDb = new FirebasePropertyService();
