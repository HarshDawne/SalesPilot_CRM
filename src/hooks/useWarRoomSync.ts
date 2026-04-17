import { useState, useEffect, useCallback } from 'react';
import type { WarRoomUnit, HoldEntry } from '../components/war-room/types';

export function useWarRoomSync(propertyId: string, initialTowers: any[]) {
    const [towers, setTowers] = useState(initialTowers);
    const [holds, setHolds] = useState<Record<string, HoldEntry>>({});
    const [isSyncing, setIsSyncing] = useState(false);

    const fetchSync = useCallback(async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        try {
            // In a real enterprise app, we'd use a more efficient "delta" sync
            const res = await fetch(`/api/properties/${propertyId}`);
            const data = await res.json();
            if (data.success && data.property.towers) {
                setTowers(data.property.towers);
                
                // Build holds map from unit statuses
                const newHolds: Record<string, HoldEntry> = {};
                data.property.towers.forEach((t: any) => {
                    t.units?.forEach((u: any) => {
                        if (u.status === 'BLOCKED' && u.holdExpiry) {
                            newHolds[u.id] = {
                                unitId: u.id,
                                agentName: u.reservation?.reservedBy || 'System',
                                expiry: new Date(u.holdExpiry).getTime()
                            };
                        }
                    });
                });
                setHolds(newHolds);
            }
        } catch (error) {
            console.error('Sync failed:', error);
        } finally {
            setIsSyncing(false);
        }
    }, [propertyId, isSyncing]);

    // Initial sync and polling
    useEffect(() => {
        fetchSync();
        const interval = setInterval(fetchSync, 10000); // 10s polling
        return () => clearInterval(interval);
    }, [propertyId]);

    const holdUnit = async (unitId: string, agentName: string) => {
        try {
            const res = await fetch(`/api/properties/${propertyId}/units/${unitId}/hold`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentName, durationMinutes: 30 })
            });
            const data = await res.json();
            if (data.success) {
                await fetchSync(); // Refresh immediately
                return true;
            }
            return false;
        } catch (err) {
            console.error('Hold failed:', err);
            return false;
        }
    };

    const releaseUnit = async (unitId: string) => {
        try {
            const res = await fetch(`/api/properties/${propertyId}/units/${unitId}/release`, {
                method: 'POST'
            });
            const data = await res.json();
            if (data.success) {
                await fetchSync(); // Refresh immediately
                return true;
            }
            return false;
        } catch (err) {
            console.error('Release failed:', err);
            return false;
        }
    };

    return {
        towers,
        holds,
        isSyncing,
        holdUnit,
        releaseUnit,
        refresh: fetchSync
    };
}
