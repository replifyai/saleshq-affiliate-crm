'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { apiClient } from '@/lib/api-client';
import { DashboardStats } from '@/types';
import {
  DollarSign,
  ShoppingCart,
  Wallet,
  Users,
  Share2,
  Package,
  Repeat,
  BarChart3,
  TrendingUp,
  Calendar
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);


// Format currency in Indian Rupees style
function formatINR(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function formatCompactINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Stat Card Component
function StatCard({
  title,
  value,
  change,
  icon: Icon
}: {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
        <Icon className="h-4 w-4" />
        <span>{title}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-semibold text-gray-900">{value}</span>
        <span className="text-sm text-emerald-500 flex items-center mb-1">
          {change}% <TrendingUp className="h-3 w-3 ml-0.5" />
        </span>
      </div>
    </div>
  );
}

// Progress Bar Component
function ProgressBar({ percentage, maxPercentage = 100 }: { percentage: number; maxPercentage?: number }) {
  const width = (percentage / maxPercentage) * 100;
  return (
    <div className="h-2 bg-gray-100 rounded-full flex-1">
      <div
        className="h-full bg-[#EAC312] rounded-full transition-all duration-500"
        style={{ width: `${Math.min(width, 100)}%` }}
      />
    </div>
  );
}

// Channel/Product Row Component
function DataRow({
  name,
  subtitle,
  value,
  percentage,
  barWidth = 100,
  image
}: {
  name: string;
  subtitle?: string;
  value: number;
  percentage: number;
  barWidth?: number;
  image?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      {image && (
        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
          <Package className="h-4 w-4 text-gray-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-700 truncate capitalize">{name}</div>
        {subtitle && (
          <div className="text-xs text-gray-400 truncate mt-0.5">{subtitle}</div>
        )}
        <div className="mt-1">
          <ProgressBar percentage={barWidth} />
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <span className="text-sm font-medium text-gray-900">₹{value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        {percentage > 0 && (
          <span className="text-xs text-emerald-500 ml-2">{percentage}% <TrendingUp className="h-2.5 w-2.5 inline" /></span>
        )}
      </div>
    </div>
  );
}

// Product Row Component with quantity info
function ProductRow({
  name,
  value,
  soldQty,
  returnedQty,
  barWidth = 100
}: {
  name: string;
  value: number;
  soldQty: number;
  returnedQty: number;
  barWidth?: number;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
        <Package className="h-4 w-4 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-700 truncate">{name}</div>
        <div className="text-xs text-gray-400 mt-0.5">
          {soldQty} sold{returnedQty > 0 && ` · ${returnedQty} returned`}
        </div>
        <div className="mt-1">
          <ProgressBar percentage={barWidth} />
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <span className="text-sm font-medium text-gray-900">₹{value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
    </div>
  );
}

// Chart.js Conversion Rate Component
function ConversionChart({ data }: { data: number[] }) {
  const labels = ['Oct 1', 'Oct 2', 'Oct 3', 'Oct 4', 'Oct 5', 'Oct 6', 'Oct 7', 'Oct 8', 'Oct 9', 'Oct 10'];

  // Split data into actual and projected
  const actualData = data.slice(0, 7);
  const projectedData = [...Array(6).fill(null), ...data.slice(6)];

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Conversion Rate',
        data: actualData,
        borderColor: '#4A90A4',
        backgroundColor: 'rgba(74, 144, 164, 0.1)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: '#4A90A4',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: '#4A90A4',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 3,
      },
      {
        label: 'Projected',
        data: projectedData,
        borderColor: '#4A90A4',
        borderWidth: 2,
        borderDash: [6, 4],
        fill: false,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: '#4A90A4',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        titleFont: {
          size: 12,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 11,
        },
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context: { raw: unknown }) => `${context.raw}%`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 10,
          },
          maxRotation: 0,
        },
      },
      y: {
        min: 0,
        max: 10,
        grid: {
          color: '#F3F4F6',
        },
        border: {
          display: false,
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 10,
          },
          stepSize: 5,
          callback: (value: string | number) => `${value}%`,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  return (
    <div className="h-40 w-full">
      <Line data={chartData} options={options} />
    </div>
  );
}

// Affiliate Row Component
function AffiliateRow({
  name,
  value,
  percentage,
  barWidth = 100
}: {
  name: string;
  value: number;
  percentage: number;
  barWidth?: number;
}) {
  return (
    <div className="py-2">
      <div className="text-sm text-gray-700 mb-1">{name}</div>
      <div className="flex items-center gap-3">
        <ProgressBar percentage={barWidth} />
        <div className="text-right flex-shrink-0 min-w-[140px]">
          <span className="text-sm font-medium text-gray-900">₹{value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          {percentage > 0 && (
            <span className="text-xs text-emerald-500 ml-2">{percentage}% <TrendingUp className="h-2.5 w-2.5 inline" /></span>
          )}
        </div>
      </div>
    </div>
  );
}

// Affiliate Detail Row Component with orders and commission
function AffiliateDetailRow({
  name,
  revenue,
  orders,
  commission,
  barWidth = 100
}: {
  name: string;
  revenue: number;
  orders: number;
  commission: number;
  barWidth?: number;
}) {
  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm text-gray-700">{name}</div>
        <div className="text-xs text-gray-400">{orders} {orders === 1 ? 'order' : 'orders'}</div>
      </div>
      <div className="flex items-center gap-3">
        <ProgressBar percentage={barWidth} />
        <div className="text-right flex-shrink-0 min-w-[140px]">
          <span className="text-sm font-medium text-gray-900">₹{revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>
      <div className="text-xs text-gray-400 text-right mt-1">
        Commission: ₹{commission.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
  );
}

// Manager Detail Row Component with orders
function ManagerDetailRow({
  name,
  revenue,
  orders,
  barWidth = 100
}: {
  name: string;
  revenue: number;
  orders: number;
  barWidth?: number;
}) {
  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm text-gray-700">{name}</div>
        <div className="text-xs text-gray-400">{orders} {orders === 1 ? 'order' : 'orders'}</div>
      </div>
      <div className="flex items-center gap-3">
        <ProgressBar percentage={barWidth} />
        <div className="text-right flex-shrink-0 min-w-[140px]">
          <span className="text-sm font-medium text-gray-900">₹{revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  // Default to today
  const getDefaultDates = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    return {
      startDate: today,
      endDate: today,
    };
  };

  const defaultDates = getDefaultDates();
  const defaultStats: DashboardStats = {
    totalRevenue: 0,
    totalOrders: 0,
    totalCommissions: 0,
    totalActiveAffiliates: 0,
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
  const [selectedFilter, setSelectedFilter] = useState<'today' | 'custom'>('today');
  const [startDate, setStartDate] = useState<string>(defaultDates.startDate);
  const [endDate, setEndDate] = useState<string>(defaultDates.endDate);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchStats();
  }, []);

  const fetchStats = async (customStartDate?: string, customEndDate?: string, force24Hours?: boolean) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      // Format date as YYYY-MM-DD
      const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      let startDateStr: string;
      let endDateStr: string;

      if (force24Hours) {
        // Force today mode
        const now = new Date();
        const today = formatDate(now);
        startDateStr = today;
        endDateStr = today;
      } else if (customStartDate || selectedFilter === 'custom') {
        startDateStr = customStartDate || startDate;
        endDateStr = customEndDate || endDate;
      } else {
        // Default to today
        const now = new Date();
        const today = formatDate(now);
        startDateStr = today;
        endDateStr = today;
      }

      params.append('startDate', startDateStr);
      params.append('endDate', endDateStr);

      const url = `/dashboard/stats?${params.toString()}`;
      const response = await apiClient.get<{ success: boolean; data: DashboardStats }>(url);
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTodayClick = () => {
    const dates = getDefaultDates();
    setStartDate(dates.startDate);
    setEndDate(dates.endDate);
    setSelectedFilter('today');
    setShowDatePicker(false);
    // Force today mode to avoid stale state issues
    fetchStats(undefined, undefined, true);
  };

  const handleCustomDateApply = () => {
    if (startDate && endDate && new Date(startDate) <= new Date(endDate)) {
      setSelectedFilter('custom');
      setShowDatePicker(false);
      fetchStats(startDate, endDate);
    }
  };

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showDatePicker && !target.closest('.date-picker-container')) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDatePicker]);

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <div className="flex items-center gap-2 relative">
              <button
                onClick={handleTodayClick}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${selectedFilter === 'today'
                  ? 'bg-white border-gray-300 text-gray-900'
                  : 'bg-transparent border-gray-200 text-gray-500 hover:bg-white'
                  }`}
              >
                <Calendar className="h-3.5 w-3.5 inline mr-1.5" />
                Today
              </button>
              <div className="relative date-picker-container">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${selectedFilter === 'custom'
                    ? 'bg-white border-gray-300 text-gray-900'
                    : 'bg-transparent border-gray-200 text-gray-500 hover:bg-white'
                    }`}
                >
                  <Calendar className="h-3.5 w-3.5 inline mr-1.5" />
                  {selectedFilter === 'custom'
                    ? `${startDate} - ${endDate}`
                    : 'Custom Range'
                  }
                </button>
                {showDatePicker && (
                  <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 min-w-[320px]">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EAC312] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          min={startDate}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EAC312] focus:border-transparent"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleCustomDateApply}
                          className="flex-1 px-3 py-2 text-sm bg-[#EAC312] text-gray-900 rounded-lg font-medium hover:bg-[#d4b010] transition-colors"
                        >
                          Apply
                        </button>
                        <button
                          onClick={() => {
                            setShowDatePicker(false);
                            const dates = getDefaultDates();
                            setStartDate(dates.startDate);
                            setEndDate(dates.endDate);
                          }}
                          className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Last refreshed: {mounted ? getCurrentTime() : '11:56 AM'}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-[#EAC312]"></div>
          </div>
        ) : (
          <>
            {/* Top Stats Row */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <StatCard
                title="Total Revenue"
                value={`₹${stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                change={0}
                icon={DollarSign}
              />
              <StatCard
                title="Total Orders"
                value={stats.totalOrders.toLocaleString('en-IN')}
                change={0}
                icon={ShoppingCart}
              />
              <StatCard
                title="Total Commissions"
                value={`₹${(stats.totalCommissions ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                change={0}
                icon={Wallet}
              />
              <StatCard
                title="Total Active Affiliates"
                value={(stats.totalActiveAffiliates ?? 0).toLocaleString('en-IN')}
                change={0}
                icon={Users}
              />
            </div>

            {/* Sales by Channels & Products Row */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Sales by Social Channels */}
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 text-gray-700 font-medium mb-4">
                  <Share2 className="h-4 w-4" />
                  <span>Total sales by social channels</span>
                </div>
                <div className="space-y-1">
                  {stats.salesBySocialChannel && Object.keys(stats.salesBySocialChannel).length > 0 ? (
                    (() => {
                      const channels = Object.entries(stats.salesBySocialChannel)
                        .map(([key, value]: [string, any]) => {
                          const isNumber = typeof value === 'number';
                          const sales = isNumber
                            ? value
                            : (value?.revenue ?? value?.sales ?? 0);
                          const orders = isNumber ? 0 : (value?.orders ?? 0);
                          return {
                            key,
                            name: key,
                            sales,
                            orders,
                          };
                        })
                        .sort((a, b) => b.sales - a.sales);
                      const maxSales = channels.length > 0 ? Math.max(...channels.map(c => c.sales)) : 1;
                      return channels.map((channel, index) => (
                        <DataRow
                          key={channel.key}
                          name={channel.name}
                          value={channel.sales}
                          subtitle={channel.orders ? `${channel.orders} ${channel.orders === 1 ? 'order' : 'orders'}` : undefined}
                          percentage={0}
                          barWidth={maxSales > 0 ? (channel.sales / maxSales) * 100 : 0}
                        />
                      ));
                    })()
                  ) : (
                    <div className="text-sm text-gray-500 py-4 text-center">No social channel data available</div>
                  )}
                </div>
              </div>

              {/* Sales by Product */}
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 text-gray-700 font-medium mb-4">
                  <Package className="h-4 w-4" />
                  <span>Total sales by product</span>
                </div>
                <div className="space-y-1">
                  {stats.salesByProduct && Object.keys(stats.salesByProduct).length > 0 ? (
                    (() => {
                      const products = Object.entries(stats.salesByProduct)
                        .map(([key, product]: [string, any]) => ({
                          key,
                          name: product.name || `Product ${key}`,
                          sales: product.sales || 0,
                          soldQty: product.sold_qty || 0,
                          returnedQty: product.returned_qty || 0,
                        }))
                        .sort((a, b) => b.sales - a.sales)
                        .slice(0, 5);
                      const maxSales = products.length > 0 ? Math.max(...products.map(p => p.sales)) : 1;
                      return products.map((product) => (
                        <ProductRow
                          key={product.key}
                          name={product.name}
                          value={product.sales}
                          soldQty={product.soldQty}
                          returnedQty={product.returnedQty}
                          barWidth={maxSales > 0 ? (product.sales / maxSales) * 100 : 0}
                        />
                      ));
                    })()
                  ) : (
                    <div className="text-sm text-gray-500 py-4 text-center">No product data available</div>
                  )}
                </div>
              </div>
            </div>

            {/* Conversion Rate & Sales Breakdown Row */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Referral Conversion Rate */}
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                  <Repeat className="h-4 w-4" />
                  <span>Referral conversion rate</span>
                </div>
                <div className="flex items-end gap-2 mb-4">
                  <span className="text-3xl font-semibold text-gray-900">{stats.conversionRate.toFixed(2)}%</span>
                  <span className="text-sm text-gray-500 mb-1">N/A</span>
                </div>
                <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
                  Chart data not available
                </div>
              </div>

              {/* Total Sales Breakdown */}
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 text-gray-700 font-medium mb-4">
                  <BarChart3 className="h-4 w-4" />
                  <span>Total sales breakdown</span>
                </div>
                <div className="space-y-3">
                  {stats.salesBreakdown ? [
                    { label: 'Gross Sales', value: stats.salesBreakdown.grossSales, positive: true },
                    { label: 'Discounts', value: stats.salesBreakdown.discounts, positive: false },
                    { label: 'Shipping', value: stats.salesBreakdown.shipping, positive: true },
                    { label: 'Taxes', value: stats.salesBreakdown.taxes, positive: true },
                    { label: 'Returns', value: stats.salesBreakdown.returns, positive: null, red: true },
                    { label: 'Payouts', value: stats.salesBreakdown.payouts, positive: false },
                    { label: 'Commissions', value: stats.salesBreakdown.commissions ?? 0, positive: false },
                    { label: 'Total Sales', value: stats.salesBreakdown.totalSales, positive: true, bold: true },
                    { label: 'Net Sales', value: stats.salesBreakdown.totalSales - stats.salesBreakdown.returns, positive: true, bold: true },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center">
                      <span className={`text-sm ${item.bold ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                        {item.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${item.bold ? 'font-semibold' : 'font-medium'} ${item.red ? 'text-red-500' : 'text-gray-900'}`}>
                          {item.value === 0 ? '₹0.00' : (
                            item.value < 0
                              ? `-₹${Math.abs(item.value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : `₹${item.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          )}
                        </span>
                        {item.positive === null && !item.red && <span className="text-xs text-gray-400">-</span>}
                      </div>
                    </div>
                  )) : (
                    <div className="text-sm text-gray-500 py-4 text-center">No sales breakdown data available</div>
                  )}
                </div>
              </div>
            </div>

            {/* Top Affiliates Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Sales by Affiliates */}
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 text-gray-700 font-medium mb-4">
                  <Share2 className="h-4 w-4" />
                  <span>Sales by affiliates (Top 5)</span>
                </div>
                <div className="space-y-1">
                  {stats.topAffiliates && stats.topAffiliates.length > 0 ? (
                    stats.topAffiliates.slice(0, 5).map((affiliate) => {
                      const maxRevenue = Math.max(...stats.topAffiliates!.map(a => a.revenue || 0));
                      const barWidth = maxRevenue > 0 ? ((affiliate.revenue || 0) / maxRevenue) * 100 : 0;
                      return (
                        <AffiliateDetailRow
                          key={affiliate.id}
                          name={affiliate.name}
                          revenue={affiliate.revenue || 0}
                          orders={affiliate.orders || 0}
                          commission={affiliate.commission || 0}
                          barWidth={barWidth}
                        />
                      );
                    })
                  ) : (
                    <div className="text-sm text-gray-500 py-4 text-center">No affiliate data available</div>
                  )}
                </div>
              </div>

              {/* Sales by Affiliate Managers */}
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 text-gray-700 font-medium mb-4">
                  <Share2 className="h-4 w-4" />
                  <span>Sales by affiliate managers (Top 5)</span>
                </div>
                <div className="space-y-1">
                  {stats.topManagers && stats.topManagers.length > 0 ? (
                    stats.topManagers.slice(0, 5).map((manager, index) => {
                      const maxValue = Math.max(...stats.topManagers!.map((m) => m.revenue || 0));
                      const barWidth = maxValue > 0 ? ((manager.revenue || 0) / maxValue) * 100 : 0;
                      return (
                        <ManagerDetailRow
                          key={manager.id || index}
                          name={manager.name || 'Unknown Manager'}
                          revenue={manager.revenue || 0}
                          orders={manager.orders || 0}
                          barWidth={barWidth}
                        />
                      );
                    })
                  ) : (
                    <div className="text-sm text-gray-500 py-4 text-center">No manager data available</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
