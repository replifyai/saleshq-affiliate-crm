'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { apiClient } from '@/lib/api-client';
import { ExtendedAffiliate, FeaturedCollection, FeaturedProduct } from '@/types';
import {
  ArrowLeft,
  DollarSign,
  ShoppingCart,
  Wallet,
  Users,
  Instagram,
  Plus,
  X,
} from 'lucide-react';

// Creator profile API response (profile, stats, coupons, etc.)
interface CouponValue {
  type: 'percentage' | 'fixed_amount';
  percentage?: number;
  amount?: number;
}

interface ProfileCoupon {
  id: string;
  shopifyId?: string;
  title?: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  startsAt?: string;
  endsAt?: string | null;
  value: CouponValue;
  usageLimit?: number | null;
  usesPerOrderLimit?: number | null;
  description?: string;
  commissionType: 'percentage' | 'fixed';
  commissionValue: string;
  commissionBasis: 'subtotal_after_discounts' | 'subtotal_before_discounts' | 'total';
  createdAt?: number;
  approvedAt?: number | null;
}

interface ReferralLink {
  id: string;
  referralCode: string;
  defaultCommissionType: 'percentage' | 'fixed';
  defaultCommissionValue: string;
  commissionBasis: 'subtotal_after_discounts' | 'subtotal_before_discounts' | 'total';
  active: boolean;
  createdAt: number;
}

interface ProfileData {
  id: string;
  name: string;
  phoneNumber?: string;
  email?: string;
  createdAt?: number;
  approved?: string;
  socialMediaHandles?: { platform: string; handle: string }[];
  phoneNumberVerified?: boolean;
  uniqueReferralCode?: string;
  approvedBy?: string;
  approvedAt?: number | null;
  managedBy?: string;
}

interface ProfileStats {
  totalSales?: string;
  totalOrders?: number;
  totalCommission?: string;
}

interface ProfileApiData {
  profile: ProfileData;
  managedByName?: string;
  approvedByName?: string;
  stats?: ProfileStats;
  coupons?: ProfileCoupon[];
  referralLink?: ReferralLink;
  earningsBreakdown?: Record<string, unknown>;
  ordersByStatus?: Record<string, unknown>;
  completionScore?: { completedCount?: number; leftCount?: number };
}

