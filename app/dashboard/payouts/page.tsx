'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FilterDrawer, FilterOption, FilterValues } from '@/components/ui/FilterDrawer';
import { Search, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight, Download, Eye } from 'lucide-react';

type PayoutStatus = 'issued' | 'processed' | 'pending' | 'failed';
type TabType = 'issued' | 'processed';

interface Payout {
  id: string;
  affiliateId: string;
  affiliateName: string;
  affiliateEmail: string;
  amount: number;
  currencyCode: string;
  ordersCount: number;
  periodStart: number;
  periodEnd: number;
  status: PayoutStatus;
  issuedAt: number;
  processedAt?: number;
  transactionId?: string;
  paymentMethod: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
  };
}

// Mock data for payouts
const mockPayouts: Payout[] = [
  {
    id: 'pay_001',
    affiliateId: 'aff_001',
    affiliateName: 'Sameer Poswal',
    affiliateEmail: 'sameer@gmail.com',
    amount: 8744.00,
    currencyCode: 'INR',
    ordersCount: 15,
    periodStart: 1701388800000,
    periodEnd: 1704067200000,
    status: 'issued',
    issuedAt: 1704153600000,
    paymentMethod: 'Bank Transfer',
    bankDetails: { bankName: 'HDFC Bank', accountNumber: '****4521' }
  },
  {
    id: 'pay_002',
    affiliateId: 'aff_002',
    affiliateName: 'Yuvraj Gautam',
    affiliateEmail: 'yuvraj@gmail.com',
    amount: 12500.50,
    currencyCode: 'INR',
    ordersCount: 23,
    periodStart: 1701388800000,
    periodEnd: 1704067200000,
    status: 'issued',
    issuedAt: 1704153600000,
    paymentMethod: 'Bank Transfer',
    bankDetails: { bankName: 'ICICI Bank', accountNumber: '****7832' }
  },
  {
    id: 'pay_003',
    affiliateId: 'aff_003',
    affiliateName: 'Soham',
    affiliateEmail: 'soham@gmail.com',
    amount: 5600.00,
    currencyCode: 'INR',
    ordersCount: 8,
    periodStart: 1701388800000,
    periodEnd: 1704067200000,
    status: 'issued',
    issuedAt: 1704153600000,
    paymentMethod: 'UPI',
  },
  {
    id: 'pay_004',
    affiliateId: 'aff_004',
    affiliateName: 'Vaibhav Sharma',
    affiliateEmail: 'vaibhav@gmail.com',
    amount: 14004.40,
    currencyCode: 'INR',
    ordersCount: 28,
    periodStart: 1698796800000,
    periodEnd: 1701388800000,
    status: 'processed',
    issuedAt: 1701475200000,
    processedAt: 1701561600000,
    transactionId: 'TXN123456789',
    paymentMethod: 'Bank Transfer',
    bankDetails: { bankName: 'SBI', accountNumber: '****9012' }
  },
  {
    id: 'pay_005',
    affiliateId: 'aff_005',
    affiliateName: 'Meenakshi Chauhan',
    affiliateEmail: 'meenakshi@gmail.com',
    amount: 113112.50,
    currencyCode: 'INR',
    ordersCount: 156,
    periodStart: 1698796800000,
    periodEnd: 1701388800000,
    status: 'processed',
    issuedAt: 1701475200000,
    processedAt: 1701561600000,
    transactionId: 'TXN123456790',
    paymentMethod: 'Bank Transfer',
    bankDetails: { bankName: 'Axis Bank', accountNumber: '****3456' }
  },
  {
    id: 'pay_006',
    affiliateId: 'aff_006',
    affiliateName: 'Paavni Patnik',
    affiliateEmail: 'paavni@gmail.com',
    amount: 30045.00,
    currencyCode: 'INR',
    ordersCount: 45,
    periodStart: 1698796800000,
    periodEnd: 1701388800000,
    status: 'processed',
    issuedAt: 1701475200000,
    processedAt: 1701561600000,
    transactionId: 'TXN123456791',
    paymentMethod: 'Bank Transfer',
    bankDetails: { bankName: 'Kotak Bank', accountNumber: '****7890' }
  },
  {
    id: 'pay_007',
    affiliateId: 'aff_007',
    affiliateName: 'Puja',
    affiliateEmail: 'puja@gmail.com',
    amount: 2500.00,
    currencyCode: 'INR',
    ordersCount: 5,
    periodStart: 1701388800000,
    periodEnd: 1704067200000,
    status: 'issued',
    issuedAt: 1704153600000,
    paymentMethod: 'UPI',
  },
  {
    id: 'pay_008',
    affiliateId: 'aff_008',
    affiliateName: 'Ishika Rahangdale',
    affiliateEmail: 'ishika@gmail.com',
    amount: 1233.81,
    currencyCode: 'INR',
    ordersCount: 3,
    periodStart: 1698796800000,
    periodEnd: 1701388800000,
    status: 'processed',
    issuedAt: 1701475200000,
    processedAt: 1701561600000,
    transactionId: 'TXN123456792',
    paymentMethod: 'Bank Transfer',
    bankDetails: { bankName: 'Yes Bank', accountNumber: '****1234' }
  },
  {
    id: 'pay_009',
    affiliateId: 'aff_009',
    affiliateName: 'Tasneem',
    affiliateEmail: 'tasneem@gmail.com',
    amount: 2500.00,
    currencyCode: 'INR',
    ordersCount: 6,
    periodStart: 1701388800000,
    periodEnd: 1704067200000,
    status: 'issued',
    issuedAt: 1704153600000,
    paymentMethod: 'Bank Transfer',
    bankDetails: { bankName: 'PNB', accountNumber: '****5678' }
  },
  {
    id: 'pay_010',
    affiliateId: 'aff_010',
    affiliateName: 'Jeevan K S',
    affiliateEmail: 'jeevan@gmail.com',
    amount: 8500.00,
    currencyCode: 'INR',
    ordersCount: 12,
    periodStart: 1698796800000,
    periodEnd: 1701388800000,
    status: 'processed',
    issuedAt: 1701475200000,
    processedAt: 1701561600000,
    transactionId: 'TXN123456793',
    paymentMethod: 'UPI',
  },
];

