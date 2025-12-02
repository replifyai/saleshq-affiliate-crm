'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { apiClient } from '@/lib/api-client';
import { Order, OrderFilters, OrderSort, PaginatedResponse, PaymentStatus } from '@/types';
import { formatDate, formatCurrency, formatDateTime } from '@/lib/utils';
import { Eye, Filter, RefreshCw, ArrowUpDown } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 20 });
  const [filters, setFilters] = useState<OrderFilters>({
    paymentStatus: undefined,
    orderNumber: '',
  });
  const [sort, setSort] = useState<OrderSort>({
    by: 'createdAt',
    direction: 'desc',
  });
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [filters, sort, pagination.currentPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await apiClient.post<{ success: boolean; data: PaginatedResponse<Order> }>('/orders', {
        page: pagination.currentPage,
        pageSize: pagination.itemsPerPage,
        filters: {
          ...(filters.paymentStatus && { paymentStatus: filters.paymentStatus }),
          ...(filters.orderNumber && filters.orderNumber.trim() && { orderNumber: filters.orderNumber.trim() }),
        },
        sort,
      });
      if (response.success && response.data) {
        setOrders(response.data.data);
        setPagination(response.data.meta);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleSort = (field: OrderSort['by']) => {
    setSort({
      by: field,
      direction: sort.by === field && sort.direction === 'asc' ? 'desc' : 'asc',
    });
    setPagination({ ...pagination, currentPage: 1 });
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const variants: Record<PaymentStatus, 'success' | 'default' | 'warning' | 'error'> = {
      paid: 'success',
      pending: 'warning',
      refunded: 'error',
      partially_refunded: 'error',
    };
    return <Badge variant={variants[status]}>{status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}</Badge>;
  };

  const handleFilterChange = (key: keyof OrderFilters, value: any) => {
    setFilters({ ...filters, [key]: value });
    setPagination({ ...pagination, currentPage: 1 });
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Orders</h1>
          <p className="text-muted mt-2">View and manage customer orders</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted" />
              <CardTitle className="text-lg">Filters & Sorting</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Order Number</label>
                <Input
                  placeholder="Search by order number..."
                  value={filters.orderNumber || ''}
                  onChange={(e) => handleFilterChange('orderNumber', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Payment Status</label>
                <Select
                  value={filters.paymentStatus || 'all'}
                  onChange={(e) => handleFilterChange('paymentStatus', e.target.value === 'all' ? undefined : e.target.value)}
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'paid', label: 'Paid' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'refunded', label: 'Refunded' },
                    { value: 'partially_refunded', label: 'Partially Refunded' },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Sort By</label>
                <Select
                  value={sort.by}
                  onChange={(e) => setSort({ ...sort, by: e.target.value as OrderSort['by'], direction: 'desc' })}
                  options={[
                    { value: 'createdAt', label: 'Created Date' },
                    { value: 'totalAmount', label: 'Total Amount' },
                    { value: 'orderNumber', label: 'Order Number' },
                    { value: 'paymentStatus', label: 'Payment Status' },
                  ]}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleSort(sort.by)}
                  className="flex-1"
                  title={`Sort ${sort.direction === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  {sort.direction === 'asc' ? '↑ Asc' : '↓ Desc'}
                </Button>
                <Button onClick={fetchOrders} variant="outline" className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Orders ({pagination?.totalItems || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 text-muted">
                No orders found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Order Number</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Customer Email</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Total Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Payment Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Commission</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Attributed Creator</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Created</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b border-border hover:bg-secondary group">
                        <td className="py-3 px-4 font-mono font-semibold text-foreground">{order.orderNumber}</td>
                        <td className="py-3 px-4 text-foreground">{order.customerEmail}</td>
                        <td className="py-3 px-4 font-semibold text-foreground">
                          {formatCurrency(parseFloat(order.totalAmount || '0'), order.currencyCode)}
                        </td>
                        <td className="py-3 px-4">{getPaymentStatusBadge(order.paymentStatus)}</td>
                        <td className="py-3 px-4 text-foreground">
                          {order.commissionAmount
                            ? formatCurrency(parseFloat(order.commissionAmount || '0'), order.commissionCurrency || order.currencyCode)
                            : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          {order.attributedCreatorId ? (
                            <span className="text-sm text-muted">{order.attributedCreatorId}</span>
                          ) : (
                            <span className="text-sm text-muted">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted text-sm">{formatDateTime(new Date(order.createdAt))}</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(order)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-between items-center mt-6 pt-6 border-t border-border">
                <div className="text-sm text-muted">
                  Showing {pagination ? ((pagination.currentPage - 1) * pagination.itemsPerPage) + 1 : 0} to{' '}
                  {pagination ? Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems) : 0} of{' '}
                  {pagination?.totalItems || 0} orders
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })}
                    disabled={pagination.currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })}
                    disabled={pagination.currentPage === pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Order #{selectedOrder.orderNumber} - Details</CardTitle>
                <Button variant="ghost" onClick={() => setShowModal(false)}>Close</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted">Order Number</label>
                  <p className="text-foreground font-mono">{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted">Order ID</label>
                  <p className="text-foreground font-mono text-sm">{selectedOrder.orderId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted">Customer Email</label>
                  <p className="text-foreground">{selectedOrder.customerEmail}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted">Customer ID</label>
                  <p className="text-foreground font-mono text-sm">{selectedOrder.customerId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted">Payment Status</label>
                  <div className="mt-1">{getPaymentStatusBadge(selectedOrder.paymentStatus)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted">Payment Method</label>
                  <p className="text-foreground">{selectedOrder.paymentMethod || 'N/A'}</p>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="text-lg font-semibold mb-3 text-foreground">Order Amounts</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted">Subtotal</label>
                    <p className="text-foreground font-semibold">
                      {formatCurrency(parseFloat(selectedOrder.subtotalAmount || '0'), selectedOrder.currencyCode)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted">Shipping</label>
                    <p className="text-foreground font-semibold">
                      {formatCurrency(parseFloat(selectedOrder.shippingAmount || '0'), selectedOrder.currencyCode)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted">Tax</label>
                    <p className="text-foreground font-semibold">
                      {formatCurrency(parseFloat(selectedOrder.taxAmount || '0'), selectedOrder.currencyCode)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted">Discounts</label>
                    <p className="font-semibold text-destructive">
                      -{formatCurrency(parseFloat(selectedOrder.discountsTotal || '0'), selectedOrder.currencyCode)}
                    </p>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-border">
                    <label className="text-sm font-medium text-muted">Total</label>
                    <p className="text-foreground text-xl font-bold">
                      {formatCurrency(parseFloat(selectedOrder.totalAmount || '0'), selectedOrder.currencyCode)}
                    </p>
                  </div>
                </div>
              </div>

              {selectedOrder.refundedAmount && (
                <div className="border-t border-border pt-4">
                  <div>
                    <label className="text-sm font-medium text-muted">Refunded Amount</label>
                    <p className="font-semibold text-destructive">
                      {formatCurrency(parseFloat(selectedOrder.refundedAmount || '0'), selectedOrder.currencyCode)}
                    </p>
                  </div>
                  {selectedOrder.refundReason && (
                    <div className="mt-2">
                      <label className="text-sm font-medium text-muted">Refund Reason</label>
                      <p className="text-foreground">{selectedOrder.refundReason}</p>
                    </div>
                  )}
                </div>
              )}

              {selectedOrder.commissionAmount && (
                <div className="border-t border-border pt-4">
                  <h3 className="text-lg font-semibold mb-3 text-foreground">Commission Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted">Commission Amount</label>
                      <p className="text-foreground font-semibold">
                        {formatCurrency(parseFloat(selectedOrder.commissionAmount || '0'), selectedOrder.commissionCurrency || selectedOrder.currencyCode)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted">Commission Rate</label>
                      <p className="text-foreground">
                        {selectedOrder.commissionRateType === 'percentage'
                          ? `${selectedOrder.commissionRateValue || '0'}%`
                          : formatCurrency(parseFloat(selectedOrder.commissionRateValue || '0'), selectedOrder.commissionCurrency || selectedOrder.currencyCode)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted">Basis</label>
                      <p className="text-foreground">{selectedOrder.commissionBasis?.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted">Source</label>
                      <p className="text-foreground capitalize">{selectedOrder.commissionSource}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedOrder.attributedCreatorId && (
                <div className="border-t border-border pt-4">
                  <h3 className="text-lg font-semibold mb-3 text-foreground">Attribution</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted">Creator ID</label>
                      <p className="text-foreground font-mono text-sm">{selectedOrder.attributedCreatorId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted">Type</label>
                      <p className="text-foreground capitalize">{selectedOrder.attributionType}</p>
                    </div>
                    {selectedOrder.attributedCouponCode && (
                      <div>
                        <label className="text-sm font-medium text-muted">Coupon Code</label>
                        <p className="text-foreground font-mono">{selectedOrder.attributedCouponCode}</p>
                      </div>
                    )}
                    {selectedOrder.referralCode && (
                      <div>
                        <label className="text-sm font-medium text-muted">Referral Code</label>
                        <p className="text-foreground font-mono">{selectedOrder.referralCode}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedOrder.appliedCoupons && selectedOrder.appliedCoupons.length > 0 && (
                <div className="border-t border-border pt-4">
                  <label className="text-sm font-medium text-muted">Applied Coupons</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedOrder.appliedCoupons.map((coupon, idx) => (
                      <Badge key={idx} variant="default">{coupon}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedOrder.lineItems && selectedOrder.lineItems.length > 0 && (
                <div className="border-t border-border pt-4">
                  <h3 className="text-lg font-semibold mb-3 text-foreground">Line Items</h3>
                  <div className="space-y-2">
                    {selectedOrder.lineItems.map((item, idx) => (
                      <div key={idx} className="p-3 bg-secondary rounded-md">
                        <p className="font-medium text-foreground">{item.title || `Item ${idx + 1}`}</p>
                        {item.quantity && (
                          <p className="text-sm text-muted">Quantity: {item.quantity}</p>
                        )}
                        {item.price && (
                          <p className="text-sm text-muted">
                            Price: {formatCurrency(parseFloat(String(item.price) || '0'), selectedOrder.currencyCode)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-border pt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted">Created</label>
                  <p className="text-foreground">{formatDateTime(new Date(selectedOrder.createdAt))}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted">Last Updated</label>
                  <p className="text-foreground">{formatDateTime(new Date(selectedOrder.updatedAt))}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
