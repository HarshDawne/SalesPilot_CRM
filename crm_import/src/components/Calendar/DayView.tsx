"use client";

import { Booking, Project } from '@/lib/db';
import { Clock, MapPin, User, Phone } from 'lucide-react';

interface DayViewProps {
    date: Date;
    bookings: Booking[];
    projects: Project[];
}

export default function DayView({ date, bookings, projects }: DayViewProps) {
    // Generate hourly slots from 8 AM to 8 PM
    const hours = Array.from({ length: 13 }, (_, i) => i + 8);

    // Filter bookings for this day
    const dayBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.slotStart);
        return bookingDate.toDateString() === date.toDateString();
    });

    const getBookingForHour = (hour: number) => {
        return dayBookings.filter(booking => {
            const bookingHour = new Date(booking.slotStart).getHours();
            return bookingHour === hour;
        });
    };

    const getProjectColor = (projectId?: string) => {
        if (!projectId) return 'bg-slate-100 text-slate-700';

        const colors = [
            'bg-blue-100 text-blue-700 border-blue-200',
            'bg-green-100 text-green-700 border-green-200',
            'bg-purple-100 text-purple-700 border-purple-200',
            'bg-orange-100 text-orange-700 border-orange-200',
        ];

        const index = projects.findIndex(p => p.id === projectId);
        return colors[index % colors.length];
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed':
                return 'bg-green-500';
            case 'pending':
                return 'bg-yellow-500';
            case 'completed':
                return 'bg-blue-500';
            case 'cancelled':
                return 'bg-red-500';
            case 'no_show':
                return 'bg-gray-500';
            default:
                return 'bg-slate-500';
        }
    };

    return (
        <div className="h-full overflow-auto">
            <div className="min-w-[600px]">
                {hours.map(hour => {
                    const hourBookings = getBookingForHour(hour);
                    const timeString = `${hour === 12 ? 12 : hour % 12}:00 ${hour >= 12 ? 'PM' : 'AM'}`;

                    return (
                        <div
                            key={hour}
                            className="flex border-b border-slate-100 hover:bg-slate-50 transition-colors"
                        >
                            {/* Time Column */}
                            <div className="w-24 flex-shrink-0 p-4 text-sm font-medium text-slate-500 border-r border-slate-100">
                                {timeString}
                            </div>

                            {/* Bookings Column */}
                            <div className="flex-1 p-2 min-h-[80px]">
                                {hourBookings.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-slate-300 text-sm">
                                        No visits scheduled
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {hourBookings.map(booking => {
                                            const project = projects.find(p => p.id === booking.projectId);
                                            const startTime = new Date(booking.slotStart);
                                            const endTime = new Date(booking.slotEnd);

                                            return (
                                                <div
                                                    key={booking.id}
                                                    className={`p-3 rounded-lg border ${getProjectColor(booking.projectId)} cursor-pointer hover:shadow-md transition-shadow`}
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className={`w-2 h-2 rounded-full ${getStatusColor(booking.status)}`} />
                                                                <span className="font-semibold text-sm">
                                                                    {project?.name || 'Unknown Project'}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs opacity-75">
                                                                {startTime.toLocaleTimeString('en-US', {
                                                                    hour: 'numeric',
                                                                    minute: '2-digit'
                                                                })} - {endTime.toLocaleTimeString('en-US', {
                                                                    hour: 'numeric',
                                                                    minute: '2-digit'
                                                                })}
                                                            </div>
                                                        </div>
                                                        <span className="text-xs px-2 py-1 bg-white/50 rounded capitalize">
                                                            {booking.visitType?.replace('_', ' ')}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-1 text-xs">
                                                        {booking.meetingPoint && (
                                                            <div className="flex items-center gap-2 opacity-75">
                                                                <MapPin size={12} />
                                                                <span>{booking.meetingPoint}</span>
                                                            </div>
                                                        )}
                                                        {booking.notes && (
                                                            <div className="text-xs opacity-75 mt-1">
                                                                {booking.notes}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