export default function PayoutsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('issued');
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);

  // Filter drawer state
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [filterValues, setFilterValues] = useState<FilterValues>({
    paymentMethod: [],
    dateRange: { from: '', to: '' },
    amountRange: { min: 0, max: 200000 },
    affiliate: '',
  });

  // Filter options for payouts
  const payoutFilters: FilterOption[] = [
    {
      id: 'paymentMethod',
      label: 'Payment Method',
      type: 'multiselect',
      options: [
        { value: 'Bank Transfer', label: 'Bank Transfer' },
        { value: 'UPI', label: 'UPI' },
        { value: 'PayPal', label: 'PayPal' },
        { value: 'Razorpay', label: 'Razorpay' },
      ],
    },
    {
      id: 'dateRange',
      label: 'Payout Date',
      type: 'daterange',
    },
    {
      id: 'amountRange',
      label: 'Payout Amount (₹)',
      type: 'range',
      min: 0,
      max: 200000,
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
    setPage(1);
    console.log('Applied filters:', values);
  };

  const handleResetFilters = () => {
    setFilterValues({
      paymentMethod: [],
      dateRange: { from: '', to: '' },
      amountRange: { min: 0, max: 200000 },
      affiliate: '',
    });
  };

  useEffect(() => {
    setMounted(true);
    fetchPayouts();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    filterPayouts();
  }, [activeTab, debouncedSearch, page]);

  const fetchPayouts = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    setPayouts(mockPayouts);
    setLoading(false);
  };

  const filterPayouts = () => {
    let filtered = mockPayouts.filter(p => p.status === activeTab);
    
    if (debouncedSearch) {
      const search = debouncedSearch.toLowerCase();
      filtered = filtered.filter(p => 
        p.affiliateName.toLowerCase().includes(search) ||
        p.affiliateEmail.toLowerCase().includes(search) ||
        p.transactionId?.toLowerCase().includes(search)
      );
    }
    
    setPayouts(filtered);
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPeriod = (start: number, end: number) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  };

  const getStatusBadge = (status: PayoutStatus) => {
    const styles: Record<PayoutStatus, { bg: string; text: string; label: string }> = {
      issued: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Issued' },
      processed: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Processed' },
      pending: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Pending' },
      failed: { bg: 'bg-red-50', text: 'text-red-600', label: 'Failed' },
    };
    const style = styles[status];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  const handleViewDetails = (payout: Payout) => {
    setSelectedPayout(payout);
    setShowDetailModal(true);
  };

  const handleMarkAsProcessed = async (payoutId: string) => {
    // API call would go here
    const updatedPayouts = mockPayouts.map(p => 
      p.id === payoutId 
        ? { ...p, status: 'processed' as PayoutStatus, processedAt: Date.now(), transactionId: `TXN${Date.now()}` }
        : p
    );
    setPayouts(updatedPayouts.filter(p => p.status === activeTab));
    setShowDetailModal(false);
  };

  // Pagination
  const filteredPayouts = payouts;
  const totalPages = Math.ceil(filteredPayouts.length / pageSize);
  const paginatedPayouts = filteredPayouts.slice((page - 1) * pageSize, page * pageSize);

  // Stats
  const issuedTotal = mockPayouts.filter(p => p.status === 'issued').reduce((sum, p) => sum + p.amount, 0);
  const processedTotal = mockPayouts.filter(p => p.status === 'processed').reduce((sum, p) => sum + p.amount, 0);
  const issuedCount = mockPayouts.filter(p => p.status === 'issued').length;
  const processedCount = mockPayouts.filter(p => p.status === 'processed').length;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Payouts</h1>
          <span className="text-sm text-gray-500">
            Last refreshed: {mounted ? getCurrentTime() : '11:56 AM'}
          </span>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Issued Payouts</p>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(issuedTotal)}</p>
                <p className="text-xs text-gray-500 mt-1">{issuedCount} payouts pending</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-amber-400"></div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Processed Payouts</p>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(processedTotal)}</p>
                <p className="text-xs text-gray-500 mt-1">{processedCount} payouts completed</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-emerald-400"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs and Search Row */}
        <div className="flex items-center justify-between mb-6">
          {/* Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setActiveTab('issued'); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'issued'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Issued
            </button>
            <button
              onClick={() => { setActiveTab('processed'); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'processed'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Processed
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
                placeholder="Search by name or transaction ID"
                className="pl-10 pr-4 py-2 w-72 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>
            <button 
              onClick={() => setShowFilterDrawer(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              <ArrowUpDown className="h-4 w-4" />
              Sort By
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">
              <Download className="h-4 w-4" />
              Export
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
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Affiliate</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Period</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Orders</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Amount</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Payment Method</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">
                    {activeTab === 'issued' ? 'Issued Date' : 'Processed Date'}
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPayouts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500">
                      No payouts found
                    </td>
                  </tr>
                ) : (
                  paginatedPayouts.map((payout) => (
                    <tr 
                      key={payout.id} 
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{payout.affiliateName}</p>
                          <p className="text-xs text-gray-500">{payout.affiliateEmail}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {formatPeriod(payout.periodStart, payout.periodEnd)}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-900">
                        {payout.ordersCount}
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-900">
                        {formatCurrency(payout.amount)}
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-sm text-gray-900">{payout.paymentMethod}</p>
                          {payout.bankDetails && (
                            <p className="text-xs text-gray-500">{payout.bankDetails.bankName} {payout.bankDetails.accountNumber}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {formatDate(activeTab === 'issued' ? payout.issuedAt : (payout.processedAt || payout.issuedAt))}
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(payout.status)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(payout)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {activeTab === 'issued' && (
                            <button
                              onClick={() => handleMarkAsProcessed(payout.id)}
                              className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800"
                            >
                              Mark Processed
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {/* Pagination */}
            <div className="flex items-center justify-end gap-2 py-4 px-6 border-t border-gray-100">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-600">
                Page {page}/{totalPages || 1}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages || 1, p + 1))}
                disabled={page === totalPages || totalPages === 0}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payout Details Modal */}
      {showDetailModal && selectedPayout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Payout Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm text-gray-500">Affiliate</span>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{selectedPayout.affiliateName}</p>
                  <p className="text-xs text-gray-500">{selectedPayout.affiliateEmail}</p>
                </div>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm text-gray-500">Amount</span>
                <span className="text-lg font-semibold text-gray-900">{formatCurrency(selectedPayout.amount)}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm text-gray-500">Period</span>
                <span className="text-sm text-gray-900">{formatPeriod(selectedPayout.periodStart, selectedPayout.periodEnd)}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm text-gray-500">Orders</span>
                <span className="text-sm text-gray-900">{selectedPayout.ordersCount} orders</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm text-gray-500">Payment Method</span>
                <div className="text-right">
                  <p className="text-sm text-gray-900">{selectedPayout.paymentMethod}</p>
                  {selectedPayout.bankDetails && (
                    <p className="text-xs text-gray-500">{selectedPayout.bankDetails.bankName} {selectedPayout.bankDetails.accountNumber}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm text-gray-500">Status</span>
                {getStatusBadge(selectedPayout.status)}
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm text-gray-500">Issued Date</span>
                <span className="text-sm text-gray-900">{formatDate(selectedPayout.issuedAt)}</span>
              </div>

              {selectedPayout.processedAt && (
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Processed Date</span>
                  <span className="text-sm text-gray-900">{formatDate(selectedPayout.processedAt)}</span>
                </div>
              )}

              {selectedPayout.transactionId && (
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Transaction ID</span>
                  <span className="text-sm font-mono text-gray-900">{selectedPayout.transactionId}</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              {selectedPayout.status === 'issued' && (
                <button
                  onClick={() => handleMarkAsProcessed(selectedPayout.id)}
                  className="flex-1 py-3 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800"
                >
                  Mark as Processed
                </button>
              )}
              <button
                onClick={() => setShowDetailModal(false)}
                className={`${selectedPayout.status === 'issued' ? '' : 'flex-1'} py-3 px-6 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={showFilterDrawer}
        onClose={() => setShowFilterDrawer(false)}
        title="Filter Payouts"
        filters={payoutFilters}
        values={filterValues}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />
    </DashboardLayout>
  );
}

