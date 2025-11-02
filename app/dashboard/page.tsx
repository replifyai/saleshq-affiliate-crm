'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { apiClient } from '@/lib/api-client';
import { DashboardStats, DashboardFilters } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { getDateRange } from '@/lib/utils';
import { TrendingUp, Users, Ticket, DollarSign, ShoppingCart, Percent } from 'lucide-react';

export default function DashboardPage() {
  // Dummy default data to prevent hydration errors
  const defaultStats: DashboardStats = {
    totalRevenue: 0,
    totalOrders: 0,
    totalCreators: 0,
    activeCreators: 0,
    pendingCreators: 0,
    totalCoupons: 0,
    activeCoupons: 0,
    conversionRate: 0,
    averageOrderValue: 0,
  };

  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string } | null>(null);
  const [selectedDays, setSelectedDays] = useState<number>(1); // Track selected days instead of comparing dates

  useEffect(() => {
    setMounted(true);
    // Initialize date range on client only
    setDateRange(getDateRange(1));
  }, []);

  useEffect(() => {
    if (dateRange) {
      fetchStats();
    }
  }, [dateRange]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ success: boolean; data: DashboardStats }>('/dashboard/stats', {
        params: dateRange,
      });
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (days: number) => {
    setSelectedDays(days);
    setDateRange(getDateRange(days));
  };

  const statCards = [
    {
      title: 'Total Revenue',
      value: stats ? formatCurrency(stats.totalRevenue) : '$0',
      icon: DollarSign,
      color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders ? stats.totalOrders.toLocaleString() : '0',
      icon: ShoppingCart,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
    },
    {
      title: 'Active Creators',
      value: stats.activeCreators ? stats.activeCreators.toString() : '0',
      icon: Users,
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300',
    },
    {
      title: 'Active Coupons',
      value: stats.activeCoupons ? stats.activeCoupons.toString() : '0',
      icon: Ticket,
      color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300',
    },
    {
      title: 'Conversion Rate',
      value: stats ? `${stats.conversionRate.toFixed(2)}%` : '0%',
      icon: Percent,
      color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300',
    },
    {
      title: 'Average Order Value',
      value: stats ? formatCurrency(stats.averageOrderValue) : '$0',
      icon: TrendingUp,
      color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300',
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Dashboard</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-2">Overview of your affiliate program performance</p>
        </div>

        {/* Date Filter */}
        {mounted && dateRange && (
          <div className="mb-6 flex gap-2">
            {[1, 7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => handleDateChange(days)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedDays === days
                    ? 'bg-blue-600 text-white dark:bg-blue-500'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:border-slate-700'
                }`}
              >
                Last {days === 1 ? '24 Hours' : `${days} Days`}
              </button>
            ))}
          </div>
        )}

        {/* Stats Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCards.map((card, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">{card.title}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{card.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${card.color}`}>
                      <card.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Additional Info */}
        {!loading && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Creator Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-slate-400">Total Creators</span>
                    <span className="font-semibold dark:text-slate-200">{stats.totalCreators}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-slate-400">Pending Approval</span>
                    <span className="font-semibold text-yellow-600 dark:text-yellow-400">{stats.pendingCreators}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Coupon Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-slate-400">Total Coupons</span>
                    <span className="font-semibold dark:text-slate-200">{stats.totalCoupons}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-slate-400">Active Coupons</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">{stats.activeCoupons}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-slate-400">Orders</span>
                    <span className="font-semibold dark:text-slate-200">{stats.totalOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-slate-400">Revenue</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(stats.totalRevenue)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

