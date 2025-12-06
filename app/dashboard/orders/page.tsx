'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FilterDrawer, FilterOption, FilterValues } from '@/components/ui/FilterDrawer';
import { apiClient } from '@/lib/api-client';
import { Order, OrderFilters, OrderSort, PaginatedResponse } from '@/types';
import { Search, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

// Extended order type for UI display
type OrderStatus = 'delivered' | 'cancelled' | 'in_transit' | 'returned' | 'processing';
type PayoutStatus = 'self_referral' | 'cancelled' | 'days_left' | 'completed' | 'pending';

interface ExtendedOrder extends Order {
  orderStatus?: OrderStatus;
  customerName?: string;
  discountCode?: string;
  reward?: number;
  payoutStatus?: PayoutStatus;
  payoutDaysLeft?: number;
}

// Mock data to extend API orders
const extendOrder = (order: Order, index: number): ExtendedOrder => {
  const statuses: OrderStatus[] = ['delivered', 'cancelled', 'delivered', 'delivered', 'delivered', 'delivered', 'delivered', 'in_transit', 'in_transit', 'returned', 'in_transit', 'in_transit'];
  const payoutStatuses: PayoutStatus[] = ['self_referral', 'cancelled', 'days_left', 'completed', 'completed', 'completed', 'completed', 'days_left', 'days_left', 'cancelled', 'days_left', 'days_left'];
  
  return {
    ...order,
    orderStatus: statuses[index % statuses.length],
    customerName: 'Aromal Sula',
    discountCode: 'SUJAL',
    reward: 2454.90,
    payoutStatus: payoutStatuses[index % payoutStatuses.length],
    payoutDaysLeft: 7,
  };
};

type TabType = 'all' | 'payout_pending' | 'payout_done';

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [orders, setOrders] = useState<ExtendedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 5, totalItems: 100, itemsPerPage: 20 });
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  const [sort, setSort] = useState<OrderSort>({
    by: 'createdAt',
    direction: 'desc',
  });

  // Filter drawer state
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [filterValues, setFilterValues] = useState<FilterValues>({
    orderStatus: [],
    payoutStatus: [],
    dateRange: { from: '', to: '' },
    amountRange: { min: 0, max: 50000 },
    affiliate: '',
  });

  // Filter options for orders
  const orderFilters: FilterOption[] = [
    {
      id: 'orderStatus',
      label: 'Order Status',
      type: 'multiselect',
      options: [
        { value: 'Paid', label: 'Paid' },
        { value: 'Partially Paid', label: 'Partially Paid' },
        { value: 'Processing', label: 'Processing' },
        { value: 'Fulfilled', label: 'Fulfilled' },
        { value: 'Unfulfilled', label: 'Unfulfilled' },
        { value: 'Cancelled', label: 'Cancelled' },
        { value: 'Refunded', label: 'Refunded' },
      ],
    },
    {
      id: 'payoutStatus',
      label: 'Payout Status',
      type: 'multiselect',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'issued', label: 'Issued' },
        { value: 'processed', label: 'Processed' },
      ],
    },
    {
      id: 'dateRange',
      label: 'Order Date',
      type: 'daterange',
    },
    {
      id: 'amountRange',
      label: 'Order Amount (₹)',
      type: 'range',
      min: 0,
      max: 50000,
    },
    {
      id: 'affiliate',
      label: 'Affiliate',
      type: 'text',
      placeholder: 'Search by affiliate name',
    },
  ];

  const handleApplyFilters = (values: FilterValues) => {
    setFilterValues(values);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    console.log('Applied filters:', values);
  };

  const handleResetFilters = () => {
    setFilterValues({
      orderStatus: [],
      payoutStatus: [],
      dateRange: { from: '', to: '' },
      amountRange: { min: 0, max: 50000 },
      affiliate: '',
    });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchOrders();
  }, [debouncedSearch, sort, pagination.currentPage, activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await apiClient.post<{ success: boolean; data: PaginatedResponse<Order> }>('/orders', {
        page: pagination.currentPage,
        pageSize: pagination.itemsPerPage,
        filters: {
          ...(debouncedSearch && { orderNumber: debouncedSearch }),
        },
        sort,
      });
      
      if (response.success && response.data) {
        // Extend orders with mock data for UI display
        const extendedOrders = response.data.data.map((order, index) => extendOrder(order, index));
        
        // Filter based on tab
        let filteredOrders = extendedOrders;
        if (activeTab === 'payout_pending') {
          filteredOrders = extendedOrders.filter(o => o.payoutStatus === 'days_left' || o.payoutStatus === 'pending');
        } else if (activeTab === 'payout_done') {
          filteredOrders = extendedOrders.filter(o => o.payoutStatus === 'completed');
        }
        
        setOrders(filteredOrders);
        setPagination(response.data.meta);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      // Use mock data if API fails
      const mockOrders: ExtendedOrder[] = Array.from({ length: 12 }, (_, i) => ({
        id: `order-${i}`,
        orderId: `order-${i}`,
        orderNumber: `MF123456789012`,
        customerId: `customer-${i}`,
        customerEmail: 'aromal@gmail.com',
        currencyCode: 'INR',
        subtotalAmount: '32398.20',
        shippingAmount: '0',
        taxAmount: '0',
        totalAmount: '32398.20',
        discountsTotal: '0',
        lineItems: [],
        appliedCoupons: ['SUJAL'],
        paymentStatus: 'paid',
        createdAt: Date.now() - (i * 86400000),
        updatedAt: Date.now(),
        orderStatus: ['delivered', 'cancelled', 'delivered', 'delivered', 'delivered', 'delivered', 'delivered', 'in_transit', 'in_transit', 'returned', 'in_transit', 'in_transit'][i % 12] as OrderStatus,
        customerName: 'Aromal Sula',
        discountCode: 'SUJAL',
        reward: 2454.90,
        payoutStatus: ['self_referral', 'cancelled', 'days_left', 'completed', 'completed', 'completed', 'completed', 'days_left', 'days_left', 'cancelled', 'days_left', 'days_left'][i % 12] as PayoutStatus,
        payoutDaysLeft: 7,
      }));
      setOrders(mockOrders);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getOrderStatusBadge = (status: OrderStatus) => {
    const styles: Record<OrderStatus, { bg: string; text: string; label: string }> = {
      delivered: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Delivered' },
      cancelled: { bg: 'bg-orange-50', text: 'text-orange-600', label: 'Cancelled' },
      in_transit: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'In Transit' },
      returned: { bg: 'bg-red-50', text: 'text-red-600', label: 'Returned' },
      processing: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Processing' },
    };
    const style = styles[status];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  const getPayoutStatusBadge = (status: PayoutStatus, daysLeft?: number) => {
    const styles: Record<PayoutStatus, { bg: string; text: string; label: string }> = {
      self_referral: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Self referral' },
      cancelled: { bg: 'bg-red-50', text: 'text-red-600', label: 'Cancelled' },
      days_left: { bg: 'bg-blue-50', text: 'text-blue-600', label: `${daysLeft || 7} days left` },
      completed: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Completed' },
      pending: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Pending' },
    };
    const style = styles[status];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
          <span className="text-sm text-gray-500">
            Last refreshed: {mounted ? getCurrentTime() : '11:56 AM'}
          </span>
        </div>

        {/* Tabs and Search Row */}
        <div className="flex items-center justify-between mb-6">
          {/* Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'all'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('payout_pending')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'payout_pending'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Payout pending
            </button>
            <button
              onClick={() => setActiveTab('payout_done')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'payout_done'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Payout done
            </button>
          </div>

          {/* Search and Actions */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search for an Order"
                className="pl-10 pr-4 py-2 w-64 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>
            <button 
              onClick={() => setShowFilterDrawer(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
            <button 
              onClick={() => setSort({ ...sort, direction: sort.direction === 'asc' ? 'desc' : 'asc' })}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <ArrowUpDown className="h-4 w-4" />
              Sort By
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-[#EAC312]"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Order Date</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Order ID</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Customer</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Order Status</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Discount</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Total Amount</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Reward</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Payout Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order, index) => (
                    <tr 
                      key={order.id || index} 
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-900 font-mono">
                        {order.orderNumber || 'MF123456789012'}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-900">
                        {order.customerName || 'Aromal Sula'}
                      </td>
                      <td className="py-4 px-6">
                        {getOrderStatusBadge(order.orderStatus || 'delivered')}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {order.discountCode || order.appliedCoupons?.[0] || 'SUJAL'}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-900">
                        {formatCurrency(order.reward || 2454.90)}
                      </td>
                      <td className="py-4 px-6">
                        {getPayoutStatusBadge(order.payoutStatus || 'completed', order.payoutDaysLeft)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {/* Pagination */}
            <div className="flex items-center justify-end gap-2 py-4 px-6 border-t border-gray-100">
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
                disabled={pagination.currentPage === 1}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.currentPage}/{pagination.totalPages || 5}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                disabled={pagination.currentPage === pagination.totalPages}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={showFilterDrawer}
        onClose={() => setShowFilterDrawer(false)}
        title="Filter Orders"
        filters={orderFilters}
        values={filterValues}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />
    </DashboardLayout>
  );
}
