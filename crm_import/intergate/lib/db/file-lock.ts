import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * File-based locking mechanism to prevent race conditions
 * Critical for ensuring atomic operations on the JSON database
 */

interface LockInfo {
    processId: string;
    timestamp: number;
    operation: string;
}

const LOCK_TIMEOUT_MS = 10000; // 10 seconds
const MAX_RETRY_ATTEMPTS = 50;
const RETRY_DELAY_MS = 100;

class FileLock {
    private lockFilePath: string;
    private processId: string;

    constructor(targetFilePath: string) {
        this.lockFilePath = `${targetFilePath}.lock.json`;
        this.processId = `process-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }

    /**
     * Acquire exclusive lock
     */
    async acquireLock(operation: string): Promise<boolean> {
        for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
            try {
                // Check if lock file exists
                try {
                    const lockContent = await fs.readFile(this.lockFilePath, 'utf-8');
                    const lockInfo: LockInfo = JSON.parse(lockContent);

                    // Check if lock is stale (timeout exceeded)
                    if (Date.now() - lockInfo.timestamp > LOCK_TIMEOUT_MS) {
                        console.warn(`Removing stale lock from ${lockInfo.processId}`);
                        await fs.unlink(this.lockFilePath);
                    } else {
                        // Lock is held by another process
                        await this.sleep(RETRY_DELAY_MS);
                        continue;
                    }
                } catch (err) {
                    // Lock file doesn't exist, we can proceed
                }

                // Try to create lock file
                const lockInfo: LockInfo = {
                    processId: this.processId,
                    timestamp: Date.now(),
                    operation,
                };

                await fs.writeFile(
                    this.lockFilePath,
                    JSON.stringify(lockInfo, null, 2),
                    { flag: 'wx' } // Fail if file exists
                );

                return true; // Successfully acquired lock
            } catch (err: any) {
                if (err.code === 'EEXIST') {
                    // Another process created the lock file first
                    await this.sleep(RETRY_DELAY_MS);
                    continue;
                }
                throw err;
            }
        }

        throw new Error(`Failed to acquire lock after ${MAX_RETRY_ATTEMPTS} attempts`);
    }

    /**
     * Release lock
     */
    async releaseLock(): Promise<void> {
        try {
            // Verify we own the lock before releasing
            const lockContent = await fs.readFile(this.lockFilePath, 'utf-8');
            const lockInfo: LockInfo = JSON.parse(lockContent);

            if (lockInfo.processId !== this.processId) {
                console.warn(`Attempted to release lock owned by ${lockInfo.processId}`);
                return;
            }

            await fs.unlink(this.lockFilePath);
        } catch (err: any) {
            if (err.code !== 'ENOENT') {
                console.error('Error releasing lock:', err);
            }
        }
    }

    /**
     * Execute function with automatic lock management
     */
    async withLock<T>(
        operation: string,
        fn: () => Promise<T>
    ): Promise<T> {
        await this.acquireLock(operation);

        try {
            const result = await fn();
            return result;
        } finally {
            await this.releaseLock();
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Create a file lock for a given file path
 */
export function createFileLock(targetFilePath: string): FileLock {
    return new FileLock(targetFilePath);
}

/**
 * Execute operation with file lock
 */
export async function withFileLock<T>(
    targetFilePath: string,
    operation: string,
    fn: () => Promise<T>
): Promise<T> {
    const lock = createFileLock(targetFilePath);
    return lock.withLock(operation, fn);
}
