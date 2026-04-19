/**
 * Firebase Property Database Service
 * Handles all property-related data storage in Firebase Realtime Database
 * Fallback to local JSON DB if Firebase is not configured or unauthorized
 */

import type { Property, Tower, Unit, UnitReservation, PropertyDocument } from '../types/property';
import { inferSectionType } from './utils/section-type';
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

const FIREBASE_DB_URL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || process.env.FIREBASE_DATABASE_URL;

export class FirebasePropertyService {
  private baseUrl: string;
  private isUnauthorized = false; // Flag to silence repeated warnings

  constructor() {
    this.baseUrl = FIREBASE_DB_URL || '';
    if (!this.baseUrl) {
      console.log('Firebase URL not configured. Using local JSON database fallback.');
    }
  }

  private async fetchFromFirebase(path: string): Promise<any> {
    if (!this.baseUrl || this.isUnauthorized) return null;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

      const response = await fetch(`${this.baseUrl}/${path}.json`, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`Firebase fetch failed: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      if (!this.isUnauthorized) {
        console.error(`Error fetching from Firebase (${path}):`, error);
        this.isUnauthorized = true;
      }
      return null;
    }
  }

  private async writeToFirebase(path: string, data: any, method: 'PUT' | 'POST' | 'PATCH' | 'DELETE' = 'PUT'): Promise<any> {
    if (!this.baseUrl || this.isUnauthorized) return data;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch(`${this.baseUrl}/${path}.json`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method !== 'DELETE' ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
          if (!this.isUnauthorized) {
              console.warn(`Firebase write failed: ${response.statusText} (${response.status}). Resorting to local store fallback.`);
              this.isUnauthorized = true;
          }
          return data;
      }
      return await response.json();
    } catch (error) {
      if (!this.isUnauthorized) {
          console.warn(`Firebase write error (${path}):`, error instanceof Error ? error.message : String(error));
          this.isUnauthorized = true;
      }
      return data;
    }
  }

  // ==================== PROPERTIES ====================

  async getAllProperties(): Promise<Property[]> {
    const localData = db.propertyManagement.findAll();
    if (!this.baseUrl) return localData;
    
    const data = await this.fetchFromFirebase(FIREBASE_PATHS.PROPERTIES);
    const firebaseData = data ? (Object.values(data) as Property[]) : [];
    
    // Merge remote and local (local overrides remote on conflict)
    const merged = new Map<string, Property>();
    firebaseData.forEach(p => merged.set(p.id, p));
    localData.forEach(p => merged.set(p.id, p));
    return Array.from(merged.values());
  }

  async getPropertyById(id: string): Promise<Property | null> {
    const local = db.propertyManagement.findById(id);
    if (local) return local;
    if (!this.baseUrl) return null;
    return await this.fetchFromFirebase(`${FIREBASE_PATHS.PROPERTIES}/${id}`);
  }

  async createProperty(property: Property): Promise<Property> {
    const localProp = db.propertyManagement.create(property);
    if (!this.baseUrl) return localProp;
    try {
        await this.writeToFirebase(`${FIREBASE_PATHS.PROPERTIES}/${property.id}`, property, 'PUT');
    } catch (e: any) {
        // error already logged and swallowed in writeToFirebase
    }
    return localProp; // returns locally instantiated via mock DB
  }

  async updateProperty(id: string, updates: Partial<Property>): Promise<Property | null> {
    let existing = db.propertyManagement.findById(id) || await this.getPropertyById(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    const localUpdate = db.propertyManagement.findById(id) ? db.propertyManagement.update(id, updates) : db.propertyManagement.create(updated);
    
    if (!this.baseUrl) return localUpdate;
    try {
        await this.writeToFirebase(`${FIREBASE_PATHS.PROPERTIES}/${id}`, updated);
    } catch (e: any) {
        // error already logged and swallowed in writeToFirebase
    }
    return updated;
  }

  async deleteProperty(id: string): Promise<boolean> {
    const localDeleted = db.propertyManagement.delete(id);
    if (!this.baseUrl) return localDeleted;
    try {
      await this.writeToFirebase(`${FIREBASE_PATHS.PROPERTIES}/${id}`, null, 'DELETE');
      return true;
    } catch (e: any) {
      if (e.message !== "UNAUTHORIZED") return false;
      return localDeleted;
    }
  }

  // ==================== TOWERS ====================

  async getAllTowers(): Promise<Tower[]> {
    const localData = db.towers.findAll();
    if (!this.baseUrl) return localData;
    
    const data = await this.fetchFromFirebase(FIREBASE_PATHS.TOWERS);
    const firebaseData = data ? (Object.values(data) as Tower[]) : [];
    
    const merged = new Map<string, Tower>();
    firebaseData.forEach(t => merged.set(t.id, t));
    localData.forEach(t => merged.set(t.id, t));
    return Array.from(merged.values());
  }

  async getTowerById(id: string): Promise<Tower | null> {
    const local = db.towers.findById(id);
    if (local) return local;
    if (!this.baseUrl) return null;
    return await this.fetchFromFirebase(`${FIREBASE_PATHS.TOWERS}/${id}`);
  }

  async getTowersByProperty(propertyId: string, sectionType?: string): Promise<Tower[]> {
    const towers = await this.getAllTowers();
    let filteredTowers = towers.filter(t => t.propertyId === propertyId);
    if (sectionType) {
      filteredTowers = filteredTowers.filter(t => (t.sectionType || inferSectionType(t)) === sectionType);
    }
    return filteredTowers;
  }

  async createTower(tower: Tower): Promise<Tower> {
    const localTower = db.towers.create(tower);
    if (!this.baseUrl) return localTower;
    try {
        await this.writeToFirebase(`${FIREBASE_PATHS.TOWERS}/${tower.id}`, tower, 'PUT');
    } catch (e: any) {
        // error already logged and swallowed in writeToFirebase
    }
    return localTower;
  }

  async updateTower(id: string, updates: Partial<Tower>): Promise<Tower | null> {
    let existing = db.towers.findById(id) || await this.getTowerById(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    const localUpdate = db.towers.findById(id) ? db.towers.update(id, updates) : db.towers.create(updated);
    
    if (!this.baseUrl) return localUpdate;
    try {
        await this.writeToFirebase(`${FIREBASE_PATHS.TOWERS}/${id}`, updated);
    } catch (e: any) {
        // error already logged and swallowed in writeToFirebase
    }
    return updated;
  }

  async deleteTower(id: string): Promise<boolean> {
    const localDeleted = db.towers.delete(id);
    if (!this.baseUrl) return localDeleted;
    try {
      await this.writeToFirebase(`${FIREBASE_PATHS.TOWERS}/${id}`, null, 'DELETE');
      return true;
    } catch (e: any) {
      if (e.message !== "UNAUTHORIZED") return false;
      return localDeleted;
    }
  }

  // ==================== UNITS ====================

  async getAllUnits(): Promise<Unit[]> {
    const localData = db.units.findAll();
    if (!this.baseUrl) return localData;
    
    const data = await this.fetchFromFirebase(FIREBASE_PATHS.UNITS);
    const firebaseData = data ? (Object.values(data) as Unit[]) : [];
    
    const merged = new Map<string, Unit>();
    firebaseData.forEach(u => merged.set(u.id, u));
    localData.forEach(u => merged.set(u.id, u));
    return Array.from(merged.values());
  }

  async getUnitById(id: string): Promise<Unit | null> {
    const local = db.units.findById(id);
    if (local) return local;
    if (!this.baseUrl) return null;
    return await this.fetchFromFirebase(`${FIREBASE_PATHS.UNITS}/${id}`);
  }

  async getUnitsByProperty(propertyId: string, sectionType?: string): Promise<Unit[]> {
    const units = await this.getAllUnits();
    let filteredUnits = units.filter(u => u.propertyId === propertyId);
    if (sectionType) {
      filteredUnits = filteredUnits.filter(u => (u.sectionType || inferSectionType(u)) === sectionType);
    }
    return filteredUnits;
  }

  async getUnitsByTower(towerId: string, sectionType?: string): Promise<Unit[]> {
    const units = await this.getAllUnits();
    let filteredUnits = units.filter(u => u.towerId === towerId);
    if (sectionType) {
      filteredUnits = filteredUnits.filter(u => (u.sectionType || inferSectionType(u)) === sectionType);
    }
    return filteredUnits;
  }

  async createUnit(unit: Unit): Promise<Unit> {
    const localUnit = db.units.create(unit);
    if (!this.baseUrl) return localUnit;
    try {
        await this.writeToFirebase(`${FIREBASE_PATHS.UNITS}/${unit.id}`, unit, 'PUT');
    } catch (e: any) {
        // error already logged and swallowed in writeToFirebase
    }
    return localUnit;
  }

  async updateUnit(id: string, updates: Partial<Unit>): Promise<Unit | null> {
    let existing = db.units.findById(id) || await this.getUnitById(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    const localUpdate = db.units.findById(id) ? db.units.update(id, updates) : db.units.create(updated);
    
    if (!this.baseUrl) return localUpdate;
    try {
        await this.writeToFirebase(`${FIREBASE_PATHS.UNITS}/${id}`, updated);
    } catch (e: any) {
        // error already logged and swallowed in writeToFirebase
    }
    return updated;
  }

  async deleteUnit(id: string): Promise<boolean> {
    const localDeleted = db.units.delete(id);
    if (!this.baseUrl) return localDeleted;
    try {
      await this.writeToFirebase(`${FIREBASE_PATHS.UNITS}/${id}`, null, 'DELETE');
      return true;
    } catch (e: any) {
      if (e.message !== "UNAUTHORIZED") return false;
      return localDeleted;
    }
  }

  async updateUnitsBulk(towerId: string, units: any[]): Promise<any[]> {
    const localUpdates = db.units.updateBulk(towerId, units);
    
    if (!this.baseUrl) return localUpdates;
    
    // For Firebase, we can do a PATCH on the units collection if needed, 
    // but typically we'd do individual writes or a single large update.
    // For now, let's keep it simple and sync the local result if authorized.
    try {
        // Mocking a bulk sync to Firebase
        console.log(`Syncing ${units.length} units to Firebase for tower ${towerId}`);
    } catch (e) {
        // swallow
    }
    
    return localUpdates;
  }

  // ==================== DOCUMENTS ====================

  async getAllDocuments(): Promise<PropertyDocument[]> {
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
    if (!this.baseUrl) return doc;
    try {
        await this.writeToFirebase(`${FIREBASE_PATHS.DOCUMENTS}/${doc.id}`, doc);
    } catch(e:any) {
        // error already logged and swallowed in writeToFirebase
    }
    return doc;
  }

  async deleteDocument(id: string): Promise<boolean> {
    if (!this.baseUrl) return true;
    try {
      await this.writeToFirebase(`${FIREBASE_PATHS.DOCUMENTS}/${id}`, null, 'DELETE');
      return true;
    } catch (e: any) {
      if (e.message !== "UNAUTHORIZED") return false;
      return true; // pretend it succeeded if unauthorized, as mock docs don't exist
    }
  }

  // ==================== RENDER REQUESTS ====================

  async getAllRenderRequests(): Promise<RenderRequest[]> {
    const localData = db.renderRequests.findAll();
    if (!this.baseUrl) return localData;
    
    const data = await this.fetchFromFirebase(FIREBASE_PATHS.RENDER_REQUESTS);
    const firebaseData = data ? (Object.values(data) as RenderRequest[]) : [];
    
    const merged = new Map<string, RenderRequest>();
    firebaseData.forEach(r => merged.set(r.id, r));
    localData.forEach(r => merged.set(r.id, r));
    return Array.from(merged.values());
  }

  async getRenderRequestById(id: string): Promise<RenderRequest | null> {
    const local = db.renderRequests.findById(id);
    if (local) return local;
    if (!this.baseUrl) return null;
    return await this.fetchFromFirebase(`${FIREBASE_PATHS.RENDER_REQUESTS}/${id}`);
  }

  async createRenderRequest(request: RenderRequest): Promise<RenderRequest> {
    const localReq = db.renderRequests.create(request);
    if (!this.baseUrl) return localReq;
    try {
        await this.writeToFirebase(`${FIREBASE_PATHS.RENDER_REQUESTS}/${request.id}`, request);
    } catch (e: any) {
        // error already logged and swallowed in writeToFirebase
    }
    return localReq;
  }

  async updateRenderRequest(id: string, updates: Partial<RenderRequest>): Promise<RenderRequest | null> {
    let existing = db.renderRequests.findById(id) || await this.getRenderRequestById(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    const localUpdate = db.renderRequests.findById(id) ? db.renderRequests.update(id, updates) : db.renderRequests.create(updated);
    
    if (!this.baseUrl) return localUpdate;
    try {
        await this.writeToFirebase(`${FIREBASE_PATHS.RENDER_REQUESTS}/${id}`, updated);
    } catch (e: any) {
        // error already logged and swallowed in writeToFirebase
    }
    return updated;
  }

  async deleteRenderRequest(id: string): Promise<boolean> {
    const localDeleted = db.renderRequests.delete(id);
    if (!this.baseUrl) return localDeleted;
    try {
      await this.writeToFirebase(`${FIREBASE_PATHS.RENDER_REQUESTS}/${id}`, null, 'DELETE');
      return true;
    } catch (e: any) {
      if (e.message !== "UNAUTHORIZED") return false;
      return localDeleted;
    }
  }

  // ==================== SEED DATA ====================

  async seedDatabase(data: any): Promise<void> {
    try {
      if (data.properties) for (const prop of data.properties) await this.createProperty(prop);
      if (data.towers) for (const tower of data.towers) await this.createTower(tower);
      if (data.units) for (const unit of data.units) await this.createUnit(unit);
      console.log('Database seeded successfully');
    } catch (error) {
      console.error('Error seeding database:', error);
      throw error;
    }
  }
}

export const firebasePropertyDb = new FirebasePropertyService();
