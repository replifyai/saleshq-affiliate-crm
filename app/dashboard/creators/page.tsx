'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FilterDrawer, FilterOption, FilterValues } from '@/components/ui/FilterDrawer';
import { apiClient } from '@/lib/api-client';
import { Creator, CreatorsResponse, CreatorStatus, CommissionData, CommissionBasis, ExtendedAffiliate, AffiliateManager, InviteAffiliateData, AcceptAffiliateData, NewManagerData } from '@/types';
import { Search, ChevronLeft, ChevronRight, X, Instagram, SlidersHorizontal, UserPlus } from 'lucide-react';

// Mock data for affiliate managers
const mockManagers: AffiliateManager[] = [
  { id: '1', name: 'Abdal', email: 'abdal@myfrido.com', phone: '+91 9876543210', totalAffiliates: 25, totalSales: 3975471, createdAt: Date.now() },
  { id: '2', name: 'Gautami Chati', email: 'gautami@myfrido.com', phone: '+91 9876543211', totalAffiliates: 18, totalSales: 2875471, createdAt: Date.now() },
  { id: '3', name: 'Parag Swami', email: 'parag@myfrido.com', phone: '+91 9876543212', totalAffiliates: 15, totalSales: 1975471, createdAt: Date.now() },
];

// Extended mock data for affiliates
const extendAffiliate = (creator: Creator, index: number): ExtendedAffiliate => ({
  ...creator,
  managedBy: 'manager-1',
  managerName: 'Abdal',
  discountCode: 'SUJAL',
  discountPercent: 10,
  reward: 10,
  totalSales: [8744, 1004, 0, 11345.12, 14004.40, 113112.50, 30045, 0, 0, 1233.81, 2500, 0][index % 12],
  totalOrders: Math.floor(Math.random() * 100),
  totalCommission: Math.floor(Math.random() * 10000),
});

type TabType = 'current' | 'pending' | 'managers';

