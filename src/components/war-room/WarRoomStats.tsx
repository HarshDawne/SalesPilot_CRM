"use client";

interface StatItem {
    label: string;
    value: number;
    color: string;
    bg: string;
}

interface Props {
    stats: {
        total: number;
        available: number;
        held: number;
        booked: number;
        sold: number;
        blocked: number;
        occupancy: number;
    };
}

export function WarRoomStats({ stats }: Props) {
    const items: StatItem[] = [
        { label: 'Total', value: stats.total, color: 'text-slate-300', bg: 'bg-white/5' },
        { label: 'Available', value: stats.available, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { label: 'On Hold', value: stats.held, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { label: 'Booked', value: stats.booked, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'Sold', value: stats.sold, color: 'text-slate-500', bg: 'bg-white/5' },
        { label: 'Blocked', value: stats.blocked, color: 'text-red-400', bg: 'bg-red-500/10' },
    ];

    return (
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-white/5 bg-[#0b1018] flex-shrink-0 overflow-x-auto">
            <div className="flex items-center gap-2 flex-shrink-0 mr-4">
                {/* Occupancy Bar */}
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Occupancy</span>
                    <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                            style={{ width: `${stats.occupancy}%` }}
                        />
                    </div>
                    <span className="text-[11px] font-black text-emerald-400">{stats.occupancy}%</span>
                </div>
            </div>

            <div className="h-5 w-px bg-white/10 flex-shrink-0" />

            <div className="flex items-center gap-2">
                {items.map(item => (
                    <div key={item.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${item.bg} flex-shrink-0`}>
                        <span className={`text-lg font-black leading-none ${item.color}`}>{item.value}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
