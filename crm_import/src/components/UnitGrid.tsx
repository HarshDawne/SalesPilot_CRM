'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Unit, UnitType, UnitStatus, Tower, PropertyDocument } from '@/types/property';
import { Home, Square, TrendingUp, Filter, Grid3x3, List, MapPin, Building2, FileText, Image as ImageIcon, Clock, User } from 'lucide-react';
import UnitDocumentsModal from './UnitDocumentsModal';

interface UnitGridProps {
  units: Unit[];
  towers?: Tower[];
  documents?: PropertyDocument[];
  onUnitClick?: (unit: Unit) => void;
  externalStatusFilter?: UnitStatus | 'ALL';
  externalTowerFilter?: string;
}

export default function UnitGrid({ units, towers = [], documents = [], onUnitClick, externalStatusFilter, externalTowerFilter }: UnitGridProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<UnitType | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<UnitStatus | 'ALL'>('ALL');
  const [towerFilter, setTowerFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'price' | 'area' | 'floor'>('price');

  // Sync with external filters
  useEffect(() => {
    if (externalStatusFilter) setFilterStatus(externalStatusFilter);
  }, [externalStatusFilter]);

  useEffect(() => {
    if (externalTowerFilter) setTowerFilter(externalTowerFilter);
  }, [externalTowerFilter]);

  // Modal state for viewing documents
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);

  // Get documents for a specific unit
  const getUnitDocuments = (unitId: string) => {
    return documents.filter(doc => doc.unitId === unitId);
  };

  // Create a map of towerId to tower name for display
  const towerMap = useMemo(() => {
    const map: Record<string, string> = {};
    towers.forEach(tower => {
      map[tower.id] = tower.name;
    });
    return map;
  }, [towers]);

  // Generate tower options from units data (unique towerIds)
  const towerOptions = useMemo(() => {
    const uniqueTowerIds = [...new Set(units.map(u => u.towerId))];
    // If we have tower data, use tower names; otherwise use tower IDs
    const options = uniqueTowerIds.map(towerId => ({
      id: towerId,
      name: towerMap[towerId] || towerId
    }));
    // Sort alphabetically by name
    return options.sort((a, b) => a.name.localeCompare(b.name));
  }, [units, towerMap]);

  // Stats for Chips
  const stats = useMemo(() => {
    return {
      available: units.filter(u => u.status === UnitStatus.AVAILABLE).length,
      reserved: units.filter(u => u.status === UnitStatus.RESERVED).length,
      negotiation: units.filter(u => u.status === UnitStatus.NEGOTIATION).length,
      booked: units.filter(u => u.status === UnitStatus.BOOKED).length,
      blocked: units.filter(u => u.status === UnitStatus.BLOCKED).length,
    }
  }, [units]);

  const getStatusColor = (status: UnitStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20';
      case 'RESERVED':
        return 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20';
      case 'NEGOTIATION':
        return 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20';
      case 'BOOKED':
        return 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20';
      case 'BLOCKED':
        return 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20';
      default:
        return 'bg-slate-50 text-slate-700 ring-1 ring-slate-600/20';
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)} L`;
    }
    return `₹${price.toLocaleString()}`;
  };

  const formatUnitType = (type: UnitType | string) => {
    return type.toString().replace('_', ' ');
  };

  // Filter units
  let filteredUnits = units;

  // Tower filter
  if (towerFilter !== 'all') {
    filteredUnits = filteredUnits.filter(u => u.towerId === towerFilter);
  }

  if (filterType !== 'ALL') {
    filteredUnits = filteredUnits.filter(u => u.type === filterType);
  }
  if (filterStatus !== 'ALL') {
    filteredUnits = filteredUnits.filter(u => u.status === filterStatus);
  }

  // Sort units
  filteredUnits = [...filteredUnits].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return b.totalPrice - a.totalPrice;
      case 'area':
        return b.carpetArea - a.carpetArea;
      case 'floor':
        return b.floor - a.floor;
      default:
        return 0;
    }
  });


  if (units.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <Home className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No units found for this property</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filters and Controls */}
      {/* Filters and Controls */}
      <div className="premium-card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block" />

          {/* Type Filter */}
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as UnitType | 'ALL')}
              className="appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all hover:bg-slate-100 cursor-pointer"
            >
              <option value="ALL">All Types</option>
              {Object.values(UnitType).map(type => (
                <option key={type} value={type}>{formatUnitType(type)}</option>
              ))}
            </select>
            <Filter className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as UnitStatus | 'ALL')}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all hover:bg-slate-100 cursor-pointer"
          >
            <option value="ALL">All Status</option>
            {Object.values(UnitStatus).map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          {/* Tower Filter */}
          {towerOptions.length > 0 && (
            <select
              value={towerFilter}
              onChange={(e) => setTowerFilter(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all hover:bg-slate-100 cursor-pointer"
            >
              <option value="all">All Towers</option>
              {towerOptions.map(tower => (
                <option key={tower.id} value={tower.id}>{tower.name}</option>
              ))}
            </select>
          )}

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'price' | 'area' | 'floor')}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all hover:bg-slate-100 cursor-pointer ml-auto"
          >
            <option value="price">Sort by Price</option>
            <option value="area">Sort by Area</option>
            <option value="floor">Sort by Floor</option>
          </select>

          {/* Results Count */}
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {filteredUnits.length} Units
          </div>
        </div>

        {/* Quick Summary Chips */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
          {[
            { label: 'Available', count: stats.available, status: UnitStatus.AVAILABLE },
            { label: 'Reserved', count: stats.reserved, status: UnitStatus.RESERVED },
            { label: 'Negotiation', count: stats.negotiation, status: UnitStatus.NEGOTIATION },
            { label: 'Booked', count: stats.booked, status: UnitStatus.BOOKED },
            { label: 'Blocked', count: stats.blocked, status: UnitStatus.BLOCKED },
          ].map((chip) => (
            <button
              key={chip.label}
              onClick={() => setFilterStatus(chip.status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
                        ${filterStatus === chip.status
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-white'}`}
            >
              {chip.label} ({chip.count})
            </button>
          ))}
        </div>
      </div>

      {/* Units Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUnits.map((unit) => (
            <div
              key={unit.id}
              onClick={() => onUnitClick?.(unit)}
              className={`premium-card p-5 group ${onUnitClick ? 'cursor-pointer hover:border-indigo-300' : ''
                }`}
            >
              {/* Unit Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 font-bold text-slate-700">
                    {unit.unitNumber.replace(/\D/g, '')}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{unit.unitNumber}</h3>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{formatUnitType(unit.type)}</p>
                  </div>
                </div>
                <span className={`badge-pill ${getStatusColor(unit.status)}`}>
                  {unit.status}
                </span>
              </div>

              {/* Price */}
              <div className="mb-4 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Price</span>
                  <div className="text-xl font-bold text-slate-900">{formatPrice(unit.totalPrice)}</div>
                </div>
                <div className="mt-1 pt-1 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
                  <span>Rate</span>
                  <span className="font-mono">₹{(unit.totalPrice / unit.carpetArea).toLocaleString()}/sq.ft</span>
                </div>
              </div>

              {/* Specs */}
              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="flex items-center gap-2 text-slate-600 bg-white p-2 rounded border border-slate-100">
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium">{unit.carpetArea} <span className="text-xs text-slate-400 font-normal">sq.ft</span></span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 bg-white p-2 rounded border border-slate-100">
                  <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium">Floor {unit.floor}</span>
                </div>
                {unit.specifications?.bedrooms && (
                  <div className="flex items-center gap-2 text-slate-600 bg-white p-2 rounded border border-slate-100">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium">{unit.specifications.bedrooms} BHK</span>
                  </div>
                )}
                {unit.facing && (
                  <div className="flex items-center gap-2 text-slate-600 bg-white p-2 rounded border border-slate-100">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium">{unit.facing}</span>
                  </div>
                )}
              </div>

              {/* Reservation / Booking Info */}
              {(['BOOKED', 'RESERVED', 'NEGOTIATION'].includes(unit.status) || (unit.reservation && unit.reservation.isActive)) && (
                <div className="mt-3 pt-3 border-t border-slate-100 text-xs flex flex-col gap-2">
                  {unit.reservation?.isActive && (
                    <div className="text-amber-600 flex items-center gap-1.5 bg-amber-50 p-2 rounded-lg">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="font-medium">Reserved until {new Date(unit.reservation.expiresAt).toLocaleDateString()}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-600">
                        {unit.status === 'BOOKED' ? 'Booked by:' : 'Lead:'} <span className="font-medium text-slate-900">{unit.reservation?.reservedBy || "Unknown Lead"}</span>
                      </span>
                    </div>
                    {unit.reservation?.leadId && (
                      <Link href={`/leads/${unit.reservation.leadId}`} className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline">
                        View
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedUnit(unit);
                  setShowDocumentsModal(true);
                }}
                className={`mt-2 w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-xl transition-all border shadow-sm
                    ${unit.status === 'BOOKED'
                    ? 'text-indigo-600 bg-indigo-50 border-indigo-100 hover:bg-indigo-100'
                    : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
              >
                {unit.status === 'BOOKED' ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                {unit.status === 'BOOKED' ? 'View Documents' : 'Manage Assets'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Unit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Floor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Area</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUnits.map((unit) => (
                <tr
                  key={unit.id}
                  onClick={() => onUnitClick?.(unit)}
                  className={onUnitClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{unit.unitNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatUnitType(unit.type)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{unit.floor}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{unit.carpetArea} sq.ft</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatPrice(unit.totalPrice)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(unit.status)}`}>
                      {unit.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Documents Modal */}
      {selectedUnit && (
        <UnitDocumentsModal
          isOpen={showDocumentsModal}
          onClose={() => {
            setShowDocumentsModal(false);
            setSelectedUnit(null);
          }}
          unit={selectedUnit}
          documents={getUnitDocuments(selectedUnit.id)}
        />
      )}
    </div>
  );
}