export default function AffiliateProfilePage() {
  const router = useRouter();
  const params = useParams();
  const affiliateId = params?.id as string;

  const [affiliate, setAffiliate] = useState<ExtendedAffiliate | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showEditOfferModal, setShowEditOfferModal] = useState(false);
  const [showAddCollectionModal, setShowAddCollectionModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [savingOffer, setSavingOffer] = useState(false);
  const [offerSaveError, setOfferSaveError] = useState<string | null>(null);

  // Local state for editable data (featured collections/products not in profile API)
  const [collections, setCollections] = useState<FeaturedCollection[]>([]);
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [coupons, setCoupons] = useState<ProfileCoupon[]>([]);
  const [referralLink, setReferralLink] = useState<ReferralLink | null>(null);
  const [offerData, setOfferData] = useState({
    discountCode: '',
    discountAmount: '',
    commissionAmount: '',
    commissionType: 'percentage' as 'percentage' | 'fixed' | string,
  });

  const fetchProfile = useCallback(async () => {
    if (!affiliateId) return;
    try {
      setLoading(true);
      const res = await apiClient.get<{ success: boolean; data: ProfileApiData & { creator?: ProfileApiData } }>(`/creators/${affiliateId}/profile`);
      const data = res.data;
      if (!res.success || !data) {
        setAffiliate(null);
        return;
      }
      // API returns data.creator = { profile, stats, coupons, managedByName, ... }
      const creator = data.creator ?? data;
      const p = (creator as { profile?: ProfileData }).profile ?? (creator as unknown as ProfileData);
      if (!p?.id) {
        setAffiliate(null);
        return;
      }
      const stats = creator.stats ?? data.stats;
      const rawCoupons = creator.coupons ?? data.coupons;
      const couponsList = Array.isArray(rawCoupons) ? rawCoupons : (rawCoupons ? [rawCoupons] : []);
      const managedByName = creator.managedByName ?? data.managedByName;
      const coupon = couponsList[0];
      const totalSales = stats?.totalSales != null ? parseFloat(String(stats.totalSales)) : 0;
      const totalOrders = stats?.totalOrders ?? 0;
      const totalCommission = stats?.totalCommission != null ? parseFloat(String(stats.totalCommission)) : 0;
      const discountVal = coupon?.value?.percentage != null
        ? `${coupon.value.percentage}%`
        : coupon?.value?.amount != null
          ? `₹${coupon.value.amount}`
          : '';
      setAffiliate({
        id: p.id,
        name: p.name,
        phoneNumber: p.phoneNumber ?? '',
        email: p.email ?? '',
        createdAt: p.createdAt ?? 0,
        approved: (p.approved as 'pending' | 'approved' | 'rejected') ?? 'pending',
        socialMediaHandles: p.socialMediaHandles ?? [],
        phoneNumberVerified: p.phoneNumberVerified ?? false,
        totalSales,
        totalOrders,
        totalCommission,
        discountCode: coupon?.code ?? '',
        discountPercent: coupon?.value?.percentage ?? 0,
        reward: coupon?.value?.percentage ?? 0,
        managerName: managedByName,
      });
      setOfferData({
        discountCode: coupon?.code ?? '',
        discountAmount: discountVal,
        commissionAmount: typeof coupon?.commissionValue === 'string' ? coupon.commissionValue : String(coupon?.commissionValue ?? ''),
        commissionType: coupon?.commissionType ?? 'percentage',
      });
      // Store full coupons and referral link for detailed display
      setCoupons(couponsList as ProfileCoupon[]);
      setReferralLink(creator.referralLink ?? data.referralLink ?? null);
    } catch (error) {
      console.error('Failed to fetch affiliate profile:', error);
      setAffiliate(null);
    } finally {
      setLoading(false);
    }
  }, [affiliateId]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleRemoveCollection = (id: string) => {
    setCollections(collections.filter(c => c.id !== id));
  };

  const handleRemoveProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const handleSaveOffer = async () => {
    if (!affiliateId) return;
    const commissionValue = offerData.commissionAmount.trim();
    const num = parseFloat(commissionValue);
    if (!commissionValue || Number.isNaN(num) || num < 0) {
      setOfferSaveError('Commission value must be a positive number.');
      return;
    }
    setOfferSaveError(null);
    try {
      setSavingOffer(true);
      const response = await apiClient.put<{ success?: boolean; error?: string }>(
        `/creators/${affiliateId}/approve`,
        {
          commissionData: {
            commissionType: offerData.commissionType,
            commissionValue,
            commissionBasis: 'subtotal_after_discounts',
          },
        }
      );
      if (response.success) {
        setShowEditOfferModal(false);
        fetchProfile();
      } else {
        setOfferSaveError(response.error ?? 'Failed to update commission.');
      }
    } catch (error) {
      console.error('Failed to save offer:', error);
      setOfferSaveError('Failed to update commission. Please try again.');
    } finally {
      setSavingOffer(false);
    }
  };

  const handleRemoveAffiliate = async () => {
    if (!confirm('Are you sure you want to remove this affiliate? This action cannot be undone.')) return;

    try {
      // API call would go here
      await apiClient.put(`/creators/${affiliateId}/reject`);
      router.push('/dashboard/creators');
    } catch (error) {
      console.error('Failed to remove affiliate:', error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-[#EAC312]"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!affiliate) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
          <div className="mt-8 text-center text-gray-500">
            Affiliate not found
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Go Back
          </button>
          <span className="text-sm text-gray-500">
            Last refreshed: {mounted ? getCurrentTime() : '11:56 AM'}
          </span>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Affiliate Info */}
          <div className="col-span-3">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              {/* Avatar */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Users className="h-8 w-8 text-yellow-600" />
                </div>
              </div>

              {/* Name */}
              <h2 className="text-xl font-semibold text-gray-900 text-center mb-6">
                {affiliate.name}
              </h2>

              {/* Info Fields */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500">Name</label>
                  <p className="text-sm text-gray-900">{affiliate.name}</p>
                </div>

                <div>
                  <label className="text-xs text-gray-500">Phone Number</label>
                  <p className="text-sm text-gray-900">{affiliate.phoneNumber}</p>
                </div>

                <div>
                  <label className="text-xs text-gray-500">Email</label>
                  <p className="text-sm text-gray-900">{affiliate.email}</p>
                </div>

                <div>
                  <label className="text-xs text-gray-500">Status</label>
                  <div className="mt-1">
                    {affiliate.approved === 'approved' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                    {affiliate.approved === 'pending' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    )}
                    {affiliate.approved === 'rejected' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Rejected
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500">Social media</label>
                  <div className="mt-1 flex items-center gap-2">
                    {affiliate.socialMediaHandles?.some(s => s.platform.toLowerCase() === 'instagram') && (
                      <div className="w-7 h-7 rounded border border-blue-200 flex items-center justify-center">
                        <Instagram className="h-4 w-4 text-blue-500" />
                      </div>
                    )}
                    {(!affiliate.socialMediaHandles || affiliate.socialMediaHandles.length === 0) && (
                      <div className="w-7 h-7 rounded border border-blue-200 flex items-center justify-center">
                        <Instagram className="h-4 w-4 text-blue-500" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="col-span-9 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                  <DollarSign className="h-4 w-4" />
                  <span>Total Revenue</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-semibold text-gray-900">
                    ₹{(affiliate?.totalSales ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                  <ShoppingCart className="h-4 w-4" />
                  <span>Total Orders</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-semibold text-gray-900">
                    {(affiliate?.totalOrders ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                  <Wallet className="h-4 w-4" />
                  <span>Total Commission</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-semibold text-gray-900">
                    ₹{(affiliate?.totalCommission ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Offer Setup */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-medium text-gray-900">Offer setup</h3>
                <button
                  onClick={() => { setOfferSaveError(null); setShowEditOfferModal(true); }}
                  className="px-4 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800"
                >
                  Edit Offer
                </button>
              </div>

              {/* Coupons Section */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <h4 className="text-sm font-medium text-gray-700">Coupons</h4>
                  <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                    {coupons.length} {coupons.length === 1 ? 'coupon' : 'coupons'}
                  </span>
                </div>

                {coupons.length > 0 ? (
                  <div className="space-y-4">
                    {coupons.map((coupon) => (
                      <div key={coupon.id} className="border border-gray-200 rounded-xl p-5 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-semibold text-gray-900 font-mono tracking-wide">
                                {coupon.code}
                              </span>
                              <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${coupon.status === 'ACTIVE'
                                  ? 'bg-green-100 text-green-700'
                                  : coupon.status === 'EXPIRED'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                {coupon.status}
                              </span>
                            </div>
                            {coupon.title && (
                              <p className="text-sm text-gray-500 mt-1">{coupon.title}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {/* Discount */}
                          <div className="bg-white border border-gray-100 rounded-lg p-3">
                            <label className="text-xs text-gray-500 block mb-1">Customer Discount</label>
                            <p className="text-base font-semibold text-gray-900">
                              {coupon.value.type === 'percentage'
                                ? `${coupon.value.percentage}%`
                                : `₹${coupon.value.amount?.toLocaleString('en-IN') ?? 0}`}
                            </p>
                          </div>

                          {/* Commission */}
                          <div className="bg-white border border-gray-100 rounded-lg p-3">
                            <label className="text-xs text-gray-500 block mb-1">Creator Commission</label>
                            <p className="text-base font-semibold text-green-600">
                              {coupon.commissionType === 'percentage'
                                ? `${coupon.commissionValue}%`
                                : `₹${parseFloat(coupon.commissionValue).toLocaleString('en-IN')}`}
                            </p>
                          </div>

                          {/* Commission Basis */}
                          <div className="bg-white border border-gray-100 rounded-lg p-3">
                            <label className="text-xs text-gray-500 block mb-1">Commission Basis</label>
                            <p className="text-sm font-medium text-gray-700">
                              {coupon.commissionBasis === 'subtotal_after_discounts'
                                ? 'After Discounts'
                                : coupon.commissionBasis === 'subtotal_before_discounts'
                                  ? 'Before Discounts'
                                  : 'Order Total'}
                            </p>
                          </div>

                          {/* Validity */}
                          <div className="bg-white border border-gray-100 rounded-lg p-3">
                            <label className="text-xs text-gray-500 block mb-1">Validity</label>
                            <p className="text-sm font-medium text-gray-700">
                              {coupon.endsAt
                                ? `Until ${new Date(coupon.endsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                                : 'No expiry'}
                            </p>
                          </div>
                        </div>

                        {coupon.description && (
                          <p className="text-xs text-gray-500 mt-3 italic">{coupon.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center">
                    <p className="text-sm text-gray-500">No coupons assigned yet</p>
                  </div>
                )}
              </div>

              {/* Referral Link Commission Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <h4 className="text-sm font-medium text-gray-700">Referral Link Commission</h4>
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-full">
                    Link-only orders
                  </span>
                </div>

                <p className="text-xs text-gray-500 mb-4">
                  Commission earned when customers order through the creator&apos;s referral link without using any coupon code.
                </p>

                {referralLink ? (
                  <div className="border border-gray-200 rounded-xl p-5 bg-gradient-to-r from-blue-50/50 to-white">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-semibold text-gray-900 font-mono tracking-wide">
                            {referralLink.referralCode}
                          </span>
                          <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${referralLink.active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                            }`}>
                            {referralLink.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Referral Code</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {/* Default Commission */}
                      <div className="bg-white border border-gray-100 rounded-lg p-3">
                        <label className="text-xs text-gray-500 block mb-1">Link Commission</label>
                        <p className="text-base font-semibold text-blue-600">
                          {referralLink.defaultCommissionType === 'percentage'
                            ? `${referralLink.defaultCommissionValue}%`
                            : `₹${parseFloat(referralLink.defaultCommissionValue).toLocaleString('en-IN')}`}
                        </p>
                      </div>

                      {/* Commission Basis */}
                      <div className="bg-white border border-gray-100 rounded-lg p-3">
                        <label className="text-xs text-gray-500 block mb-1">Commission Basis</label>
                        <p className="text-sm font-medium text-gray-700">
                          {referralLink.commissionBasis === 'subtotal_after_discounts'
                            ? 'After Discounts'
                            : referralLink.commissionBasis === 'subtotal_before_discounts'
                              ? 'Before Discounts'
                              : 'Order Total'}
                        </p>
                      </div>

                      {/* Created Date */}
                      <div className="bg-white border border-gray-100 rounded-lg p-3">
                        <label className="text-xs text-gray-500 block mb-1">Created</label>
                        <p className="text-sm font-medium text-gray-700">
                          {new Date(referralLink.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center">
                    <p className="text-sm text-gray-500">No referral link configured</p>
                  </div>
                )}
              </div>
            </div>

            {/* Featured Collections */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-base font-medium text-gray-900 mb-4">Featured Collections</h3>

              <div className="space-y-3">
                {collections.map((collection) => (
                  <div key={collection.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{collection.name}</p>
                      <p className="text-xs text-gray-500">{collection.url}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveCollection(collection.id)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowAddCollectionModal(true)}
                className="flex items-center gap-2 mt-4 text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add New
              </button>
            </div>

            {/* Featured Products */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-base font-medium text-gray-900 mb-4">Featured Products</h3>

              <div className="grid grid-cols-3 gap-4">
                {products.map((product) => (
                  <div key={product.id} className="group">
                    <div className="aspect-square bg-gray-100 rounded-xl mb-3 overflow-hidden relative">
                      <div className="w-full h-full flex items-center justify-center">
                        <img
                          src="/api/placeholder/200/200"
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <button
                        onClick={() => handleRemoveProduct(product.id)}
                        className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-medium text-gray-900">₹{product.price}</span>
                      {product.originalPrice && product.originalPrice !== product.price && (
                        <span className="text-xs text-gray-500 line-through">₹{product.originalPrice}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowAddProductModal(true)}
                className="flex items-center gap-2 mt-4 text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add New
              </button>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-center gap-4">
                <span className="text-sm text-gray-500">Danger Zone</span>
                <button
                  onClick={handleRemoveAffiliate}
                  className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                >
                  Remove Affiliate
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Offer Modal */}
      {showEditOfferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Edit Offer</h2>
              <button
                onClick={() => setShowEditOfferModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Discount Code</label>
                <input
                  type="text"
                  value={offerData.discountCode}
                  onChange={(e) => setOfferData({ ...offerData, discountCode: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Discount Amount</label>
                <input
                  type="text"
                  value={offerData.discountAmount}
                  onChange={(e) => setOfferData({ ...offerData, discountAmount: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Commission Type</label>
                <select
                  value={offerData.commissionType}
                  onChange={(e) => setOfferData({ ...offerData, commissionType: e.target.value as 'percentage' | 'fixed' })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed amount</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commission {offerData.commissionType === 'percentage' ? '(%)' : '(₹)'}
                </label>
                <input
                  type="text"
                  value={offerData.commissionAmount}
                  onChange={(e) => {
                    setOfferData({ ...offerData, commissionAmount: e.target.value });
                    setOfferSaveError(null);
                  }}
                  placeholder={offerData.commissionType === 'percentage' ? 'e.g. 12' : 'e.g. 500'}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              {offerSaveError && (
                <p className="text-sm text-red-600">{offerSaveError}</p>
              )}
            </div>

            <button
              onClick={handleSaveOffer}
              disabled={savingOffer}
              className="w-full mt-6 py-3 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingOffer ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Add Collection Modal */}
      {showAddCollectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Add Collection</h2>
              <button
                onClick={() => setShowAddCollectionModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Collection Name</label>
                <input
                  type="text"
                  placeholder="Car comfort collections"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Collection URL</label>
                <input
                  type="text"
                  placeholder="https://myfrido.com"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
            </div>

            <button
              onClick={() => {
                setCollections([...collections, { id: Date.now().toString(), name: 'New Collection', url: 'https://myfrido.com' }]);
                setShowAddCollectionModal(false);
              }}
              className="w-full mt-6 py-3 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800"
            >
              Add Collection
            </button>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Add Product</h2>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                <input
                  type="text"
                  placeholder="Product Name Goes Here"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                  <input
                    type="number"
                    placeholder="2599"
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Original Price</label>
                  <input
                    type="number"
                    placeholder="2599"
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setProducts([...products, { id: Date.now().toString(), name: 'New Product', price: 2599, originalPrice: 2599, image: '' }]);
                setShowAddProductModal(false);
              }}
              className="w-full mt-6 py-3 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800"
            >
              Add Product
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

