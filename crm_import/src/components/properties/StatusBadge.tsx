import React from 'react';

interface StatusBadgeProps {
    status: string;
    className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
    const styles = {
        planning: 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-200',
        'under-construction': 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border-blue-200',
        completed: 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border-emerald-200',
    };

    const labels: Record<string, string> = {
        planning: 'Planning',
        'under-construction': 'Under Construction',
        completed: 'Completed',
        'Pre-Launch': 'Pre-Launch',
        'Under Development': 'Under Development',
        'Ready for Possession': 'Ready for Possession',
        'PLANNING': 'Pre-Launch',
        'UNDER_CONSTRUCTION': 'Under Development',
        'ACTIVE': 'Ready for Possession',
        'COMPLETED': 'Completed' 
    };

    // Helper to normalize status key for style lookup
    const getStyleKey = (s: string) => {
        if(s === 'Pre-Launch' || s === 'PLANNING') return 'planning';
        if(s === 'Under Development' || s === 'UNDER_CONSTRUCTION') return 'under-construction';
        if(s === 'Ready for Possession' || s === 'ACTIVE' || s === 'COMPLETED') return 'completed';
        return 'planning';
    };

    const styleKey = getStyleKey(status);

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${styles[styleKey]} ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
            {labels[status] || status}
        </span>
    );
}
