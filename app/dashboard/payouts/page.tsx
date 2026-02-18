'use client';

import { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { apiClient } from '@/lib/api-client';
import {
  Creator,
  PayoutAvailable,
  LedgerEntry,
  PayoutHistoryItem,
  PayoutStatusType,
  PaymentConfig,
  PayoutSummary,
  PayoutRecord,
} from '@/types';
import {
  Search,
  X,
  Wallet,
  Clock,
  IndianRupee,
  Settings,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Save,
  Calendar,
  Eye,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────

const fmt = (v: string | number) =>
  `₹${parseFloat(String(v)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (ts: number) =>
  new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const fmtDateLong = (ts: number) =>
  new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

// ─── Badge helpers ────────────────────────────────────────────────────

const payoutStatusBadge = (status: PayoutStatusType) => {
  const map: Record<PayoutStatusType, { bg: string; text: string; label: string }> = {
    approved: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Approved' },
    processing: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Processing' },
    processed: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Processed' },
    failed: { bg: 'bg-red-50', text: 'text-red-600', label: 'Failed' },
    reversed: { bg: 'bg-red-50', text: 'text-red-600', label: 'Reversed' },
  };
  const s = map[status] ?? { bg: 'bg-gray-100', text: 'text-gray-600', label: status };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
};

const ledgerStatusBadge = (isEligible: boolean, status: string) => {
  if (status === 'paid')
    return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-600">Paid</span>;
  if (isEligible)
    return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-600">Eligible</span>;
  return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-500">Pending</span>;
};

// ─── Types for internal use ────────────────────────────────────────────

type TabType = 'payouts' | 'settings';
type PayoutSubTab = 'issued' | 'processed';

interface CreatorListItem extends Creator {
  managedByName?: string | null;
  totalSales?: string;
  totalOrders?: number;
  totalCommission?: string;
  payoutPreference?: string | null;
  upiId?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  netSales?: string;
}

// ─── Component ────────────────────────────────────────────────────────

export default function PayoutsPage() {
  // ── Tab state ──────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabType>('payouts');
  const [payoutSubTab, setPayoutSubTab] = useState<PayoutSubTab>('issued');

  // ── Payout records state ───────────────────────────────────
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [payoutsLoading, setPayoutsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // ── Creator detail panel state ─────────────────────────────
  const [selectedCreator, setSelectedCreator] = useState<CreatorListItem | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [payoutData, setPayoutData] = useState<PayoutAvailable | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [history, setHistory] = useState<PayoutHistoryItem[]>([]);
  const [detailTab, setDetailTab] = useState<'overview' | 'ledger' | 'history'>('history');

  // ── Initiate payout modal state ────────────────────────────
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutProcessing, setPayoutProcessing] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutSuccess, setPayoutSuccess] = useState<string | null>(null);

  // ── Payment config state ───────────────────────────────────
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [configForm, setConfigForm] = useState({
    payoutWindowDays: 7,
    payoutDayOfMonth: 1,
    minPayoutAmount: '100',
    defaultCurrency: 'INR',
    disqualifyingOrderStatuses: 'refunded, failed',
  });
  const [configMsg, setConfigMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── Payout summary state ───────────────────────────────────
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [mounted, setMounted] = useState(false);

  // ── Debounce search ────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchInput); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => { setMounted(true); }, []);

  // ── Fetch payout records ───────────────────────────────────
  const fetchPayouts = useCallback(async () => {
    try {
      setPayoutsLoading(true);
      const params = new URLSearchParams();
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      // Map sub-tab to status filter
      if (payoutSubTab === 'issued') params.set('status', 'processing');
      if (payoutSubTab === 'processed') params.set('status', 'completed');
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await apiClient.get<{ success: boolean; data: { payouts: PayoutRecord[] } }>(`/payouts${qs}`);
      if (res.success && res.data?.payouts) {
        setPayouts(res.data.payouts);
      } else {
        setPayouts([]);
      }
    } catch (err) {
      console.error('Failed to fetch payouts:', err);
      setPayouts([]);
    } finally {
      setPayoutsLoading(false);
    }
  }, [dateFrom, dateTo, payoutSubTab]);

  useEffect(() => {
    if (activeTab === 'payouts') fetchPayouts();
  }, [activeTab, fetchPayouts]);

  // ── Fetch payout summary ───────────────────────────────────
  const fetchSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const params = new URLSearchParams();
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await apiClient.get<{ success: boolean; data: { summary: PayoutSummary } }>(`/payouts/summary${qs}`);
      if (res.success && res.data?.summary) {
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Failed to fetch payout summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    if (activeTab === 'payouts') fetchSummary();
  }, [activeTab, fetchSummary]);

  // ── Fetch creator detail ───────────────────────────────────
  const fetchCreatorDetail = useCallback(async (creatorId: string) => {
    try {
      setDetailLoading(true);
      const [availRes, ledgerRes, historyRes] = await Promise.all([
        apiClient.get<{ success: boolean; data: { payout: PayoutAvailable } }>(`/creators/${creatorId}/payout/available`),
        apiClient.get<{ success: boolean; data: { ledger: LedgerEntry[] } }>(`/creators/${creatorId}/payout/ledger`),
        apiClient.get<{ success: boolean; data: { history: PayoutHistoryItem[] } }>(`/creators/${creatorId}/payout/history`),
      ]);
      setPayoutData(availRes.data?.payout ?? null);
      setLedger(ledgerRes.data?.ledger ?? []);
      setHistory(historyRes.data?.history ?? []);
    } catch (err) {
      console.error('Failed to fetch creator payout data:', err);
      setPayoutData(null);
      setLedger([]);
      setHistory([]);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const openCreatorDetail = (creator: CreatorListItem) => {
    setSelectedCreator(creator);
    setShowDetail(true);
    setDetailTab('history');
    setPayoutSuccess(null);
    setPayoutError(null);
    fetchCreatorDetail(creator.id);
  };

  const closeDetail = () => {
    setShowDetail(false);
    setSelectedCreator(null);
    setPayoutData(null);
    setLedger([]);
    setHistory([]);
  };

  // ── Initiate payout ────────────────────────────────────────
  const handleInitiatePayout = async () => {
    if (!selectedCreator) return;
    try {
      setPayoutProcessing(true);
      setPayoutError(null);
      setPayoutSuccess(null);
      const body: Record<string, string> = {};
      if (payoutAmount.trim()) body.amount = payoutAmount.trim();
      const res = await apiClient.post<{ success: boolean; data: { payout: { success: boolean; payoutId: string; amount: string; commissionsIncluded: number } }; error?: string }>(
        `/creators/${selectedCreator.id}/payout/initiate`,
        body,
      );
      if (res.success && res.data?.payout) {
        setPayoutSuccess(`Payout of ${fmt(res.data.payout.amount)} initiated (${res.data.payout.commissionsIncluded} commissions). ID: ${res.data.payout.payoutId}`);
        setShowPayoutModal(false);
        setPayoutAmount('');
        // Refresh data
        fetchCreatorDetail(selectedCreator.id);
      } else {
        setPayoutError(res.error || 'Payout failed');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Payout failed';
      setPayoutError(msg);
    } finally {
      setPayoutProcessing(false);
    }
  };

  // ── Fetch payment config ───────────────────────────────────
  const fetchConfig = useCallback(async () => {
    try {
      setConfigLoading(true);
      const res = await apiClient.get<{ success: boolean; data: { config: PaymentConfig } }>('/payment-config');
      if (res.success && res.data?.config) {
        setConfig(res.data.config);
        setConfigForm({
          payoutWindowDays: res.data.config.payoutWindowDays,
          payoutDayOfMonth: res.data.config.payoutDayOfMonth,
          minPayoutAmount: res.data.config.minPayoutAmount,
          defaultCurrency: res.data.config.defaultCurrency,
          disqualifyingOrderStatuses: res.data.config.disqualifyingOrderStatuses.join(', '),
        });
      }
    } catch (err) {
      console.error('Failed to fetch payment config:', err);
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'settings') fetchConfig();
  }, [activeTab, fetchConfig]);

  // ── Save payment config ────────────────────────────────────
  const handleSaveConfig = async () => {
    try {
      setConfigSaving(true);
      setConfigMsg(null);
      const body: Record<string, any> = {};
      if (configForm.payoutWindowDays !== config?.payoutWindowDays) body.payoutWindowDays = configForm.payoutWindowDays;
      if (configForm.payoutDayOfMonth !== config?.payoutDayOfMonth) body.payoutDayOfMonth = configForm.payoutDayOfMonth;
      if (configForm.minPayoutAmount !== config?.minPayoutAmount) body.minPayoutAmount = configForm.minPayoutAmount;
      if (configForm.defaultCurrency !== config?.defaultCurrency) body.defaultCurrency = configForm.defaultCurrency;
      const statuses = configForm.disqualifyingOrderStatuses.split(',').map(s => s.trim()).filter(Boolean);
      if (JSON.stringify(statuses) !== JSON.stringify(config?.disqualifyingOrderStatuses)) body.disqualifyingOrderStatuses = statuses;

      if (Object.keys(body).length === 0) {
        setConfigMsg({ type: 'error', text: 'No changes to save' });
        return;
      }

      const res = await apiClient.put<{ success: boolean; data: { config: PaymentConfig } }>('/payment-config', body);
      if (res.success && res.data?.config) {
        setConfig(res.data.config);
        setConfigForm({
          payoutWindowDays: res.data.config.payoutWindowDays,
          payoutDayOfMonth: res.data.config.payoutDayOfMonth,
          minPayoutAmount: res.data.config.minPayoutAmount,
          defaultCurrency: res.data.config.defaultCurrency,
          disqualifyingOrderStatuses: res.data.config.disqualifyingOrderStatuses.join(', '),
        });
        setConfigMsg({ type: 'success', text: 'Payment configuration saved successfully' });
      }
    } catch (err: any) {
      setConfigMsg({ type: 'error', text: err?.response?.data?.error || 'Failed to save config' });
    } finally {
      setConfigSaving(false);
    }
  };

  // ── Derived: filter payouts client-side by search ──────────
  const filteredPayouts = payouts.filter(p => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return (
      p.affiliate.name.toLowerCase().includes(q) ||
      p.affiliate.email.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  });

  // ────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="p-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Payouts</h1>
          <span className="text-sm text-gray-500">
            Last refreshed: {mounted ? new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '—'}
          </span>
        </div>

        {/* Summary Cards */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          {/* Date Filter Row */}
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
            <span className="text-sm text-gray-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(''); setDateTo(''); }}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Clear
              </button>
            )}
          </div>

          {summaryLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-xl border border-gray-100 p-5 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-28 mb-3" />
                  <div className="h-8 bg-gray-200 rounded w-36 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-24" />
                </div>
              ))}
            </div>
          ) : summary ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Issued Payouts */}
              <div className="rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Issued Payouts</p>
                    <p className="text-3xl font-semibold text-gray-900">{fmt(summary.totalEligible)}</p>
                    <p className="text-sm text-gray-500 mt-1">{summary.totalEligibleCount} payouts pending</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-amber-400" />
                </div>
              </div>
              {/* Processed Payouts */}
              <div className="rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Processed Payouts</p>
                    <p className="text-3xl font-semibold text-gray-900">{fmt(summary.totalPaidOut)}</p>
                    <p className="text-sm text-emerald-600 mt-1">{summary.totalPaidOutCount} payouts completed</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-emerald-400" />
                </div>
              </div>
              {/* Pending */}
              <div className="rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Pending</p>
                    <p className="text-3xl font-semibold text-gray-900">{fmt(summary.totalPending)}</p>
                    <p className="text-sm text-gray-500 mt-1">{summary.totalPendingCount} within payout window</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-400" />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Tabs + Search Row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('payouts')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'payouts' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <span className="flex items-center gap-2"><Wallet className="h-4 w-4" />Payouts</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'settings' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <span className="flex items-center gap-2"><Settings className="h-4 w-4" />Payment Settings</span>
            </button>
          </div>

          {/* Search — only on payouts tab */}
          {activeTab === 'payouts' && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name or transaction ID"
                className="pl-10 pr-4 py-2 w-80 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>
          )}
        </div>

        {/* ─── Payouts Tab ─── */}
        {activeTab === 'payouts' && (
          <>
            {/* Issued / Processed Sub-tabs */}
            <div className="flex items-center gap-1 mb-4">
              <button
                onClick={() => setPayoutSubTab('issued')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${payoutSubTab === 'issued' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Issued
              </button>
              <button
                onClick={() => setPayoutSubTab('processed')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${payoutSubTab === 'processed' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Processed
              </button>
            </div>

            {payoutsLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-[#EAC312]" />
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Affiliate</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Orders</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Amount</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Payment Method</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">{payoutSubTab === 'issued' ? 'Issued Date' : 'Processed Date'}</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayouts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-500">No payouts found</td>
                      </tr>
                    ) : (
                      filteredPayouts.map((p) => (
                        <tr
                          key={p.id}
                          className="border-b border-gray-50 hover:bg-gray-50"
                        >
                          <td className="py-4 px-6">
                            <p className="text-sm font-medium text-gray-900">{p.affiliate.name}</p>
                            <p className="text-xs text-gray-500">{p.affiliate.email}</p>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600">
                            {p.ordersCount}
                          </td>
                          <td className="py-4 px-6 text-sm font-medium text-gray-900">
                            {fmt(p.amount)}
                          </td>
                          <td className="py-4 px-6">
                            <p className="text-sm text-gray-900">{p.paymentMethod.type === 'bank' ? 'Bank Transfer' : p.paymentMethod.type === 'upi' ? 'UPI' : p.paymentMethod.type}</p>
                            <p className="text-xs text-gray-500">{p.paymentMethod.details}</p>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600">
                            {payoutSubTab === 'issued' && p.issuedDate ? fmtDate(p.issuedDate) : ''}
                            {payoutSubTab === 'processed' && p.processedDate ? fmtDate(p.processedDate) : ''}
                          </td>
                          <td className="py-4 px-6">
                            {(() => {
                              const s = p.status.toLowerCase();
                              if (s === 'completed' || s === 'processed') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-600">Processed</span>;
                              if (s === 'processing' || s === 'issued') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-600">Issued</span>;
                              if (s === 'failed') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-600">Failed</span>;
                              return <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600">{p.status}</span>;
                            })()}
                          </td>
                          <td className="py-4 px-6">
                            <button
                              onClick={() => {
                                // Open detail slide-over for this affiliate
                                const fakeCreator = { id: p.affiliate.id, name: p.affiliate.name, email: p.affiliate.email } as CreatorListItem;
                                openCreatorDetail(fakeCreator);
                              }}
                              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                              title="View payout details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ─── Payment Settings Tab ─── */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
            {configLoading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-[#EAC312]" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Payment Configuration</h2>
                  {config && (
                    <p className="text-xs text-gray-400">
                      Last updated: {fmtDateLong(config.updatedAt)} by {config.updatedBy}
                    </p>
                  )}
                </div>

                <div className="space-y-5">
                  {/* Payout Window Days */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payout Window (days after fulfillment)</label>
                    <input
                      type="number"
                      min={0}
                      max={90}
                      value={configForm.payoutWindowDays}
                      onChange={(e) => setConfigForm({ ...configForm, payoutWindowDays: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    <p className="text-xs text-gray-400 mt-1">Days after order fulfillment before commission becomes eligible (0–90)</p>
                  </div>

                  {/* Payout Day of Month */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payout Day of Month</label>
                    <input
                      type="number"
                      min={1}
                      max={28}
                      value={configForm.payoutDayOfMonth}
                      onChange={(e) => setConfigForm({ ...configForm, payoutDayOfMonth: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    <p className="text-xs text-gray-400 mt-1">Day of month when payouts can be processed (1–28)</p>
                  </div>

                  {/* Minimum Payout Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Payout Amount (₹)</label>
                    <input
                      type="text"
                      value={configForm.minPayoutAmount}
                      onChange={(e) => setConfigForm({ ...configForm, minPayoutAmount: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>

                  {/* Default Currency */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
                    <input
                      type="text"
                      value={configForm.defaultCurrency}
                      onChange={(e) => setConfigForm({ ...configForm, defaultCurrency: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>

                  {/* Disqualifying Order Statuses */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Disqualifying Order Statuses</label>
                    <input
                      type="text"
                      value={configForm.disqualifyingOrderStatuses}
                      onChange={(e) => setConfigForm({ ...configForm, disqualifyingOrderStatuses: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    <p className="text-xs text-gray-400 mt-1">Comma-separated list of order statuses that disqualify commissions</p>
                  </div>

                  {/* Status message */}
                  {configMsg && (
                    <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${configMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {configMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      {configMsg.text}
                    </div>
                  )}

                  {/* Save button */}
                  <button
                    onClick={handleSaveConfig}
                    disabled={configSaving}
                    className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {configSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {configSaving ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ─── Creator Detail Slide-over ─── */}
      {showDetail && selectedCreator && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={closeDetail} />

          {/* Panel */}
          <div className="relative w-full max-w-2xl bg-white shadow-2xl overflow-y-auto animate-slide-in">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedCreator.name}</h2>
                <p className="text-sm text-gray-500">{selectedCreator.email}</p>
              </div>
              <button onClick={closeDetail} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-[#EAC312]" />
              </div>
            ) : (
              <div className="px-6 py-5 space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-700">Available</span>
                    </div>
                    <p className="text-2xl font-semibold text-emerald-700">{fmt(payoutData?.available?.amount ?? '0')}</p>
                    <p className="text-xs text-emerald-600 mt-1">{payoutData?.available?.eligibleCommissions ?? 0} eligible commissions</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span className="text-xs font-medium text-amber-700">Pending</span>
                    </div>
                    <p className="text-2xl font-semibold text-amber-700">{fmt(payoutData?.pending?.amount ?? '0')}</p>
                    <p className="text-xs text-amber-600 mt-1">{payoutData?.pending?.commissionsWithinWindow ?? 0} orders in window</p>
                  </div>
                </div>

                {/* Payout action area */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {payoutData?.canPayout ? 'Ready to pay' : 'Cannot initiate payout'}
                      </p>
                      {payoutData?.reason && (
                        <p className="text-xs text-gray-500 mt-0.5">{payoutData.reason}</p>
                      )}
                      {!payoutData?.hasPaymentMethod && (
                        <p className="text-xs text-red-500 mt-0.5">No payment method configured</p>
                      )}
                      {payoutData?.nextPayoutDate && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Next payout available: {new Date(payoutData.nextPayoutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => { setPayoutAmount(''); setPayoutError(null); setShowPayoutModal(true); }}
                      disabled={!payoutData?.canPayout}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Send className="h-4 w-4" />
                      Initiate Payout
                    </button>
                  </div>

                  {/* Success/Error messages */}
                  {payoutSuccess && (
                    <div className="mt-3 flex items-center gap-2 p-3 rounded-lg text-sm bg-emerald-50 text-emerald-700">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                      <span>{payoutSuccess}</span>
                    </div>
                  )}
                  {payoutError && !showPayoutModal && (
                    <div className="mt-3 flex items-center gap-2 p-3 rounded-lg text-sm bg-red-50 text-red-700">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{payoutError}</span>
                    </div>
                  )}
                </div>

                {/* Deductions info */}
                {payoutData?.available?.deductions && parseFloat(payoutData.available.deductions) > 0 && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-4 py-2">
                    <IndianRupee className="h-3 w-3" />
                    Deductions: {fmt(payoutData.available.deductions)}
                    {payoutData.available.carryForwardDeduction && parseFloat(payoutData.available.carryForwardDeduction) > 0 && (
                      <span> (Carry-forward: {fmt(payoutData.available.carryForwardDeduction)})</span>
                    )}
                  </div>
                )}

                {/* Sub-tabs: Overview / Ledger / History */}
                <div className="border-b border-gray-200">
                  <div className="flex gap-1">
                    {(['overview', 'ledger', 'history'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setDetailTab(t)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${detailTab === t ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                      >
                        {t === 'overview' ? 'Overview' : t === 'ledger' ? 'Earnings Ledger' : 'Payout History'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Overview sub-tab */}
                {detailTab === 'overview' && payoutData && (
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">Creator ID</span>
                      <span className="text-sm font-mono text-gray-700">{payoutData.creatorId}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">Currency</span>
                      <span className="text-sm text-gray-700">{payoutData.available.currency}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">Has Payment Method</span>
                      <span className={`text-sm font-medium ${payoutData.hasPaymentMethod ? 'text-emerald-600' : 'text-red-500'}`}>
                        {payoutData.hasPaymentMethod ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">Can Payout</span>
                      <span className={`text-sm font-medium ${payoutData.canPayout ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {payoutData.canPayout ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Ledger sub-tab */}
                {detailTab === 'ledger' && (
                  <div className="space-y-2">
                    {ledger.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-8">No earnings records found</p>
                    ) : (
                      ledger.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">{entry.orderNumber}</span>
                              {ledgerStatusBadge(entry.isEligible, entry.status)}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-gray-500">Basis: {fmt(entry.basisAmount)}</span>
                              {entry.deductedAmount && parseFloat(entry.deductedAmount) > 0 && (
                                <span className="text-xs text-red-500">Deduction: {fmt(entry.deductedAmount)}</span>
                              )}
                              {entry.eligibleAt && (
                                <span className="text-xs text-gray-400">
                                  {entry.isEligible ? `Eligible since ${fmtDate(entry.eligibleAt)}` : `Eligible on ${fmtDate(entry.eligibleAt)}`}
                                </span>
                              )}
                              {!entry.eligibleAt && !entry.isEligible && (
                                <span className="text-xs text-gray-400">Awaiting fulfillment</span>
                              )}
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">{fmt(entry.commissionAmount)}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* History sub-tab */}
                {detailTab === 'history' && (
                  <div className="space-y-2">
                    {history.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-8">No payout history found</p>
                    ) : (
                      history.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">{fmt(item.amount)}</span>
                              {payoutStatusBadge(item.status)}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-gray-500">{item.commissionsCount} commissions</span>
                              {item.deductionsAmount && parseFloat(item.deductionsAmount) > 0 && (
                                <span className="text-xs text-red-500">Deductions: {fmt(item.deductionsAmount)}</span>
                              )}
                              <span className="text-xs text-gray-400">
                                {item.initiatedByType === 'admin' ? 'By Admin' : 'By Creator'}
                              </span>
                              <span className="text-xs text-gray-400">{fmtDate(item.createdAt)}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-mono text-gray-400 block">{item.id.slice(0, 16)}...</span>
                            {item.processedAt && (
                              <span className="text-xs text-gray-400">Processed {fmtDate(item.processedAt)}</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Refresh detail data */}
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => selectedCreator && fetchCreatorDetail(selectedCreator.id)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Refresh data
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Initiate Payout Confirmation Modal ─── */}
      {showPayoutModal && selectedCreator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Initiate Payout</h3>
              <button onClick={() => setShowPayoutModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-emerald-50 rounded-lg p-4 text-center">
                <p className="text-xs text-emerald-600 mb-1">Available amount</p>
                <p className="text-2xl font-bold text-emerald-700">{fmt(payoutData?.available?.amount ?? '0')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payout Amount (leave empty to pay full available amount)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input
                    type="text"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder={payoutData?.available?.amount ?? '0.00'}
                    className="w-full pl-8 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500">
                This will initiate a payout for <strong>{selectedCreator.name}</strong> via Razorpay. The amount will be transferred to their configured payment method.
              </p>

              {payoutError && (
                <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-red-50 text-red-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{payoutError}</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleInitiatePayout}
                disabled={payoutProcessing}
                className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {payoutProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {payoutProcessing ? 'Processing...' : 'Confirm Payout'}
              </button>
              <button
                onClick={() => setShowPayoutModal(false)}
                className="px-6 py-3 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-in animation */}
      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slideIn 0.25s ease-out;
        }
      `}</style>
    </DashboardLayout>
  );
}
