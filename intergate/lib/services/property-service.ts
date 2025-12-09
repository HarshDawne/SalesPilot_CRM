/**
 * Property Service Layer
 * Core operations for projects, buildings, and units
 */

import { readDB, transaction } from '../db/database';
import type { Project, Building, Unit, ProjectFilter, UnitFilter, ProjectStatus, UnitStatus } from '@/types/property';

/**
 * Get all projects with optional filtering
 */
export async function getAllProjects(filter?: ProjectFilter): Promise<Project[]> {
    const db = await readDB();
    let projects = db.projects;

    if (filter) {
        if (filter.status && filter.status.length > 0) {
            projects = projects.filter(p => filter.status!.includes(p.status));
        }

        if (filter.city && filter.city.length > 0) {
            projects = projects.filter(p => filter.city!.includes(p.location.city));
        }

        if (filter.searchQuery) {
            const query = filter.searchQuery.toLowerCase();
            projects = projects.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.location.city.toLowerCase().includes(query) ||
                p.location.area.toLowerCase().includes(query)
            );
        }

        if (filter.minPrice !== undefined) {
            projects = projects.filter(p => {
                const units = db.units.filter(u => u.projectId === p.id);
                const minUnitPrice = Math.min(...units.map(u => u.totalPrice));
                return minUnitPrice >= filter.minPrice!;
            });
        }

        if (filter.maxPrice !== undefined) {
            projects = projects.filter(p => {
                const units = db.units.filter(u => u.projectId === p.id);
                const minUnitPrice = Math.min(...units.map(u => u.totalPrice));
                return minUnitPrice <= filter.maxPrice!;
            });
        }
    }

    return projects;
}

/**
 * Get project by ID
 */
export async function getProjectById(id: string): Promise<Project | null> {
    const db = await readDB();
    return db.projects.find(p => p.id === id) || null;
}

/**
 * Get buildings by project
 */
export async function getBuildingsByProject(projectId: string): Promise<Building[]> {
    const db = await readDB();
    return db.buildings.filter(b => b.projectId === projectId);
}

/**
 * Get building by ID
 */
export async function getBuildingById(id: string): Promise<Building | null> {
    const db = await readDB();
    return db.buildings.find(b => b.id === id) || null;
}

/**
 * Get units by building with optional filtering
 */
export async function getUnitsByBuilding(buildingId: string, filter?: UnitFilter): Promise<Unit[]> {
    const db = await readDB();
    let units = db.units.filter(u => u.buildingId === buildingId);

    if (filter) {
        if (filter.status && filter.status.length > 0) {
            units = units.filter(u => filter.status!.includes(u.status));
        }

        if (filter.type && filter.type.length > 0) {
            units = units.filter(u => filter.type!.includes(u.type));
        }

        if (filter.minPrice !== undefined) {
            units = units.filter(u => u.totalPrice >= filter.minPrice!);
        }

        if (filter.maxPrice !== undefined) {
            units = units.filter(u => u.totalPrice <= filter.maxPrice!);
        }

        if (filter.minArea !== undefined) {
            units = units.filter(u => u.carpetArea >= filter.minArea!);
        }

        if (filter.maxArea !== undefined) {
            units = units.filter(u => u.carpetArea <= filter.maxArea!);
        }

        if (filter.floor && filter.floor.length > 0) {
            units = units.filter(u => filter.floor!.includes(u.floor));
        }

        if (filter.searchQuery) {
            const query = filter.searchQuery.toLowerCase();
            units = units.filter(u =>
                u.unitNumber.toLowerCase().includes(query)
            );
        }
    }

    return units;
}

/**
 * Get unit by ID
 */
export async function getUnitById(id: string): Promise<Unit | null> {
    const db = await readDB();
    return db.units.find(u => u.id === id) || null;
}

/**
 * Get units by project
 */
export async function getUnitsByProject(projectId: string, filter?: UnitFilter): Promise<Unit[]> {
    const db = await readDB();
    let units = db.units.filter(u => u.projectId === projectId);

    if (filter) {
        if (filter.status && filter.status.length > 0) {
            units = units.filter(u => filter.status!.includes(u.status));
        }
    }

    return units;
}

/**
 * Update project metrics (total units, available units, etc.)
 */
export async function updateProjectMetrics(projectId: string): Promise<void> {
    await transaction('update_project_metrics', async (db) => {
        const project = db.projects.find(p => p.id === projectId);
        if (!project) {
            throw new Error(`Project ${projectId} not found`);
        }

        const buildings = db.buildings.filter(b => b.projectId === projectId);
        const units = db.units.filter(u => u.projectId === projectId);

        project.totalTowers = buildings.length;
        project.totalUnits = units.length;
        project.availableUnits = units.filter(u => u.status === 'AVAILABLE').length;
        project.bookedUnits = units.filter(u => u.status === 'BOOKED').length;
        project.updatedAt = new Date();

        return { data: db, result: undefined };
    });
}

/**
 * Update building metrics
 */
export async function updateBuildingMetrics(buildingId: string): Promise<void> {
    await transaction('update_building_metrics', async (db) => {
        const building = db.buildings.find(b => b.id === buildingId);
        if (!building) {
            throw new Error(`Building ${buildingId} not found`);
        }

        const units = db.units.filter(u => u.buildingId === buildingId);

        building.totalUnits = units.length;
        building.availableUnits = units.filter(u => u.status === 'AVAILABLE').length;
        building.updatedAt = new Date();

        return { data: db, result: undefined };
    });
}
