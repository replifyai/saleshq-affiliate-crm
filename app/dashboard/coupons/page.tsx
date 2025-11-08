'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { apiClient } from '@/lib/api-client';
import { Coupon, CouponFilters, PaginatedResponse, CouponType, Creator, CommissionData, CommissionBasis } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Plus, Eye, Check, X, Copy, Filter, RefreshCw } from 'lucide-react';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CouponFilters>({
    active: undefined,
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [showModal, setShowModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [couponToActivate, setCouponToActivate] = useState<Coupon | null>(null);
  const [activatingCoupon, setActivatingCoupon] = useState(false);
  const [commissionData, setCommissionData] = useState<CommissionData>({
    commissionType: 'percentage',
    commissionValue: 0,
    commissionBasis: 'subtotal_after_discounts',
  });
  const [newCoupon, setNewCoupon] = useState({
    creatorId: '',
    type: 'percentage' as CouponType,
    value: 10,
    title: '',
    description: '',
    usageLimit: undefined as number | undefined,
    minimumSpend: undefined as number | undefined,
  });

  useEffect(() => {
    fetchCoupons();
    fetchCreators();
  }, [filters]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ success: boolean; data: Coupon[] }>('/coupons', {
        params: {
          ...(filters.creatorId && filters.creatorId !== 'all' && { creatorId: filters.creatorId }),
          ...(filters.active !== undefined && { active: filters.active.toString() }),
          ...(filters.search && { search: filters.search }),
        },
      });
      if (response.success && response.data) {
        setCoupons(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCreators = async () => {
    try {
      const response = await apiClient.get<{ success: boolean; data: PaginatedResponse<Creator> }>('/creators', {
        params: { limit: 1000, status: 'approved' },
      });
      if (response.success && response.data) {
        setCreators(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch creators:', error);
    }
  };

  const handleAssignToCreator = (coupon: Coupon) => {
    // Pre-fill form with existing coupon data
    setNewCoupon({
      creatorId: '', // Leave empty for user to select
      type: coupon.type,
      value: coupon.value,
      title: coupon.title || '',
      description: coupon.description || '',
      usageLimit: coupon.usageLimit,
      minimumSpend: coupon.minimumSpend,
    });
    setIsAssigning(true);
    setShowCreateModal(true);
  };

  const handleCreateCoupon = async () => {
    try {
      await apiClient.post('/coupons', newCoupon);
      setShowCreateModal(false);
      setIsAssigning(false);
      setNewCoupon({
        creatorId: '',
        type: 'percentage',
        value: 10,
        title: '',
        description: '',
        usageLimit: undefined,
        minimumSpend: undefined,
      });
      fetchCoupons();
      alert(isAssigning ? 'Coupon assigned to creator successfully' : 'Coupon created successfully');
    } catch (error) {
      alert(isAssigning ? 'Failed to assign coupon' : 'Failed to create coupon');
    }
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setIsAssigning(false);
    setNewCoupon({
      creatorId: '',
      type: 'percentage',
      value: 10,
      title: '',
      description: '',
      usageLimit: undefined,
      minimumSpend: undefined,
    });
  };

  const handleViewDetails = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setShowModal(true);
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    // If activating (coupon is currently inactive), show commission modal
    if (!coupon.active) {
      setCouponToActivate(coupon);
      setCommissionData({
        commissionType: 'percentage',
        commissionValue: '' as any,
        commissionBasis: 'subtotal_after_discounts',
      });
      setShowCommissionModal(true);
      return;
    }

    // If deactivating, proceed directly
    try {
      const response = await apiClient.put<{ success: boolean; data: { id: string; active: boolean } }>(
        `/coupons/${coupon.id}/status`,
        { status: 'INACTIVE' }
      );

      if (response.success) {
        const updatedCoupon = { ...coupon, active: response.data.active };
        // Update the coupon in the local state
        setCoupons((prevCoupons) =>
          prevCoupons.map((c) =>
            c.id === coupon.id ? updatedCoupon : c
          )
        );
        // Update selected coupon if it's the one being modified
        if (selectedCoupon && selectedCoupon.id === coupon.id) {
          setSelectedCoupon(updatedCoupon);
        }
        alert('Coupon deactivated successfully');
      }
    } catch (error) {
      console.error('Failed to change coupon status:', error);
      alert('Failed to change coupon status');
    }
  };

  const handleActivateCoupon = async () => {
    if (!couponToActivate) return;

    // Validate commission data
    const commissionValue = typeof commissionData.commissionValue === 'string' 
      ? parseFloat(commissionData.commissionValue) 
      : commissionData.commissionValue;
      
    if (!commissionValue || commissionValue <= 0) {
      alert('Commission value must be greater than 0');
      return;
    }

    try {
      setActivatingCoupon(true);
      const response = await apiClient.put<{ success: boolean; data: { id: string; active: boolean } }>(
        `/coupons/${couponToActivate.id}/status`,
        { 
          status: 'ACTIVE',
          commissionData: {
            ...commissionData,
            commissionValue
          }
        }
      );

      if (response.success) {
        const updatedCoupon = { ...couponToActivate, active: response.data.active };
        // Update the coupon in the local state
        setCoupons((prevCoupons) =>
          prevCoupons.map((c) =>
            c.id === couponToActivate.id ? updatedCoupon : c
          )
        );
        // Update selected coupon if it's the one being modified
        if (selectedCoupon && selectedCoupon.id === couponToActivate.id) {
          setSelectedCoupon(updatedCoupon);
        }
        alert('Coupon activated successfully with commission settings');
        setShowCommissionModal(false);
        setCouponToActivate(null);
      }
    } catch (error: any) {
      console.error('Failed to activate coupon:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to activate coupon';
      alert(`Error: ${errorMessage}`);
    } finally {
      setActivatingCoupon(false);
    }
  };

  const handleCloseCommissionModal = () => {
    setShowCommissionModal(false);
    setCouponToActivate(null);
    setActivatingCoupon(false);
    setCommissionData({
      commissionType: 'percentage',
      commissionValue: '' as any,
      commissionBasis: 'subtotal_after_discounts',
    });
  };

  const getTypeLabel = (type: CouponType) => {
    switch (type) {
      case 'percentage':
        return 'Percentage';
      case 'fixed_amount':
        return 'Fixed Amount';
      case 'free_shipping':
        return 'Free Shipping';
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Coupons</h1>
            <p className="text-gray-600 dark:text-slate-400 mt-2">Manage coupons and assign to creators</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Coupon
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600 dark:text-slate-400" />
              <CardTitle className="text-lg">Filters</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Search</label>
                <Input
                  placeholder="Search by code..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Select
                label="Creator"
                value={filters.creatorId || 'all'}
                onChange={(e) => setFilters({ ...filters, creatorId: e.target.value === 'all' ? undefined : e.target.value })}
                options={[
                  { value: 'all', label: 'All Creators' },
                  ...creators.map((c) => ({ value: c.id, label: c.name })),
                ]}
                />
              </div>
              <div className="space-y-2">
                <Select
                  label="Status"
                value={filters.active === undefined ? 'all' : filters.active.toString()}
                onChange={(e) => setFilters({ ...filters, active: e.target.value === 'all' ? undefined : e.target.value === 'true' })}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'true', label: 'Active' },
                  { value: 'false', label: 'Inactive' },
                ]}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={fetchCoupons} className="w-full" variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coupons Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Coupons ({coupons.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500"></div>
              </div>
            ) : coupons.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                No coupons found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-800">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-slate-300">Code</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-slate-300">Creator</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-slate-300">Discount</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-slate-300">Discount Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-slate-300">Usage</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-slate-300">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-slate-300">Created</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((coupon) => (
                      <tr key={coupon.id} className="border-b border-gray-100 hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-800/50 group">
                        <td className="py-3 px-4 font-mono font-semibold dark:text-slate-200 group-hover:text-gray-900 dark:group-hover:text-white">{coupon.code}</td>
                        <td className="py-3 px-4 dark:text-slate-200 group-hover:text-gray-900 dark:group-hover:text-white">{coupon.creatorName}</td>
                        <td className="py-3 px-4 dark:text-slate-200 group-hover:text-gray-900 dark:group-hover:text-white">
                          {coupon.type === 'percentage'
                            ? `${coupon.value}%`
                            : coupon.type === 'fixed_amount'
                            ? formatCurrency(coupon.value, coupon.currencyCode)
                            : 'FREE'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="default">{getTypeLabel(coupon.type)}</Badge>
                        </td>
                        <td className="py-3 px-4 dark:text-slate-200 group-hover:text-gray-900 dark:group-hover:text-white">
                          {coupon.usageLimit
                            ? `${coupon.usageCount}/${coupon.usageLimit}`
                            : coupon.usageCount}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {coupon.active ? (
                              <Badge variant="success">Active</Badge>
                            ) : (
                              <Badge variant="default">Inactive</Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(coupon)}
                              title={coupon.active ? 'Deactivate Coupon' : 'Activate Coupon'}
                              className="ml-2"
                            >
                              {coupon.active ? (
                                <X className="h-4 w-4 text-red-600" />
                              ) : (
                                <Check className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white">{formatDate(coupon.createdAt)}</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAssignToCreator(coupon)}
                              title="Assign to Creator"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(coupon)}
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

          </CardContent>
        </Card>
      </div>

      {/* Create Coupon Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{isAssigning ? 'Assign Coupon to Creator' : 'Create New Coupon'}</CardTitle>
                <Button variant="ghost" onClick={handleCloseCreateModal}>Close</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isAssigning && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm">
                  Select a creator to assign this coupon configuration to. The form is pre-filled with the existing coupon details.
                </div>
              )}
              <Select
                label="Creator"
                value={newCoupon.creatorId}
                onChange={(e) => setNewCoupon({ ...newCoupon, creatorId: e.target.value })}
                options={[
                  { value: '', label: 'Select a creator' },
                  ...creators.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
              <Select
                label="Coupon Type"
                value={newCoupon.type}
                onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value as CouponType })}
                options={[
                  { value: 'percentage', label: 'Percentage OFF' },
                  { value: 'fixed_amount', label: 'Fixed Amount OFF' },
                  { value: 'free_shipping', label: 'Free Shipping' },
                ]}
              />
              <Input
                label="Discount Value"
                type="number"
                value={newCoupon.value}
                onChange={(e) => setNewCoupon({ ...newCoupon, value: parseFloat(e.target.value) || 0 })}
              />
              <Input
                label="Title (optional)"
                value={newCoupon.title}
                onChange={(e) => setNewCoupon({ ...newCoupon, title: e.target.value })}
              />
              <Input
                label="Description (optional)"
                value={newCoupon.description}
                onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
              />
              <Input
                label="Usage Limit (optional)"
                type="number"
                value={newCoupon.usageLimit || ''}
                onChange={(e) => setNewCoupon({ ...newCoupon, usageLimit: e.target.value ? parseInt(e.target.value) : undefined })}
              />
              <Input
                label="Minimum Spend (optional)"
                type="number"
                value={newCoupon.minimumSpend || ''}
                onChange={(e) => setNewCoupon({ ...newCoupon, minimumSpend: e.target.value ? parseFloat(e.target.value) : undefined })}
              />
              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateCoupon} className="flex-1">
                  {isAssigning ? 'Assign to Creator' : 'Create Coupon'}
                </Button>
                <Button variant="outline" onClick={handleCloseCreateModal}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Details Modal */}
      {showModal && selectedCoupon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{selectedCoupon.code} - Details</CardTitle>
                <Button variant="ghost" onClick={() => setShowModal(false)}>Close</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Creator</label>
                <p className="text-gray-900">{selectedCoupon.creatorName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Discount</label>
                <p className="text-gray-900">
                  {selectedCoupon.type === 'percentage'
                    ? `${selectedCoupon.value}% ${getTypeLabel(selectedCoupon.type)}`
                    : selectedCoupon.type === 'fixed_amount'
                    ? `${formatCurrency(selectedCoupon.value, selectedCoupon.currencyCode)} ${getTypeLabel(selectedCoupon.type)}`
                    : getTypeLabel(selectedCoupon.type)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Usage</label>
                <p className="text-gray-900">
                  {selectedCoupon.usageLimit
                    ? `${selectedCoupon.usageCount}/${selectedCoupon.usageLimit} uses`
                    : `${selectedCoupon.usageCount} uses`}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1 flex items-center gap-2">
                  {selectedCoupon.active ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="default">Inactive</Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(selectedCoupon)}
                  >
                    {selectedCoupon.active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
              {selectedCoupon.title && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Title</label>
                  <p className="text-gray-900">{selectedCoupon.title}</p>
                </div>
              )}
              {selectedCoupon.description && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <p className="text-gray-900">{selectedCoupon.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Created</label>
                  <p className="text-gray-900">{formatDate(selectedCoupon.createdAt)}</p>
                </div>
                {selectedCoupon.validFrom && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Valid From</label>
                    <p className="text-gray-900">{formatDate(selectedCoupon.validFrom)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Commission Modal */}
      {showCommissionModal && couponToActivate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Set Commission for {couponToActivate.code}</CardTitle>
                <Button variant="ghost" onClick={handleCloseCommissionModal}>Close</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-3 rounded-md text-sm">
                Please set the commission details for this coupon. This will determine how much the creator earns when their coupon is used.
              </div>
              
              <Select
                label="Commission Type"
                value={commissionData.commissionType}
                onChange={(e) => setCommissionData({ ...commissionData, commissionType: e.target.value as 'fixed' | 'percentage' })}
                options={[
                  { value: 'percentage', label: 'Percentage (%)' },
                  { value: 'fixed', label: 'Fixed Amount' },
                ]}
                disabled={activatingCoupon}
              />

              <Input
                label="Commission Value"
                type="number"
                min="0"
                step={commissionData.commissionType === 'percentage' ? '0.01' : '1'}
                value={commissionData.commissionValue}
                onChange={(e) => setCommissionData({ ...commissionData, commissionValue: e.target.value as any })}
                placeholder={commissionData.commissionType === 'percentage' ? 'e.g., 10 for 10%' : 'e.g., 100'}
                disabled={activatingCoupon}
              />

              <Select
                label="Commission Basis"
                value={commissionData.commissionBasis}
                onChange={(e) => setCommissionData({ ...commissionData, commissionBasis: e.target.value as CommissionBasis })}
                options={[
                  { value: 'subtotal_after_discounts', label: 'Subtotal After Discounts' },
                  { value: 'subtotal', label: 'Subtotal (Before Discounts)' },
                  { value: 'total', label: 'Total (Including Tax & Shipping)' },
                ]}
                disabled={activatingCoupon}
              />

              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-4 py-3 rounded-md text-sm">
                <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">Commission Preview:</p>
                <p className="text-gray-600 dark:text-gray-400">
                  {commissionData.commissionValue ? (
                    commissionData.commissionType === 'percentage' 
                      ? `${commissionData.commissionValue}% of ${commissionData.commissionBasis.replace(/_/g, ' ')}`
                      : `${formatCurrency(typeof commissionData.commissionValue === 'string' ? parseFloat(commissionData.commissionValue) : commissionData.commissionValue)} per order based on ${commissionData.commissionBasis.replace(/_/g, ' ')}`
                  ) : (
                    'Enter a commission value to see preview'
                  )}
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleActivateCoupon} 
                  className="flex-1"
                  disabled={activatingCoupon}
                >
                  {activatingCoupon ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Activating...
                    </>
                  ) : (
                    'Activate Coupon'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCloseCommissionModal}
                  disabled={activatingCoupon}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}

