'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FilterDrawer, FilterOption, FilterValues } from '@/components/ui/FilterDrawer';
import { apiClient } from '@/lib/api-client';
import { Order, OrderFilters, OrderSort, PaginatedResponse } from '@/types';
import { Search, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight, X } from 'lucide-react';

type TabType = 'all' | 'payout_pending' | 'payout_done';

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [orders, setOrders] = useState<Order[]>([]);
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

  // Order details modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

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
        setOrders(response.data.data);
        setPagination(response.data.meta);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]);
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

  const getOrderStatusBadge = (status?: string) => {
    if (!status) return <span className="text-sm text-gray-400">-</span>;

    const styles: Record<string, { bg: string; text: string; label: string }> = {
      delivered: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Delivered' },
      cancelled: { bg: 'bg-orange-50', text: 'text-orange-600', label: 'Cancelled' },
      in_transit: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'In Transit' },
      returned: { bg: 'bg-red-50', text: 'text-red-600', label: 'Returned' },
      processing: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Processing' },
      paid: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Paid' },
      pending: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Pending' },
      refunded: { bg: 'bg-red-50', text: 'text-red-600', label: 'Refunded' },
      partially_refunded: { bg: 'bg-orange-50', text: 'text-orange-600', label: 'Partially Refunded' },
    };
    const style = styles[status] || { bg: 'bg-gray-50', text: 'text-gray-600', label: status };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (status?: string) => {
    if (!status) return <span className="text-sm text-gray-400">-</span>;

    const styles: Record<string, { bg: string; text: string; label: string }> = {
      paid: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Paid' },
      pending: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Pending' },
      refunded: { bg: 'bg-red-50', text: 'text-red-600', label: 'Refunded' },
      partially_refunded: { bg: 'bg-orange-50', text: 'text-orange-600', label: 'Partially Refunded' },
    };
    const style = styles[status] || { bg: 'bg-gray-50', text: 'text-gray-600', label: status };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  const getPayoutStatusBadge = (status?: string, daysLeft?: number) => {
    if (!status) return <span className="text-sm text-gray-400">-</span>;

    const styles: Record<string, { bg: string; text: string; label: string }> = {
      self_referral: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Self referral' },
      cancelled: { bg: 'bg-red-50', text: 'text-red-600', label: 'Cancelled' },
      days_left: { bg: 'bg-blue-50', text: 'text-blue-600', label: `${daysLeft || 7} days left` },
      completed: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Completed' },
      pending: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Pending' },
    };
    const style = styles[status] || { bg: 'bg-gray-50', text: 'text-gray-600', label: status };
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
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'all'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('payout_pending')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'payout_pending'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Payout pending
            </button>
            <button
              onClick={() => setActiveTab('payout_done')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'payout_done'
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
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Affiliate Details</th>
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
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowOrderModal(true);
                      }}
                    >
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-900 font-mono">
                        {order.orderNumber || order.orderId}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-900">
                        {order.attributedCreator?.name || '-'}
                        {order.attributedCreator?.id && (
                          <span className="text-xs text-gray-500 block">{order.attributedCreator?.id}</span>
                        )}
                      </td>
                      <td className="py-4 px-6" onClick={e => e.stopPropagation()}>
                        {getPaymentStatusBadge(order.paymentStatus)}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {order.appliedCoupons?.[0] || order.attributedCouponCode || '-'}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-900">
                        {order.totalAmount ? formatCurrency(order.totalAmount) : '-'}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-900">
                        {order.commissionAmount ? formatCurrency(order.commissionAmount) : '-'}
                      </td>
                      <td className="py-4 px-6">
                        {getPayoutStatusBadge()}
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

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-2 px-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Order Details</h2>
              </div>
              <button
                onClick={() => {
                  setShowOrderModal(false);
                  setSelectedOrder(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Order Information */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Order Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Order Date:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(selectedOrder.createdAt)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Order ID:</span>
                        <span className="text-sm font-medium text-gray-900 font-mono">
                          {selectedOrder.orderId}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Order Number:</span>
                        <span className="text-sm font-medium text-gray-900 font-mono">
                          {selectedOrder.orderNumber || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Payment Status:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {getPaymentStatusBadge(selectedOrder.paymentStatus)}
                        </span>
                      </div>
                      {selectedOrder.pixelEventId && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Pixel Event ID:</span>
                          <span className="text-sm font-medium text-gray-900 font-mono">
                            {selectedOrder.pixelEventId}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Attribution Information */}
                  {(selectedOrder.attributedCreatorId || selectedOrder.attributionType || selectedOrder.referralCode) && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Attribution</h3>
                      <div className="space-y-2">
                        {selectedOrder.attributedCreatorId && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Creator ID:</span>
                            <span className="text-sm font-medium text-gray-900 font-mono">
                              {selectedOrder.attributedCreatorId}
                            </span>
                          </div>
                        )}
                        {selectedOrder.attributionType && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Attribution Type:</span>
                            <span className="text-sm font-medium text-gray-900">
                              {selectedOrder.attributionType}
                            </span>
                          </div>
                        )}
                        {selectedOrder.referralCode && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Referral Code:</span>
                            <span className="text-sm font-medium text-gray-900 font-mono">
                              {selectedOrder.referralCode}
                            </span>
                          </div>
                        )}
                        {selectedOrder.attributedCouponCode && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Coupon Code:</span>
                            <span className="text-sm font-medium text-gray-900 font-mono">
                              {selectedOrder.attributedCouponCode}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Commission Information */}
                  {(selectedOrder.commissionAmount || selectedOrder.commissionRateValue) && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Commission</h3>
                      <div className="space-y-2">
                        {selectedOrder.commissionAmount && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Commission Amount:</span>
                            <span className="text-sm font-medium text-gray-900">
                              {formatCurrency(selectedOrder.commissionAmount)}
                            </span>
                          </div>
                        )}
                        {selectedOrder.commissionRateValue && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Commission Rate:</span>
                            <span className="text-sm font-medium text-gray-900">
                              {selectedOrder.commissionRateValue}
                              {selectedOrder.commissionRateType === 'percentage' ? '%' : ''}
                            </span>
                          </div>
                        )}
                        {selectedOrder.commissionBasis && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Commission Basis:</span>
                            <span className="text-sm font-medium text-gray-900">
                              {selectedOrder.commissionBasis.replace(/_/g, ' ')}
                            </span>
                          </div>
                        )}
                        {selectedOrder.commissionSource && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Commission Source:</span>
                            <span className="text-sm font-medium text-gray-900">
                              {selectedOrder.commissionSource}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Customer Information */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Customer Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Customer ID:</span>
                        <span className="text-sm font-medium text-gray-900 font-mono">
                          {selectedOrder.customerId}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Email:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedOrder.customerEmail}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Payment Details</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Payment Method:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedOrder.paymentMethod || '-'}
                        </span>
                      </div>
                      {selectedOrder.refundedAmount && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Refunded Amount:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(selectedOrder.refundedAmount)}
                          </span>
                        </div>
                      )}
                      {selectedOrder.refundReason && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Refund Reason:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {selectedOrder.refundReason}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Applied Coupons */}
                  {selectedOrder.appliedCoupons && selectedOrder.appliedCoupons.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Applied Coupons</h3>
                      <div className="space-y-1">
                        {selectedOrder.appliedCoupons.map((coupon, idx) => (
                          <div key={idx} className="text-sm font-medium text-gray-900 font-mono">
                            {coupon}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              {selectedOrder.lineItems && selectedOrder.lineItems.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Order Items</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Product</th>
                          <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">Quantity</th>
                          <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedOrder.lineItems.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {item.title || item.productId || `Item ${idx + 1}`}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600 text-right">
                              {item.quantity || '-'}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900 text-right">
                              {item.price ? formatCurrency(item.price) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Subtotal:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(selectedOrder.subtotalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Shipping:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(selectedOrder.shippingAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tax:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(selectedOrder.taxAmount)}
                    </span>
                  </div>
                  {parseFloat(selectedOrder.discountsTotal) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Discounts:</span>
                      <span className="text-sm font-medium text-red-600">
                        -{formatCurrency(selectedOrder.discountsTotal)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-sm font-semibold text-gray-900">Total:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(selectedOrder.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
