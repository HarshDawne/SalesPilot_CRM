"use client";

import { Booking } from '@/lib/db';
import { TrendingUp, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';

interface CalendarStatsProps {
    bookings: Booking[];
}

export default function CalendarStats({ bookings }: CalendarStatsProps) {
    // Calculate stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const todayBookings = bookings.filter(b => {
        const date = new Date(b.slotStart);
        return date.toDateString() === today.toDateString();
    });

    const weekBookings = bookings.filter(b => {
        const date = new Date(b.slotStart);
        return date >= thisWeekStart;
    });

    const monthBookings = bookings.filter(b => {
        const date = new Date(b.slotStart);
        return date >= thisMonthStart;
    });

    const completedBookings = bookings.filter(b => b.status === 'completed');
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled' || b.status === 'no_show');

    const completionRate = bookings.length > 0
        ? Math.round((completedBookings.length / bookings.length) * 100)
        : 0;

    const noShowRate = bookings.length > 0
        ? Math.round((bookings.filter(b => b.status === 'no_show').length / bookings.length) * 100)
        : 0;

    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-6">
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Calendar Stats</h3>
                <p className="text-sm text-slate-500">Visit analytics and metrics</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">{todayBookings.length}</div>
                    <div className="text-xs text-blue-600 font-medium mt-1">Today</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">{weekBookings.length}</div>
                    <div className="text-xs text-green-600 font-medium mt-1">This Week</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600">{monthBookings.length}</div>
                    <div className="text-xs text-purple-600 font-medium mt-1">This Month</div>
                </div>
            </div>

            {/* Status Breakdown */}
            <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-700">By Status</h4>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-500" />
                            <span className="text-sm text-slate-600">Completed</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{completedBookings.length}</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-blue-500" />
                            <span className="text-sm text-slate-600">Confirmed</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{confirmedBookings.length}</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <XCircle size={16} className="text-red-500" />
                            <span className="text-sm text-slate-600">Cancelled/No-Show</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{cancelledBookings.length}</span>
                    </div>
                </div>
            </div>

            {/* Performance Metrics */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-sm font-semibold text-slate-700">Performance</h4>

                <div className="space-y-3">
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-slate-600">Completion Rate</span>
                            <span className="text-sm font-semibold text-slate-900">{completionRate}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                                className="bg-green-500 h-2 rounded-full transition-all"
                                style={{ width: `${completionRate}%` }}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-slate-600">No-Show Rate</span>
                            <span className="text-sm font-semibold text-slate-900">{noShowRate}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                                className="bg-red-500 h-2 rounded-full transition-all"
                                style={{ width: `${noShowRate}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Visit Types */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-sm font-semibold text-slate-700">Visit Types</h4>

                <div className="space-y-2">
                    {['first_visit', 'follow_up', 'final_negotiation'].map(type => {
                        const count = bookings.filter(b => b.visitType === type).length;
                        return (
                            <div key={type} className="flex items-center justify-between">
                                <span className="text-sm text-slate-600 capitalize">{type.replace('_', ' ')}</span>
                                <span className="text-sm font-semibold text-slate-900">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
