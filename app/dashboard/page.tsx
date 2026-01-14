'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { apiClient } from '@/lib/api-client';
import { DashboardStats } from '@/types';
import { 
  DollarSign, 
  ShoppingCart, 
  FolderOpen, 
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

// Mock data for the dashboard - will be replaced with API data
const mockData = {
  // Top stats
  totalRevenue: 1743245,
  totalOrders: 13445,
  sessions: 1843445,
  activeAffiliates: 3445,
  
  // Sales by social channels
  socialChannels: [
    { name: 'Instagram', value: 3975471, percentage: 24 },
    { name: 'Youtube', value: 3975471, percentage: 24 },
    { name: 'Facebook', value: 3975471, percentage: 24 },
    { name: 'Twitter', value: 3975471, percentage: 24 },
    { name: 'Linkedin', value: 3975471, percentage: 24 },
  ],
  
  // Sales by product
  products: [
    { name: 'Frido Ultimate Wedge Plus Cushion', value: 39754706.71, percentage: 24, image: '/products/cushion.jpg' },
    { name: 'Ultimate Car Comfort Bundle', value: 39754706.71, percentage: 24, image: '/products/bundle.jpg' },
    { name: 'Frido Car Neck Mini Pillow', value: 39754706.71, percentage: 24, image: '/products/pillow.jpg' },
    { name: 'Frido Travel Neck Pillow', value: 39754706.71, percentage: 24, image: '/products/travel.jpg' },
    { name: 'Frido Barefoot Sock Shoe Pro', value: 39754706.71, percentage: 24, image: '/products/sock.jpg' },
  ],
  
  // Conversion rate data points for chart
  conversionRate: 4.27,
  conversionChange: -15,
  conversionData: [3, 4, 5, 6, 8, 7, 6.5, 7, 6, 5.5],
  
  // Sales breakdown
  salesBreakdown: {
    grossSales: 39754706.71,
    orders: 754706.71,
    discounts: -39754.71,
    payouts: -39754.71,
    returns: 0,
    taxes: 39754.71,
    totalSales: 32754706.71,
  },
  
  // Top affiliates
  topAffiliates: [
    { name: 'Alister D Silva', value: 39754706.71, percentage: 24 },
    { name: 'Abin Sasidharan', value: 3975471, percentage: 24 },
    { name: 'James Tharakan', value: 3975471, percentage: 24 },
    { name: 'Manmohan', value: 3975471, percentage: 24 },
    { name: 'Saloma Palms', value: 3975471, percentage: 24 },
  ],
  
  // Top affiliate managers
  topManagers: [
    { name: 'Saiyed Abdal', value: 39754706.71, percentage: 24 },
    { name: 'Gautami Chati', value: 3975471, percentage: 24 },
    { name: 'Parag Swami', value: 3975471, percentage: 24 },
    { name: 'Dileep Pakkat', value: 3975471, percentage: 24 },
    { name: 'Chaitrali Bokil', value: 3975471, percentage: 24 },
  ],
};

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
  value, 
  percentage,
  barWidth = 100,
  image
}: { 
  name: string; 
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
        <div className="text-sm text-gray-700 truncate mb-1">{name}</div>
        <ProgressBar percentage={barWidth} />
      </div>
      <div className="text-right flex-shrink-0">
        <span className="text-sm font-medium text-gray-900">₹{(value / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).slice(0, 8)}..71</span>
        <span className="text-xs text-emerald-500 ml-2">{percentage}% <TrendingUp className="h-2.5 w-2.5 inline" /></span>
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
          <span className="text-sm font-medium text-gray-900">₹{(value / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).slice(0, 8)}..71</span>
          <span className="text-xs text-emerald-500 ml-2">{percentage}% <TrendingUp className="h-2.5 w-2.5 inline" /></span>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
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
  const [selectedFilter, setSelectedFilter] = useState<'30days' | 'custom'>('30days');

  useEffect(() => {
    setMounted(true);
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ success: boolean; data: DashboardStats }>('/dashboard/stats');
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

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
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setSelectedFilter('30days')}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  selectedFilter === '30days' 
                    ? 'bg-white border-gray-300 text-gray-900' 
                    : 'bg-transparent border-gray-200 text-gray-500 hover:bg-white'
                }`}
              >
                <Calendar className="h-3.5 w-3.5 inline mr-1.5" />
                Last 30 days
              </button>
              <button
                onClick={() => setSelectedFilter('custom')}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  selectedFilter === 'custom' 
                    ? 'bg-white border-gray-300 text-gray-900' 
                    : 'bg-transparent border-gray-200 text-gray-500 hover:bg-white'
                }`}
              >
                <Calendar className="h-3.5 w-3.5 inline mr-1.5" />
                Aug 31-Sep30,2025
              </button>
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
                value={`₹${mockData.totalRevenue.toLocaleString('en-IN')}`}
                change={24}
                icon={DollarSign}
              />
              <StatCard 
                title="Total Orders" 
                value={mockData.totalOrders.toLocaleString('en-IN')}
                change={24}
                icon={ShoppingCart}
              />
              <StatCard 
                title="Sessions" 
                value={mockData.sessions.toLocaleString('en-IN')}
                change={24}
                icon={FolderOpen}
              />
              <StatCard 
                title="Active Affiliates" 
                value={mockData.activeAffiliates.toLocaleString('en-IN')}
                change={24}
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
                  {mockData.socialChannels.map((channel, index) => (
                    <DataRow 
                      key={channel.name}
                      name={channel.name}
                      value={channel.value}
                      percentage={channel.percentage}
                      barWidth={100 - index * 15}
                    />
                  ))}
                    </div>
                  </div>

              {/* Sales by Product */}
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 text-gray-700 font-medium mb-4">
                  <Package className="h-4 w-4" />
                  <span>Total sales by product</span>
                </div>
                <div className="space-y-1">
                  {mockData.products.map((product, index) => (
                    <DataRow 
                      key={product.name}
                      name={product.name}
                      value={product.value}
                      percentage={product.percentage}
                      barWidth={100 - index * 10}
                      image={product.image}
                    />
            ))}
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
                  <span className="text-3xl font-semibold text-gray-900">{mockData.conversionRate}%</span>
                  <span className="text-sm text-red-500 mb-1">{mockData.conversionChange}% ↓</span>
                </div>
                <ConversionChart data={mockData.conversionData} />
              </div>

              {/* Total Sales Breakdown */}
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 text-gray-700 font-medium mb-4">
                  <BarChart3 className="h-4 w-4" />
                  <span>Total sales breakdown</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Gross Sales', value: mockData.salesBreakdown.grossSales, positive: true },
                    { label: 'Orders', value: mockData.salesBreakdown.orders, positive: true },
                    { label: 'Discounts', value: mockData.salesBreakdown.discounts, positive: false },
                    { label: 'Payouts', value: mockData.salesBreakdown.payouts, positive: false },
                    { label: 'Returns', value: mockData.salesBreakdown.returns, positive: null },
                    { label: 'Taxes', value: mockData.salesBreakdown.taxes, positive: true },
                    { label: 'Total Sales', value: mockData.salesBreakdown.totalSales, positive: true, bold: true },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center">
                      <span className={`text-sm ${item.bold ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                        {item.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${item.bold ? 'font-semibold' : 'font-medium'} text-gray-900`}>
                          {item.value === 0 ? '₹0.00' : (
                            item.value < 0 
                              ? `-₹${Math.abs(item.value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : `₹${item.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          )}
                        </span>
                        {item.positive !== null && (
                          <span className="text-xs text-emerald-500">24% <TrendingUp className="h-2.5 w-2.5 inline" /></span>
                        )}
                        {item.positive === null && <span className="text-xs text-gray-400">-</span>}
                  </div>
                  </div>
                  ))}
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
                  {mockData.topAffiliates.map((affiliate, index) => (
                    <AffiliateRow 
                      key={affiliate.name}
                      name={affiliate.name}
                      value={affiliate.value}
                      percentage={affiliate.percentage}
                      barWidth={100 - index * 15}
                    />
                  ))}
                </div>
                  </div>

              {/* Sales by Affiliate Managers */}
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 text-gray-700 font-medium mb-4">
                  <Share2 className="h-4 w-4" />
                  <span>Sales by affiliate managers (Top 5)</span>
                  </div>
                <div className="space-y-1">
                  {mockData.topManagers.map((manager, index) => (
                    <AffiliateRow 
                      key={manager.name}
                      name={manager.name}
                      value={manager.value}
                      percentage={manager.percentage}
                      barWidth={100 - index * 15}
                    />
                  ))}
                </div>
              </div>
          </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
