import { Project, Tower, Unit, UnitStatus, UnitType } from './types';
import { v4 as uuidv4 } from 'uuid';

// Mock Data
const projects: Project[] = [
    {
        id: 'proj-1',
        name: 'Skyline Towers',
        code: 'SKY01',
        location: 'Downtown',
        developer: 'Premium Builders',
        amenities: ['Pool', 'Gym', 'Park'],
        status: 'UNDER_CONSTRUCTION',
        createdAt: new Date(), updatedAt: new Date()
    }
];

const towers: Tower[] = [
    { id: 'twr-1', projectId: 'proj-1', name: 'Tower A', totalFloors: 20, createdAt: new Date(), updatedAt: new Date() },
    { id: 'twr-2', projectId: 'proj-1', name: 'Tower B', totalFloors: 18, createdAt: new Date(), updatedAt: new Date() }
];

// Generate units for Tower A (Mock)
const units: Unit[] = [];
for (let floor = 1; floor <= 20; floor++) {
    for (let num = 1; num <= 4; num++) {
        units.push({
            id: `unit-${floor}-${num}`,
            projectId: 'proj-1',
            towerId: 'twr-1',
            unitNumber: `A-${floor}0${num}`,
            floorNumber: floor,
            type: UnitType.APARTMENT,
            configuration: num % 2 === 0 ? '3BHK' : '2BHK',
            area: { carpet: num % 2 === 0 ? 1500 : 1200, unit: 'SQFT' },
            price: {
                basePrice: num % 2 === 0 ? 15000000 : 11000000,
                floorRise: floor * 50000,
                plc: 0,
                totalCost: (num % 2 === 0 ? 15000000 : 11000000) + (floor * 50000),
                currency: 'INR'
            },
            status: Math.random() > 0.8 ? UnitStatus.SOLD : (Math.random() > 0.7 ? UnitStatus.BLOCKED : UnitStatus.AVAILABLE),
            createdAt: new Date(), updatedAt: new Date()
        });
    }
}

export class InventoryService {
    static async getProjects(): Promise<Project[]> {
        return projects;
    }

    static async getTowers(projectId: string): Promise<Tower[]> {
        return towers.filter(t => t.projectId === projectId);
    }

    static async getUnits(projectId: string, towerId?: string): Promise<Unit[]> {
        return units.filter(u => u.projectId === projectId && (!towerId || u.towerId === towerId));
    }

    static async getUnit(unitId: string): Promise<Unit | undefined> {
        return units.find(u => u.id === unitId);
    }

    static async updateUnitStatus(unitId: string, status: UnitStatus, blockedBy?: string): Promise<boolean> {
        const unit = units.find(u => u.id === unitId);
        if (unit) {
            unit.status = status;
            if (status === UnitStatus.BLOCKED) {
                unit.blockedBy = blockedBy;
                unit.blockedAt = new Date();
            } else if (status === UnitStatus.AVAILABLE) {
                unit.blockedBy = undefined;
                unit.blockedAt = undefined;
            }
            return true;
        }
        return false;
    }
}
