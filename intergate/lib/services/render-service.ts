/**
 * 3D Render Service
 * Handle purchase, access control, and preview management
 */

import { readDB, transaction } from '../db/database';
import { generateUUID } from '../utils';
import type { ThreeDRender, RenderPurchase, LicenseType } from '@/types/property';

/**
 * Get 3D render by ID with access check
 */
export async function get3DRender(
    renderId: string,
    userId: string
): Promise<{ render: ThreeDRender; hasAccess: boolean; canPreview: boolean }> {
    const db = await readDB();
    const render = db.renders.find(r => r.id === renderId);

    if (!render) {
        throw new Error(`Render ${renderId} not found`);
    }

    const hasAccess = render.purchasedBy === userId;
    const canPreview = render.previewAllowed || hasAccess;

    return {
        render,
        hasAccess,
        canPreview,
    };
}

/**
 * Get all renders for a project
 */
export async function getRendersByProject(projectId: string): Promise<ThreeDRender[]> {
    const db = await readDB();
    return db.renders.filter(r => r.projectId === projectId);
}

/**
 * Purchase 3D render (mock implementation)
 */
export async function purchase3DRender(
    renderId: string,
    userId: string,
    licenseType: LicenseType
): Promise<{ render: ThreeDRender; purchase: RenderPurchase }> {
    return transaction('purchase_3d_render', async (db) => {
        const render = db.renders.find(r => r.id === renderId);
        if (!render) {
            throw new Error(`Render ${renderId} not found`);
        }

        if (render.purchasedBy) {
            throw new Error('Render already purchased');
        }

        // Create purchase record
        const purchase: RenderPurchase = {
            id: generateUUID(),
            renderId,
            userId,
            licenseType,
            amount: render.price,
            transactionId: `TXN-${Date.now()}`, // Mock transaction ID
            purchasedAt: new Date(),
        };

        // Update render
        render.purchasedBy = userId;
        render.purchaseDate = new Date();
        render.licenseType = licenseType;
        render.updatedAt = new Date();

        // In production, this would:
        // 1. Process payment via payment gateway (Razorpay/Stripe)
        // 2. Generate receipt/invoice
        // 3. Send confirmation email
        // 4. Log transaction for compliance

        console.log(`Mock purchase: User ${userId} purchased render ${renderId} with ${licenseType} license`);

        return { data: db, result: { render, purchase } };
    });
}

/**
 * Check if user can preview render (watermarked)
 */
export async function canPreview(renderId: string, userId?: string): Promise<boolean> {
    const db = await readDB();
    const render = db.renders.find(r => r.id === renderId);

    if (!render) {
        return false;
    }

    // Can preview if:
    // 1. Preview is allowed for everyone, OR
    // 2. User has purchased it
    return render.previewAllowed || (!!userId && render.purchasedBy === userId);
}

/**
 * Generate receipt for purchase (mock)
 */
export async function generateReceipt(purchaseId: string): Promise<string> {
    // In production, this would:
    // 1. Fetch purchase details
    // 2. Generate PDF receipt
    // 3. Upload to storage
    // 4. Return download URL

    return `https://hypersell.com/receipts/${purchaseId}.pdf`;
}

/**
 * Get purchase history for user
 */
export async function getUserPurchases(userId: string): Promise<RenderPurchase[]> {
    const db = await readDB();

    // In a real implementation, purchases would be stored separately
    // For now, we'll derive from renders
    const purchasedRenders = db.renders.filter(r => r.purchasedBy === userId);

    return purchasedRenders.map(render => ({
        id: generateUUID(),
        renderId: render.id,
        userId,
        licenseType: render.licenseType!,
        amount: render.price,
        purchasedAt: render.purchaseDate!,
    }));
}

/**
 * Check if user owns render
 */
export async function userOwnsRender(renderId: string, userId: string): Promise<boolean> {
    const db = await readDB();
    const render = db.renders.find(r => r.id === renderId);
    return render?.purchasedBy === userId;
}
