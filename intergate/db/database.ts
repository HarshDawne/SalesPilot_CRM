import * as fs from 'fs/promises';
import * as path from 'path';
import { withFileLock } from './file-lock';

/**
 * Safe database wrapper around JSON file
 * Uses file-locking to prevent race conditions
 */

const DB_FILE_PATH = process.env.DB_FILE_PATH || path.join(process.cwd(), 'data', 'db.json');

export interface Database {
    projects: any[];
    buildings: any[];
    units: any[];
    reservations: any[];
    renders: any[];
    documents: any[];
    media: any[];
    users: any[];
    lastModified: number;
    version: string;
}

const DEFAULT_DB: Database = {
    projects: [],
    buildings: [],
    units: [],
    reservations: [],
    renders: [],
    documents: [],
    media: [],
    users: [],
    lastModified: Date.now(),
    version: '1.0.0',
};

/**
 * Ensure database file and directory exist
 */
async function ensureDbExists(): Promise<void> {
    const dbDir = path.dirname(DB_FILE_PATH);

    try {
        await fs.access(dbDir);
    } catch {
        await fs.mkdir(dbDir, { recursive: true });
    }

    try {
        await fs.access(DB_FILE_PATH);
    } catch {
        await fs.writeFile(DB_FILE_PATH, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
    }
}

/**
 *  Thread-safe read from database
 */
export async function readDB(): Promise<Database> {
    await ensureDbExists();

    try {
        const content = await fs.readFile(DB_FILE_PATH, 'utf-8');
        const data = JSON.parse(content);

        // Validate schema
        if (!data.version || !Array.isArray(data.projects)) {
            console.warn('Invalid database schema, resetting to default');
            return DEFAULT_DB;
        }

        return data;
    } catch (err) {
        console.error('Error reading database:', err);
        return DEFAULT_DB;
    }
}

/**
 * Thread-safe write to database with lock
 */
export async function writeDB(data: Database): Promise<void> {
    await ensureDbExists();

    await withFileLock(DB_FILE_PATH, 'write', async () => {
        data.lastModified = Date.now();
        await fs.writeFile(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    });
}

/**
 * Atomic transaction: read, modify, write
 */
export async function transaction<T>(
    operation: string,
    fn: (db: Database) => Promise<{ data: Database; result: T }>
): Promise<T> {
    return withFileLock(DB_FILE_PATH, operation, async () => {
        const db = await readDB();

        try {
            const { data, result } = await fn(db);
            await fs.writeFile(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
            return result;
        } catch (err) {
            console.error(`Transaction failed for ${operation}:`, err);
            throw err;
        }
    });
}

/**
 * Get database file path (for testing)
 */
export function getDbPath(): string {
    return DB_FILE_PATH;
}
