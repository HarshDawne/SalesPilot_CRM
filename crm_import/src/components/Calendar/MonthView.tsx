"use client";

import { Booking, Project } from '@/lib/db';

interface MonthViewProps {
    date: Date;
    bookings: Booking[];
    projects: Project[];
}

export default function MonthView({ date, bookings, projects }: MonthViewProps) {
    // Get first day of month and number of days
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Generate calendar grid
    const days = [];
    const totalCells = Math.ceil((daysInMonth + startingDayOfWeek) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
        const dayNumber = i - startingDayOfWeek + 1;
        if (dayNumber > 0 && dayNumber <= daysInMonth) {
            const currentDate = new Date(date.getFullYear(), date.getMonth(), dayNumber);
            days.push({ date: currentDate, dayNumber });
        } else {
            days.push({ date: null, dayNumber: null });
        }
    }

    const getBookingsForDate = (date: Date | null) => {
        if (!date) return [];
        return bookings.filter(booking => {
            const bookingDate = new Date(booking.slotStart);
            return bookingDate.toDateString() === date.toDateString();
        });
    };

    const isToday = (date: Date | null) => {
        if (!date) return false;
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const getProjectColor = (projectId?: string) => {
        if (!projectId) return 'bg-slate-400';
        const colors = ['bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-orange-400'];
        const index = projects.findIndex(p => p.id === projectId);
        return colors[index % colors.length];
    };

    return (
        <div className="h-full p-4">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm font-semibold text-slate-600 py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
                {days.map((day, index) => {
                    const dayBookings = getBookingsForDate(day.date);
                    const isTodayDate = isToday(day.date);

                    return (
                        <div
                            key={index}
                            className={`min-h-[100px] border rounded-lg p-2 ${day.date
                                    ? isTodayDate
                                        ? 'bg-indigo-50 border-indigo-300'
                                        : 'bg-white border-slate-200 hover:bg-slate-50'
                                    : 'bg-slate-50 border-slate-100'
                                } transition-colors cursor-pointer`}
                        >
                            {day.dayNumber && (
                                <>
                                    <div className={`text-sm font-semibold mb-1 ${isTodayDate ? 'text-indigo-600' : 'text-slate-700'
                                        }`}>
                                        {day.dayNumber}
                                    </div>
                                    <div className="space-y-1">
                                        {dayBookings.slice(0, 3).map(booking => {
                                            const project = projects.find(p => p.id === booking.projectId);
                                            return (
                                                <div
                                                    key={booking.id}
                                                    className={`${getProjectColor(booking.projectId)} text-white text-[10px] px-1.5 py-0.5 rounded truncate`}
                                                    title={project?.name || 'Visit'}
                                                >
                                                    {new Date(booking.slotStart).toLocaleTimeString('en-US', {
                                                        hour: 'numeric',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            );
                                        })}
                                        {dayBookings.length > 3 && (
                                            <div className="text-[10px] text-slate-500 font-medium">
                                                +{dayBookings.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
