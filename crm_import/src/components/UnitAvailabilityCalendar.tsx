'use client';

import { useState, useEffect } from 'react';
import { Unit, UnitStatus } from '@/types/property';
import { Calendar, ChevronLeft, ChevronRight, Grid3x3, List, Filter } from 'lucide-react';

interface UnitAvailabilityCalendarProps {
  propertyId: string;
  towerId?: string;
}

type ViewMode = 'month' | 'week' | 'day';

export default function UnitAvailabilityCalendar({ propertyId, towerId }: UnitAvailabilityCalendarProps) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState<UnitStatus | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnits();
  }, [propertyId, towerId]);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (propertyId) params.append('propertyId', propertyId);
      if (towerId) params.append('towerId', towerId);

      const response = await fetch(`/api/units?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setUnits(data.data);
      }
    } catch (error) {
      console.error('Error fetching units:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: UnitStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'RESERVED':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'NEGOTIATION':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'BOOKED':
        return 'bg-gray-100 border-gray-300 text-gray-800';
      case 'BLOCKED':
        return 'bg-red-100 border-red-300 text-red-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, firstDay, lastDay };
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setDate(newDate.getDate() + 7);
      }
      return newDate;
    });
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setDate(newDate.getDate() - 1);
      } else {
        newDate.setDate(newDate.getDate() + 1);
      }
      return newDate;
    });
  };

  const isReservedOnDate = (unit: Unit, date: Date) => {
    if (!unit.reservation || !unit.reservation.isActive) return false;
    
    const reservedAt = new Date(unit.reservation.reservedAt);
    const expiresAt = new Date(unit.reservation.expiresAt);
    
    return date >= reservedAt && date <= expiresAt;
  };

  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Filter units
  let filteredUnits = units;
  if (filterStatus !== 'ALL') {
    filteredUnits = filteredUnits.filter(u => u.status === filterStatus);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'month' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'week' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'day' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Day
            </button>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (viewMode === 'month') navigateMonth('prev');
                else if (viewMode === 'week') navigateWeek('prev');
                else navigateDay('prev');
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
              {viewMode === 'month' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              {viewMode === 'week' && `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
              {viewMode === 'day' && currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <button
              onClick={() => {
                if (viewMode === 'month') navigateMonth('next');
                else if (viewMode === 'week') navigateWeek('next');
                else navigateDay('next');
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Today
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as UnitStatus | 'ALL')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Status</option>
            {Object.values(UnitStatus).map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar View */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {viewMode === 'month' && (
          <MonthView 
            units={filteredUnits}
            currentDate={currentDate}
            getStatusColor={getStatusColor}
            isReservedOnDate={isReservedOnDate}
          />
        )}
        {viewMode === 'week' && (
          <WeekView 
            units={filteredUnits}
            weekDays={getWeekDays()}
            getStatusColor={getStatusColor}
            isReservedOnDate={isReservedOnDate}
          />
        )}
        {viewMode === 'day' && (
          <DayView 
            units={filteredUnits}
            currentDate={currentDate}
            getStatusColor={getStatusColor}
          />
        )}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Status Legend</h3>
        <div className="flex flex-wrap gap-4">
          {Object.values(UnitStatus).map(status => (
            <div key={status} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded border-2 ${getStatusColor(status)}`}></div>
              <span className="text-sm text-gray-700">{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Month View Component
function MonthView({ units, currentDate, getStatusColor, isReservedOnDate }: any) {
  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const days = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="min-h-[100px] bg-gray-50"></div>);
  }

  // Add days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const isToday = date.toDateString() === new Date().toDateString();

    days.push(
      <div key={day} className={`min-h-[100px] border border-gray-200 p-2 ${isToday ? 'bg-blue-50' : 'bg-white'}`}>
        <div className={`text-sm font-medium mb-2 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
          {day}
        </div>
        <div className="space-y-1">
          {units.slice(0, 3).map((unit: Unit) => {
            const reserved = isReservedOnDate(unit, date);
            if (!reserved && unit.status === 'AVAILABLE') return null;
            
            return (
              <div
                key={unit.id}
                className={`text-xs px-2 py-1 rounded border ${getStatusColor(unit.status)}`}
                title={`${unit.unitNumber} - ${unit.status}`}
              >
                {unit.unitNumber}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-7">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
        <div key={day} className="bg-gray-100 border border-gray-200 p-2 text-center font-semibold text-sm text-gray-700">
          {day}
        </div>
      ))}
      {days}
    </div>
  );
}

function getDaysInMonth(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  return { daysInMonth, startingDayOfWeek, firstDay, lastDay };
}

// Week View Component
function WeekView({ units, weekDays, getStatusColor, isReservedOnDate }: any) {
  return (
    <div className="grid grid-cols-7">
      {weekDays.map((day: Date) => {
        const isToday = day.toDateString() === new Date().toDateString();
        return (
          <div key={day.toISOString()} className={`border border-gray-200 p-3 ${isToday ? 'bg-blue-50' : 'bg-white'}`}>
            <div className={`text-sm font-medium mb-3 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
              {day.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
            </div>
            <div className="space-y-2">
              {units.map((unit: Unit) => {
                const reserved = isReservedOnDate(unit, day);
                if (!reserved && unit.status === 'AVAILABLE') return null;
                
                return (
                  <div
                    key={unit.id}
                    className={`text-xs px-2 py-1.5 rounded border ${getStatusColor(unit.status)}`}
                    title={`${unit.unitNumber} - ${unit.type}`}
                  >
                    <div className="font-medium">{unit.unitNumber}</div>
                    <div className="text-[10px] opacity-75">{unit.type.replace('_', ' ')}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Day View Component
function DayView({ units, currentDate, getStatusColor }: any) {
  const isToday = currentDate.toDateString() === new Date().toDateString();

  return (
    <div className="p-6">
      <div className={`text-lg font-semibold mb-4 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
        {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {units.map((unit: Unit) => (
          <div
            key={unit.id}
            className={`border-2 rounded-lg p-4 ${getStatusColor(unit.status)}`}
          >
            <div className="font-semibold text-lg mb-2">{unit.unitNumber}</div>
            <div className="text-sm space-y-1">
              <div>Type: {unit.type.replace('_', ' ')}</div>
              <div>Floor: {unit.floor}</div>
              <div>Area: {unit.carpetArea} sq.ft</div>
              <div>Status: <span className="font-medium">{unit.status}</span></div>
              {unit.reservation && unit.reservation.isActive && (
                <div className="mt-2 pt-2 border-t border-current/20">
                  <div className="text-xs">
                    Reserved until: {new Date(unit.reservation.expiresAt).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
