"use client";

import { Booking, Project } from '@/lib/db';

interface WeekViewProps {
    startDate: Date;
    bookings: Booking[];
    projects: Project[];
}

export default function WeekView({ startDate, bookings, projects }: WeekViewProps) {
    // Calculate week dates (Monday to Sunday)
    const weekDates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startDate);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1) + i;
        date.setDate(diff);
        return date;
    });

    // Hours from 8 AM to 8 PM
    const hours = Array.from({ length: 13 }, (_, i) => i + 8);

    const getBookingsForDateTime = (date: Date, hour: number) => {
        return bookings.filter(booking => {
            const bookingDate = new Date(booking.slotStart);
            return (
                bookingDate.toDateString() === date.toDateString() &&
                bookingDate.getHours() === hour
            );
        });
    };

    const getProjectColor = (projectId?: string) => {
        if (!projectId) return 'bg-slate-100';

        const colors = [
            'bg-blue-400',
            'bg-green-400',
            'bg-purple-400',
            'bg-orange-400',
        ];

        const index = projects.findIndex(p => p.id === projectId);
        return colors[index % colors.length];
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    return (
        <div className="h-full overflow-auto">
            <div className="min-w-[900px]">
                {/* Header with days */}
                <div className="sticky top-0 bg-white z-10 border-b border-slate-200">
                    <div className="flex">
                        <div className="w-20 flex-shrink-0 border-r border-slate-200" />
                        {weekDates.map((date, index) => (
                            <div
                                key={index}
                                className={`flex-1 p-3 text-center border-r border-slate-200 ${isToday(date) ? 'bg-indigo-50' : ''
                                    }`}
                            >
                                <div className="text-xs text-slate-500 font-medium">
                                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                </div>
                                <div className={`text-lg font-bold mt-1 ${isToday(date) ? 'text-indigo-600' : 'text-slate-900'
                                    }`}>
                                    {date.getDate()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Time slots */}
                {hours.map(hour => {
                    const timeString = `${hour === 12 ? 12 : hour % 12}:00 ${hour >= 12 ? 'PM' : 'AM'}`;

                    return (
                        <div key={hour} className="flex border-b border-slate-100">
                            {/* Time column */}
                            <div className="w-20 flex-shrink-0 p-2 text-xs font-medium text-slate-500 border-r border-slate-200">
                                {timeString}
                            </div>

                            {/* Day columns */}
                            {weekDates.map((date, dayIndex) => {
                                const dayBookings = getBookingsForDateTime(date, hour);

                                return (
                                    <div
                                        key={dayIndex}
                                        className={`flex-1 p-1 min-h-[60px] border-r border-slate-100 hover:bg-slate-50 transition-colors ${isToday(date) ? 'bg-indigo-50/30' : ''
                                            }`}
                                    >
                                        {dayBookings.map(booking => {
                                            const project = projects.find(p => p.id === booking.projectId);

                                            return (
                                                <div
                                                    key={booking.id}
                                                    className={`${getProjectColor(booking.projectId)} text-white text-xs p-2 rounded mb-1 cursor-pointer hover:opacity-90 transition-opacity`}
                                                    title={`${project?.name || 'Unknown'} - ${booking.visitType}`}
                                                >
                                                    <div className="font-semibold truncate">
                                                        {project?.name || 'Visit'}
                                                    </div>
                                                    <div className="text-[10px] opacity-90 truncate">
                                                        {new Date(booking.slotStart).toLocaleTimeString('en-US', {
                                                            hour: 'numeric',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
