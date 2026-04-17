"use client";

import { Booking, Project } from '@/lib/db';
import { Calendar, MapPin, Clock, User } from 'lucide-react';

interface AgendaViewProps {
    bookings: Booking[];
    projects: Project[];
}

export default function AgendaView({ bookings, projects }: AgendaViewProps) {
    // Group bookings by date
    const groupedBookings = bookings.reduce((acc, booking) => {
        const date = new Date(booking.slotStart).toDateString();
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(booking);
        return acc;
    }, {} as Record<string, Booking[]>);

    // Sort dates
    const sortedDates = Object.keys(groupedBookings).sort((a, b) =>
        new Date(a).getTime() - new Date(b).getTime()
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
            case 'no_show': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getProjectColor = (projectId?: string) => {
        if (!projectId) return 'text-slate-600';
        const colors = ['text-blue-600', 'text-green-600', 'text-purple-600', 'text-orange-600'];
        const index = projects.findIndex(p => p.id === projectId);
        return colors[index % colors.length];
    };

    if (sortedDates.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Calendar size={48} className="mb-4" />
                <p className="text-lg font-medium">No upcoming visits</p>
                <p className="text-sm">Schedule a site visit to get started</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-auto p-6">
            <div className="max-w-4xl mx-auto space-y-8">
                {sortedDates.map(dateStr => {
                    const date = new Date(dateStr);
                    const dayBookings = groupedBookings[dateStr].sort((a, b) =>
                        new Date(a.slotStart).getTime() - new Date(b.slotStart).getTime()
                    );

                    const isToday = date.toDateString() === new Date().toDateString();

                    return (
                        <div key={dateStr} className="space-y-3">
                            {/* Date Header */}
                            <div className={`sticky top-0 bg-white z-10 pb-2 border-b-2 ${isToday ? 'border-indigo-500' : 'border-slate-200'
                                }`}>
                                <h3 className={`text-lg font-bold ${isToday ? 'text-indigo-600' : 'text-slate-900'
                                    }`}>
                                    {date.toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                    {isToday && <span className="ml-2 text-sm">(Today)</span>}
                                </h3>
                                <p className="text-sm text-slate-500">{dayBookings.length} visit{dayBookings.length !== 1 ? 's' : ''}</p>
                            </div>

                            {/* Bookings List */}
                            <div className="space-y-3">
                                {dayBookings.map(booking => {
                                    const project = projects.find(p => p.id === booking.projectId);
                                    const startTime = new Date(booking.slotStart);
                                    const endTime = new Date(booking.slotEnd);

                                    return (
                                        <div
                                            key={booking.id}
                                            className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <h4 className={`text-lg font-semibold ${getProjectColor(booking.projectId)}`}>
                                                        {project?.name || 'Unknown Project'}
                                                    </h4>
                                                    <p className="text-sm text-slate-500">{project?.location}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                                                    {booking.status}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Clock size={16} />
                                                    <span>
                                                        {startTime.toLocaleTimeString('en-US', {
                                                            hour: 'numeric',
                                                            minute: '2-digit'
                                                        })} - {endTime.toLocaleTimeString('en-US', {
                                                            hour: 'numeric',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>

                                                {booking.meetingPoint && (
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <MapPin size={16} />
                                                        <span className="truncate">{booking.meetingPoint}</span>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <User size={16} />
                                                    <span className="capitalize">{booking.visitType?.replace('_', ' ')}</span>
                                                </div>

                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Calendar size={16} />
                                                    <span className="capitalize">{booking.mode?.replace('_', ' ')}</span>
                                                </div>
                                            </div>

                                            {booking.notes && (
                                                <div className="mt-3 pt-3 border-t border-slate-100">
                                                    <p className="text-sm text-slate-600">{booking.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
