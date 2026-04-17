"use client";

import { useState, useEffect } from 'react';
import { Booking, Project } from '@/lib/db';
import { Calendar, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import DayView from './DayView';
import WeekView from './WeekView';
import MonthView from './MonthView';
import AgendaView from './AgendaView';
import CalendarStats from './CalendarStats';
import BookVisitModal from './BookVisitModal';

type ViewMode = 'day' | 'week' | 'month' | 'agenda';

interface EnterpriseCalendarProps {
    initialDate?: Date;
}

export default function EnterpriseCalendar({ initialDate = new Date() }: EnterpriseCalendarProps) {
    const [currentDate, setCurrentDate] = useState(initialDate);
    const [viewMode, setViewMode] = useState<ViewMode>('week');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, [currentDate, viewMode]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { startDate, endDate } = getDateRange();

            const bookingsRes = await fetch(
                `/api/bookings?startDate=${startDate}&endDate=${endDate}`
            );
            const bookingsData = await bookingsRes.json();
            setBookings(bookingsData);

            const projectsRes = await fetch('/api/projects');
            const projectsData = await projectsRes.json();
            setProjects(projectsData);
        } catch (error) {
            console.error('Error fetching calendar data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDateRange = () => {
        const start = new Date(currentDate);
        const end = new Date(currentDate);

        switch (viewMode) {
            case 'day':
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'week':
                const day = start.getDay();
                const diff = start.getDate() - day + (day === 0 ? -6 : 1);
                start.setDate(diff);
                start.setHours(0, 0, 0, 0);
                end.setDate(start.getDate() + 6);
                end.setHours(23, 59, 59, 999);
                break;
            case 'month':
            case 'agenda':
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
                end.setMonth(end.getMonth() + 1, 0);
                end.setHours(23, 59, 59, 999);
                break;
        }

        return {
            startDate: start.toISOString(),
            endDate: end.toISOString()
        };
    };

    const navigateDate = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);

        switch (viewMode) {
            case 'day':
                newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
                break;
            case 'week':
                newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
                break;
            case 'month':
            case 'agenda':
                newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
                break;
        }

        setCurrentDate(newDate);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const formatDateHeader = () => {
        switch (viewMode) {
            case 'day':
                return currentDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            case 'week':
                const weekStart = new Date(currentDate);
                const day = weekStart.getDay();
                const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
                weekStart.setDate(diff);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);

                return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
            case 'month':
            case 'agenda':
                return currentDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long'
                });
            default:
                return '';
        }
    };

    return (
        <div className="h-full flex gap-6 flex-col lg:flex-row">
            <div className="flex-1 flex flex-col premium-card micro-lift">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-wrap gap-4 bg-gradient-to-r from-emerald-50/50 to-transparent">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl shadow-lg shadow-emerald-500/30">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold font-heading text-gradient-emerald">Calendar</h2>
                            <p className="text-sm text-slate-600 font-medium">{formatDateHeader()}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="btn-primary flex items-center gap-2 shadow-lg hover-glow-emerald"
                        >
                            <Plus size={20} />
                            <span className="font-medium">New Visit</span>
                        </button>

                        <div className="flex bg-slate-100 rounded-lg p-1">
                            {['day', 'week', 'month', 'agenda'].map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode as ViewMode)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${viewMode === mode
                                            ? 'bg-emerald-600 text-white shadow-md'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                        }`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => navigateDate('prev')}
                                className="p-2 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-all micro-scale"
                                aria-label="Previous"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={goToToday}
                                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-all"
                            >
                                Today
                            </button>
                            <button
                                onClick={() => navigateDate('next')}
                                className="p-2 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-all micro-scale"
                                aria-label="Next"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600"></div>
                        </div>
                    ) : (
                        <>
                            {viewMode === 'day' && (
                                <DayView
                                    date={currentDate}
                                    bookings={bookings}
                                    projects={projects}
                                />
                            )}
                            {viewMode === 'week' && (
                                <WeekView
                                    startDate={currentDate}
                                    bookings={bookings}
                                    projects={projects}
                                />
                            )}
                            {viewMode === 'month' && (
                                <MonthView
                                    date={currentDate}
                                    bookings={bookings}
                                    projects={projects}
                                />
                            )}
                            {viewMode === 'agenda' && (
                                <AgendaView
                                    bookings={bookings}
                                    projects={projects}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="w-full lg:w-80 flex-shrink-0">
                <CalendarStats bookings={bookings} />
            </div>

            <BookVisitModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchData}
                selectedDate={currentDate}
            />
        </div>
    );
}
