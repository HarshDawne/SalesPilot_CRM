'use client';

import { useState, useEffect } from 'react';
import { PropertyInventoryStats } from '@/types/property';
import { BarChart3, TrendingUp, AlertCircle, Home, Building2 } from 'lucide-react';

interface InventoryDashboardProps {
  propertyId?: string;
}

export default function InventoryDashboard({ propertyId }: InventoryDashboardProps) {
  const [stats, setStats] = useState<PropertyInventoryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventoryStats();
  }, [propertyId]);

  const fetchInventoryStats = async () => {
    try {
      setLoading(true);
      const url = propertyId 
        ? `/api/inventory/stats?propertyId=${propertyId}`
        : '/api/inventory/stats';
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-500">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p>No inventory data available</p>
      </div>
    );
  }

  const statusData = [
    { label: 'Available', value: stats.available, color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50' },
    { label: 'Reserved', value: stats.reserved, color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' },
    { label: 'Negotiation', value: stats.negotiation, color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
    { label: 'Booked', value: stats.booked, color: 'bg-gray-500', textColor: 'text-gray-700', bgColor: 'bg-gray-50' },
    { label: 'Blocked', value: stats.blocked, color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">Real-time inventory analytics and metrics</p>
        </div>
        <button
          onClick={fetchInventoryStats}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Units</span>
            <Home className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalUnits}</div>
          <div className="text-xs text-gray-500 mt-1">All units in inventory</div>
        </div>

        <div className="bg-green-50 rounded-lg border border-green-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-green-700">Available</span>
            <Building2 className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-700">{stats.available}</div>
          <div className="text-xs text-green-600 mt-1">
            {((stats.available / stats.totalUnits) * 100).toFixed(1)}% of total
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-700">Occupancy Rate</span>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-blue-700">{stats.occupancyRate.toFixed(1)}%</div>
          <div className="text-xs text-blue-600 mt-1">
            {stats.booked + stats.reserved} units occupied
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-yellow-700">In Pipeline</span>
            <AlertCircle className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-yellow-700">{stats.reserved + stats.negotiation}</div>
          <div className="text-xs text-yellow-600 mt-1">
            Reserved + Negotiation
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
        <div className="space-y-4">
          {statusData.map((item) => {
            const percentage = (item.value / stats.totalUnits) * 100;
            return (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{item.value}</span>
                    <span className="text-xs text-gray-500 ml-2">({percentage.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`${item.color} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statusData.map((item) => (
          <div key={item.label} className={`${item.bgColor} rounded-lg border-2 ${item.color.replace('bg-', 'border-')} p-4`}>
            <div className={`text-2xl font-bold ${item.textColor}`}>{item.value}</div>
            <div className="text-sm text-gray-600 mt-1">{item.label}</div>
            <div className="text-xs text-gray-500 mt-2">
              {((item.value / stats.totalUnits) * 100).toFixed(1)}% of total
            </div>
          </div>
        ))}
      </div>

      {/* Alerts Section */}
      {(stats.blocked > 0 || stats.reserved > 5) && (
        <div className="bg-orange-50 rounded-lg border border-orange-200 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-orange-900 mb-2">Inventory Alerts</h3>
              <ul className="space-y-1 text-sm text-orange-800">
                {stats.blocked > 0 && (
                  <li>• {stats.blocked} unit(s) are currently blocked</li>
                )}
                {stats.reserved > 5 && (
                  <li>• {stats.reserved} unit(s) reserved - monitor for expiry</li>
                )}
                {stats.available < stats.totalUnits * 0.2 && (
                  <li>• Low availability warning - only {stats.available} units remaining</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Inventory Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Inventory:</span>
            <span className="font-medium text-gray-900">{stats.totalUnits} units</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Available for Sale:</span>
            <span className="font-medium text-green-700">{stats.available} units</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">In Sales Pipeline:</span>
            <span className="font-medium text-blue-700">{stats.reserved + stats.negotiation} units</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Sold/Booked:</span>
            <span className="font-medium text-gray-700">{stats.booked} units</span>
          </div>
        </div>
      </div>
    </div>
  );
}