export default function AffiliatesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('current');
  const [affiliates, setAffiliates] = useState<ExtendedAffiliate[]>([]);
  const [pendingAffiliates, setPendingAffiliates] = useState<ExtendedAffiliate[]>([]);
  const [managers, setManagers] = useState<AffiliateManager[]>(mockManagers);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<CreatorsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  
  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<ExtendedAffiliate | null>(null);
  const [processingAction, setProcessingAction] = useState(false);
  
  // Form states
  const [inviteData, setInviteData] = useState<InviteAffiliateData>({
    name: '',
    phoneNumber: '',
    email: '',
    discountPercent: 10,
    discountType: 'percentage',
    commissionPercent: 10,
    commissionType: 'percentage',
    minOrderValue: 500,
    discountCode: '',
    invitedBy: 'Abdal',
  });
  
  const [acceptData, setAcceptData] = useState<AcceptAffiliateData>({
    discountPercent: 10,
    discountType: 'percentage',
    commissionPercent: 10,
    commissionType: 'percentage',
    minOrderValue: undefined,
    discountCode: '',
    managerId: '',
  });

  // Add Manager Modal state
  const [showAddManagerModal, setShowAddManagerModal] = useState(false);
  const [newManagerData, setNewManagerData] = useState<NewManagerData>({
    name: '',
    email: '',
    phone: '',
  });

  // Filter drawer state
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [filterValues, setFilterValues] = useState<FilterValues>({
    manager: '',
    status: '',
    dateRange: { from: '', to: '' },
    salesRange: { min: 0, max: 500000 },
  });

  // Filter options for affiliates
  const affiliateFilters: FilterOption[] = [
    {
      id: 'manager',
      label: 'Managed By',
      type: 'select',
      placeholder: 'All Managers',
      options: [
        { value: 'mgr_001', label: 'Abdal' },
        { value: 'mgr_002', label: 'Gautami Chati' },
        { value: 'mgr_003', label: 'Parag Swami' },
      ],
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      placeholder: 'All Status',
      options: [
        { value: 'approved', label: 'Approved' },
        { value: 'pending', label: 'Pending' },
        { value: 'rejected', label: 'Rejected' },
      ],
    },
    {
      id: 'dateRange',
      label: 'Joined Date',
      type: 'daterange',
    },
    {
      id: 'salesRange',
      label: 'Total Sales (₹)',
      type: 'range',
      min: 0,
      max: 500000,
    },
  ];

  const handleApplyFilters = (values: FilterValues) => {
    setFilterValues(values);
    setPage(1);
    // Apply filters to API call
    console.log('Applied filters:', values);
  };

  const handleResetFilters = () => {
    setFilterValues({
      manager: '',
      status: '',
      dateRange: { from: '', to: '' },
      salesRange: { min: 0, max: 500000 },
    });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchAffiliates();
  }, [page, debouncedSearch, activeTab]);

  const fetchAffiliates = async () => {
    try {
      setLoading(true);
      
      // Fetch approved affiliates for "Current Affiliates" tab
      const approvedResponse = await apiClient.post<{ success: boolean; data: CreatorsResponse }>('/creators', {
        page,
        pageSize,
        filters: {
          approved: 'approved',
          ...(debouncedSearch && { search: debouncedSearch }),
        },
        sort: { by: 'createdAt', direction: 'desc' },
      });
      
      if (approvedResponse.success && approvedResponse.data) {
        setAffiliates(approvedResponse.data.items.map((c, i) => extendAffiliate(c, i)));
        setPagination(approvedResponse.data);
      }
      
      // Fetch pending affiliates
      const pendingResponse = await apiClient.post<{ success: boolean; data: CreatorsResponse }>('/creators', {
        page: 1,
        pageSize: 100,
        filters: { approved: 'pending' },
        sort: { by: 'createdAt', direction: 'desc' },
      });
      
      if (pendingResponse.success && pendingResponse.data) {
        // Also include rejected for the pending tab
        const rejectedResponse = await apiClient.post<{ success: boolean; data: CreatorsResponse }>('/creators', {
          page: 1,
          pageSize: 100,
          filters: { approved: 'rejected' },
          sort: { by: 'createdAt', direction: 'desc' },
        });
        
        const pendingItems = pendingResponse.data.items.map((c, i) => extendAffiliate(c, i));
        const rejectedItems = rejectedResponse.success && rejectedResponse.data 
          ? rejectedResponse.data.items.map((c, i) => extendAffiliate(c, i))
          : [];
        
        setPendingAffiliates([...pendingItems, ...rejectedItems]);
      }
    } catch (error) {
      console.error('Failed to fetch affiliates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = (affiliate: ExtendedAffiliate) => {
    setSelectedAffiliate(affiliate);
    setAcceptData({
      discountPercent: 10,
      discountType: 'percentage',
      commissionPercent: 10,
      commissionType: 'percentage',
      minOrderValue: undefined,
      discountCode: affiliate.name.toUpperCase().replace(/\s+/g, ''),
    });
    setShowAcceptModal(true);
  };

  const handleAcceptSubmit = async () => {
    if (!selectedAffiliate) return;
    
    try {
      setProcessingAction(true);
      const response = await apiClient.put<{ success: boolean; message: string }>(
        `/creators/${selectedAffiliate.id}/approve`,
        {
          commissionData: {
            commissionType: acceptData.commissionType,
            commissionValue: acceptData.commissionPercent,
            commissionBasis: 'subtotal_after_discounts' as CommissionBasis,
          }
        }
      );
      
      if (response.success) {
        await fetchAffiliates();
        setShowAcceptModal(false);
        setSelectedAffiliate(null);
      }
    } catch (error) {
      console.error('Failed to accept affiliate:', error);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleReject = async (affiliateId: string) => {
    if (!confirm('Are you sure you want to reject this affiliate?')) return;
    
    try {
      setProcessingAction(true);
      const response = await apiClient.put<{ success: boolean; message: string }>(
        `/creators/${affiliateId}/reject`
      );
      
      if (response.success) {
        await fetchAffiliates();
      }
    } catch (error) {
      console.error('Failed to reject affiliate:', error);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRevert = async (affiliate: ExtendedAffiliate) => {
    // Revert rejected to pending by approving
    handleAccept(affiliate);
  };

  const handleInviteSubmit = async () => {
    try {
      setProcessingAction(true);
      // API call would go here
      console.log('Invite data:', inviteData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowInviteModal(false);
      setInviteData({
        name: '',
        phoneNumber: '',
        email: '',
        discountPercent: 10,
        discountType: 'percentage',
        commissionPercent: 10,
        commissionType: 'percentage',
        minOrderValue: 500,
        discountCode: '',
        invitedBy: 'Abdal',
      });
      await fetchAffiliates();
    } catch (error) {
      console.error('Failed to invite affiliate:', error);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleViewAffiliate = (affiliate: ExtendedAffiliate) => {
    router.push(`/dashboard/creators/${affiliate.id}`);
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Affiliates</h1>
          <span className="text-sm text-gray-500">
            Last refreshed: {mounted ? getCurrentTime() : '11:56 AM'}
          </span>
        </div>

        {/* Tabs and Search Row */}
        <div className="flex items-center justify-between mb-6">
          {/* Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('current')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'current'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Current Affiliates
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'pending'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveTab('managers')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'managers'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Affiliate Managers
            </button>
            </div>

          {/* Search and Actions */}
          <div className="flex items-center gap-3">
            {activeTab !== 'managers' && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search for an Affiliate"
                  className="pl-10 pr-4 py-2 w-64 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>
            )}
            {activeTab === 'current' && (
              <>
                <button 
                  onClick={() => setShowFilterDrawer(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </button>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                >
                  Invite New Affiliate
                </button>
              </>
            )}
            {activeTab === 'pending' && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
              >
                Invite New Affiliate
              </button>
            )}
            {activeTab === 'managers' && (
              <button
                onClick={() => setShowAddManagerModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800"
              >
                <UserPlus className="h-4 w-4" />
                Add Manager
              </button>
            )}
              </div>
            </div>

        {/* Content */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-[#EAC312]"></div>
              </div>
            ) : (
          <>
            {/* Current Affiliates Tab */}
            {activeTab === 'current' && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Name</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Social</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Managed By</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Discount Code</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Discount %</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Reward</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Total Sales</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {affiliates.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-gray-500">
                          No affiliates found
                        </td>
                      </tr>
                    ) : (
                      affiliates.map((affiliate) => (
                        <tr 
                          key={affiliate.id} 
                          className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer group"
                          onClick={() => handleViewAffiliate(affiliate)}
                        >
                          <td className="py-4 px-6 text-sm text-gray-900">{affiliate.name}</td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-1">
                              {affiliate.socialMediaHandles?.some(s => s.platform.toLowerCase() === 'instagram') && (
                                <div className="w-6 h-6 rounded border border-blue-200 flex items-center justify-center">
                                  <Instagram className="h-3.5 w-3.5 text-blue-500" />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600">{affiliate.managerName || 'Abdal'}</td>
                          <td className="py-4 px-6 text-sm text-gray-900">{affiliate.discountCode || 'SUJAL'}</td>
                          <td className="py-4 px-6 text-sm text-gray-600">{affiliate.discountPercent || 10}%</td>
                          <td className="py-4 px-6 text-sm text-gray-600">{affiliate.reward || 10}%</td>
                          <td className="py-4 px-6 text-sm text-gray-900">{formatCurrency(affiliate.totalSales || 0)}</td>
                          <td className="py-4 px-6 text-sm">
                            <span className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                              view →
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                
                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-end gap-2 py-4 px-6 border-t border-gray-100">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={!pagination.hasPrevPage}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {pagination.page}/{pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={!pagination.hasNextPage}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Pending Tab */}
            {activeTab === 'pending' && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Name</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Email</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Phone</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Socials</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Applied On</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingAffiliates.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-500">
                          No pending affiliates
                        </td>
                      </tr>
                    ) : (
                      pendingAffiliates.map((affiliate) => (
                        <tr key={affiliate.id} className="border-b border-gray-50 hover:bg-gray-50 group">
                          <td className="py-4 px-6 text-sm text-gray-900">{affiliate.name}</td>
                          <td className="py-4 px-6 text-sm text-gray-600">{affiliate.email}</td>
                          <td className="py-4 px-6 text-sm text-gray-600">{affiliate.phoneNumber}</td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-1">
                              {affiliate.socialMediaHandles?.some(s => s.platform.toLowerCase() === 'instagram') && (
                                <div className="w-6 h-6 rounded border border-blue-200 flex items-center justify-center">
                                  <Instagram className="h-3.5 w-3.5 text-blue-500" />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600">
                            {new Date(affiliate.createdAt).toLocaleDateString('en-IN', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </td>
                          <td className="py-4 px-6">
                            {affiliate.approved === 'pending' && (
                              <span className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 rounded-full">Pending</span>
                            )}
                            {affiliate.approved === 'rejected' && (
                              <span className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 rounded-full">Rejected</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              {affiliate.approved === 'pending' && (
                                <>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleAccept(affiliate); }}
                                    className="px-4 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleReject(affiliate.id); }}
                                    className="px-4 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {affiliate.approved === 'rejected' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleRevert(affiliate); }}
                                  className="px-4 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                                >
                                  Revert
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Affiliate Managers Tab */}
            {activeTab === 'managers' && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Name</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Email</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Phone</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Total Affiliates</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Total Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {managers.map((manager) => (
                      <tr key={manager.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-4 px-6 text-sm text-gray-900">{manager.name}</td>
                        <td className="py-4 px-6 text-sm text-gray-600">{manager.email}</td>
                        <td className="py-4 px-6 text-sm text-gray-600">{manager.phone}</td>
                        <td className="py-4 px-6 text-sm text-gray-900">{manager.totalAffiliates}</td>
                        <td className="py-4 px-6 text-sm text-gray-900">{formatCurrency(manager.totalSales)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Accept Affiliate Modal */}
      {showAcceptModal && selectedAffiliate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Accept an affiliate</h2>
              <button
                onClick={() => { setShowAcceptModal(false); setSelectedAffiliate(null); }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
                </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Discount to customer</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      value={acceptData.discountPercent}
                      onChange={(e) => setAcceptData({ ...acceptData, discountPercent: Number(e.target.value) })}
                      placeholder="Enter Discount %"
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                  </div>
                  <select
                    value={acceptData.discountType}
                    onChange={(e) => setAcceptData({ ...acceptData, discountType: e.target.value as 'percentage' | 'fixed' })}
                    className="px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Commission to affiliate</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      value={acceptData.commissionPercent}
                      onChange={(e) => setAcceptData({ ...acceptData, commissionPercent: Number(e.target.value) })}
                      placeholder="Enter Commission %"
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                  </div>
                  <select
                    value={acceptData.commissionType}
                    onChange={(e) => setAcceptData({ ...acceptData, commissionType: e.target.value as 'percentage' | 'fixed' })}
                    className="px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min order Value</label>
                <input
                  type="number"
                  value={acceptData.minOrderValue || ''}
                  onChange={(e) => setAcceptData({ ...acceptData, minOrderValue: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Enter Amount"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
      </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Discount Code</label>
                <input
                  type="text"
                  value={acceptData.discountCode}
                  onChange={(e) => setAcceptData({ ...acceptData, discountCode: e.target.value.toUpperCase() })}
                  placeholder="Enter discount code"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign Manager <span className="text-red-500">*</span></label>
                <select
                  value={acceptData.managerId}
                  onChange={(e) => setAcceptData({ ...acceptData, managerId: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="">Select a manager</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name} ({manager.totalAffiliates} affiliates)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleAcceptSubmit}
              disabled={processingAction || !acceptData.managerId}
              className="w-full mt-6 py-3 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingAction ? 'Processing...' : 'Accept Invite'}
            </button>
          </div>
        </div>
      )}

      {/* Invite New Affiliate Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Invite a new affiliate</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={inviteData.name}
                    onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                    placeholder="Aromal"
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="text"
                    value={inviteData.phoneNumber}
                    onChange={(e) => setInviteData({ ...inviteData, phoneNumber: e.target.value })}
                    placeholder="+91 6292937901"
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  placeholder="Aromalsula@gmail.com"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                  </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Discount to customer</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      value={inviteData.discountPercent}
                      onChange={(e) => setInviteData({ ...inviteData, discountPercent: Number(e.target.value) })}
                      placeholder="10"
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                  </div>
                  <select
                    value={inviteData.discountType}
                    onChange={(e) => setInviteData({ ...inviteData, discountType: e.target.value as 'percentage' | 'fixed' })}
                    className="px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Commission to affiliate</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      value={inviteData.commissionPercent}
                      onChange={(e) => setInviteData({ ...inviteData, commissionPercent: Number(e.target.value) })}
                      placeholder="10"
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                  </div>
                  <select
                    value={inviteData.commissionType}
                    onChange={(e) => setInviteData({ ...inviteData, commissionType: e.target.value as 'percentage' | 'fixed' })}
                    className="px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
              </div>
              
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min order Value</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={inviteData.minOrderValue || ''}
                    onChange={(e) => setInviteData({ ...inviteData, minOrderValue: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="500"
                    className="w-full pl-8 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>

                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Discount Code</label>
                <input
                  type="text"
                  value={inviteData.discountCode}
                  onChange={(e) => setInviteData({ ...inviteData, discountCode: e.target.value.toUpperCase() })}
                  placeholder="AROMAL"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                  </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Invite By</label>
                <input
                  type="text"
                  value={inviteData.invitedBy}
                  onChange={(e) => setInviteData({ ...inviteData, invitedBy: e.target.value })}
                  placeholder="Abdal"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
            </div>

            <button
              onClick={handleInviteSubmit}
              disabled={processingAction}
              className="w-full mt-6 py-3 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-50"
            >
              {processingAction ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </div>
      )}

      {/* Add Manager Modal */}
      {showAddManagerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Add New Manager</h2>
              <button
                onClick={() => {
                  setShowAddManagerModal(false);
                  setNewManagerData({ name: '', email: '', phone: '' });
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
              </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newManagerData.name}
                  onChange={(e) => setNewManagerData({ ...newManagerData, name: e.target.value })}
                  placeholder="Enter manager name"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={newManagerData.email}
                  onChange={(e) => setNewManagerData({ ...newManagerData, email: e.target.value })}
                  placeholder="Enter email address"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newManagerData.phone}
                  onChange={(e) => setNewManagerData({ ...newManagerData, phone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              </div>

            <button
              onClick={() => {
                // Add new manager to the list
                const newManager: AffiliateManager = {
                  id: `mgr_${Date.now()}`,
                  name: newManagerData.name,
                  email: newManagerData.email,
                  phone: newManagerData.phone,
                  totalAffiliates: 0,
                  totalSales: 0,
                  createdAt: Date.now(),
                };
                setManagers([...managers, newManager]);
                setShowAddManagerModal(false);
                setNewManagerData({ name: '', email: '', phone: '' });
              }}
              disabled={!newManagerData.name || !newManagerData.email || !newManagerData.phone}
              className="w-full mt-6 py-3 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Manager
            </button>
              </div>
        </div>
      )}

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={showFilterDrawer}
        onClose={() => setShowFilterDrawer(false)}
        title="Filter Affiliates"
        filters={affiliateFilters}
        values={filterValues}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />
    </DashboardLayout>
  );
}
