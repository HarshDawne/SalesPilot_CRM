import React from 'react';
import { UNIT_STATUS_CONFIG } from '@/lib/types/properties';

interface UnitStatusBadgeProps {
    status: keyof typeof UNIT_STATUS_CONFIG;
    className?: string;
}

export function UnitStatusBadge({ status, className = '' }: UnitStatusBadgeProps) {
    const config = UNIT_STATUS_CONFIG[status] || UNIT_STATUS_CONFIG.available;

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}>
            {config.label}
        </span>
    );
}
