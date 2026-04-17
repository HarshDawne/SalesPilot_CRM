"use client";

import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { 
    ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, 
    User, Search, Filter, MoreHorizontal, Plus, ArrowLeft, RefreshCw,
    Sparkles, Target, Activity, TrendingUp
} from 'lucide-react';
import { VisitIntelligencePanel } from '@/components/sales/VisitIntelligencePanel';
import { cn } from '@/lib/utils';

interface CalendarEvent {
    id: string;
    leadId: string;
    slotStart: string;
    mode: 'site_visit' | 'meeting' | 'call';
    notes?: string;
    meetingPoint?: string;
}

export default function CalendarPage() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [selectedLead, setSelectedLead] = useState<any | null>(null);
    const [isFetchingLead, setIsFetchingLead] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, [currentMonth]);

    useEffect(() => {
        if (selectedEvent) {
            fetchLeadData(selectedEvent.leadId);
        } else {
            setSelectedLead(null);
        }
    }, [selectedEvent]);

    const fetchLeadData = async (leadId: string) => {
        setIsFetchingLead(true);
        try {
            const res = await fetch(`/api/leads/${leadId}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedLead(data);
            }
        } catch (error) {
            console.error("Failed to fetch lead data", error);
        } finally {
            setIsFetchingLead(false);
        }
    };

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const start = startOfMonth(currentMonth);
            const end = endOfMonth(currentMonth);
            const res = await fetch(`/api/calendar/events?start=${start.toISOString()}&end=${end.toISOString()}`);
            if (res.ok) {
                const data = await res.json();
                setEvents(data.events || []);
            }
        } catch (error) {
            console.error("Failed to fetch events", error);
        } finally {
            setLoading(false);
        }
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const goToToday = () => {
        const today = new Date();
        setCurrentMonth(today);
        setSelectedDate(today);
    };

    const renderHeader = () => (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em]">
                    <CalendarIcon size={12} className="text-secondary" />
                    Temporal Orchestration // Q2 2026
                </div>
                <h1 className="text-3xl font-black text-text-main tracking-tighter">
                    {format(currentMonth, 'MMMM')} <span className="text-secondary">{format(currentMonth, 'yyyy')}</span>
                </h1>
                <p className="text-sm text-text-secondary font-medium">Synchronizing site visits, AI follow-ups, and negotiation windows.</p>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-white border border-border-subtle p-1 rounded-lg shadow-xs">
                    <button onClick={prevMonth} className="p-1.5 hover:bg-slate-50 rounded-md text-slate-400 hover:text-primary transition-all"><ChevronLeft size={16} /></button>
                    <button onClick={goToToday} className="px-3 py-1 text-[10px] font-black uppercase text-text-secondary hover:text-primary transition-all">Today</button>
                    <button onClick={nextMonth} className="p-1.5 hover:bg-slate-50 rounded-md text-slate-400 hover:text-primary transition-all"><ChevronRight size={16} /></button>
                </div>
                <button className="btn-primary flex items-center gap-2 text-xs py-2">
                    <Plus size={16} />
                    Book Slot
                </button>
            </div>
        </div>
    );

    const renderEventsInCell = (day: Date) => {
        const dayEvents = events.filter(e => isSameDay(new Date(e.slotStart), day));
        return (
            <div className="space-y-1 mt-2">
                {dayEvents.slice(0, 2).map((event, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded border",
                            event.mode === 'site_visit' ? "bg-primary text-white border-primary" : "bg-ai-accent/10 text-ai-accent border-ai-accent/20"
                        )}
                    >
                        {format(new Date(event.slotStart), 'HH:mm')} {event.mode === 'site_visit' ? 'Visit' : 'AI Call'}
                    </div>
                ))}
                {dayEvents.length > 2 && (
                    <p className="text-[8px] font-bold text-slate-400 pl-1">+{dayEvents.length - 2} more</p>
                )}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const rows = [];
        let days = [];
        let day = startDate;

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const cloneDay = day;
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isToday = isSameDay(day, new Date());

                days.push(
                    <div
                        key={day.toString()}
                        className={cn(
                            "min-h-[120px] p-3 border border-border-subtle transition-all cursor-pointer relative group flex flex-col",
                            !isCurrentMonth ? "bg-slate-50/50 text-slate-300" : "bg-white",
                            isSelected && "bg-primary/5 ring-1 ring-primary/20 z-10",
                            isToday && "bg-secondary/5"
                        )}
                        onClick={() => setSelectedDate(cloneDay)}
                    >
                        <div className="flex justify-between items-start">
                            <span className={cn(
                                "text-xs font-black w-6 h-6 flex items-center justify-center rounded-md transition-all",
                                isToday ? "bg-primary text-white shadow-lg shadow-primary/20" :
                                isSelected ? "text-primary" : "text-text-secondary"
                            )}>
                                {format(day, "d")}
                            </span>
                        </div>
                        {renderEventsInCell(day)}
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div key={day.toISOString()} className="grid grid-cols-7 border-t border-l first:border-t hover:z-10 relative">
                    {days}
                </div>
            );
            days = [];
        }
        return <div className="border-r border-b rounded-2xl overflow-hidden shadow-2xl bg-white">{rows}</div>;
    };

    return (
        <div className="flex h-full bg-bg-base overflow-hidden">
            <div className="flex-1 p-6 lg:p-10 overflow-y-auto">
                <div className="max-w-[1440px] mx-auto space-y-8">
                    
                    {/* Header */}
                    {renderHeader()}



                    {/* Calendar Body */}
                    <div className="space-y-[-1px]">
                        <div className="grid grid-cols-7 mb-2">
                            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                                <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] py-2">{d}</div>
                            ))}
                        </div>
                        {renderCells()}
                    </div>
                </div>
            </div>

            {/* Right Intelligence Sidebar */}
            {selectedEvent ? (
                <div className="w-[480px] border-l border-border-subtle bg-white flex flex-col shadow-2xl animate-in slide-in-from-right duration-500">
                    <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-slate-50/50">
                        <button 
                            onClick={() => setSelectedEvent(null)}
                            className="flex items-center gap-2 text-[10px] font-black text-text-secondary hover:text-primary transition-all uppercase tracking-widest"
                        >
                            <ArrowLeft size={14} /> Back to Schedule
                        </button>
                        <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-ai-accent animate-pulse" />
                            <span className="text-[10px] font-black text-text-main uppercase tracking-widest">Temporal Intelligence</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto bg-white">
                        {isFetchingLead ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 opacity-70">
                                <RefreshCw className="animate-spin" size={32} strokeWidth={1} />
                                <p className="text-[10px] font-black uppercase tracking-widest">Accessing Lead Context nodes...</p>
                            </div>
                        ) : (
                            <VisitIntelligencePanel 
                                lead={selectedLead} 
                                visit={selectedEvent} 
                                onFeedbackSubmit={async () => {}} // Placeholder
                                onClose={() => setSelectedEvent(null)}
                            />
                        )}
                    </div>
                </div>
            ) : (
                <div className="w-96 border-l border-border-subtle bg-bg-muted flex flex-col overflow-hidden">
                    <div className="p-8 border-b border-border-subtle bg-white">
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">{format(selectedDate, 'EEEE')}</p>
                        <h3 className="text-3xl font-black text-text-main tracking-tighter">
                            {format(selectedDate, 'MMMM')} <span className="text-secondary">{format(selectedDate, 'do')}</span>
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[11px] font-black text-text-secondary uppercase tracking-widest px-1">Planned Operations</h4>
                            <Plus size={14} className="text-slate-400 hover:text-primary cursor-pointer transition-colors" />
                        </div>

                        {events.filter(e => isSameDay(new Date(e.slotStart), selectedDate)).length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-300 space-y-4 opacity-60">
                                <div className="p-5 bg-slate-100/50 rounded-2xl border border-dashed border-slate-200">
                                    <Clock size={32} strokeWidth={1} />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest">No operations scheduled</p>
                            </div>
                        ) : (
                            events.filter(e => isSameDay(new Date(e.slotStart), selectedDate)).map((event, i) => (
                                <div 
                                    key={i}
                                    onClick={() => setSelectedEvent(event)}
                                    className="card-premium p-4 group cursor-pointer bg-white transition-all hover:bg-white"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "w-1.5 h-1.5 rounded-full animate-pulse",
                                                event.mode === 'site_visit' ? "bg-primary" : "bg-ai-accent"
                                            )}></div>
                                            <span className="text-[10px] font-black uppercase text-text-main tracking-widest">
                                                {event.mode.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 tabular-nums">{format(new Date(event.slotStart), 'HH:mm')}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 group-hover:text-primary transition-colors">
                                            <User size={12} />
                                        </div>
                                        <span className="text-xs font-bold text-text-main">Lead Node: #{event.leadId.substring(0, 8)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400">
                                            <MapPin size={12} />
                                        </div>
                                        <span className="text-xs font-medium text-text-secondary">{event.meetingPoint || 'Central Office'}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

