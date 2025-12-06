/**
 * API Types for Frido Affiliate CRM
 * 
 * This file contains all the request/response types for the API endpoints.
 * Use these types when implementing backend APIs or updating frontend code.
 */

// ============================================
// Common Types & Enums
// ============================================

export type CreatorStatus = 'pending' | 'approved' | 'rejected';
export type OrderStatus = 'delivered' | 'cancelled' | 'in_transit' | 'returned' | 'processing';
export type PayoutStatus = 'self_referral' | 'cancelled' | 'days_left' | 'completed' | 'pending';
export type SocialPlatform = 'instagram' | 'youtube' | 'facebook' | 'twitter' | 'linkedin';
export type DiscountType = 'percentage' | 'fixed';
export type CommissionType = 'percentage' | 'fixed';
export type CommissionBasis = 'subtotal_after_discounts' | 'subtotal' | 'total';
export type AffiliateTab = 'current' | 'pending' | 'managers';
export type OrderTab = 'all' | 'payout_pending' | 'payout_done';

export interface SocialMediaHandle {
  platform: SocialPlatform;
  handle: string;
  url?: string;
  followersCount?: number;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================
// Dashboard API Types
// ============================================

export interface DashboardStatsRequest {
  startDate?: string;
  endDate?: string;
  period?: '7days' | '30days' | '90days' | 'custom';
}

export interface TopStats {
  totalRevenue: number;
  totalRevenueChange: number;
  totalOrders: number;
  totalOrdersChange: number;
  sessions: number;
  sessionsChange: number;
  activeAffiliates: number;
  activeAffiliatesChange: number;
}

export interface SalesByChannel {
  name: string;
  value: number;
  percentage: number;
}

export interface SalesByProduct {
  id: string;
  name: string;
  value: number;
  percentage: number;
  image?: string;
}

export interface ConversionRateData {
  rate: number;
  change: number;
  chartData: Array<{
    date: string;
    value: number;
    isProjected?: boolean;
  }>;
}

export interface SalesBreakdown {
  grossSales: number;
  grossSalesChange: number;
  orders: number;
  ordersChange: number;
  discounts: number;
  discountsChange: number;
  payouts: number;
  payoutsChange: number;
  returns: number;
  returnsChange: number | null;
  taxes: number;
  taxesChange: number;
  totalSales: number;
  totalSalesChange: number;
}

export interface TopAffiliate {
  id: string;
  name: string;
  value: number;
  percentage: number;
}

export interface TopManager {
  id: string;
  name: string;
  value: number;
  percentage: number;
}

export interface DashboardStatsData {
  topStats: TopStats;
  salesByChannel: SalesByChannel[];
  salesByProduct: SalesByProduct[];
  conversionRate: ConversionRateData;
  salesBreakdown: SalesBreakdown;
  topAffiliates: TopAffiliate[];
  topManagers: TopManager[];
}

export type DashboardStatsResponse = ApiResponse<DashboardStatsData>;

// ============================================
// Affiliates API Types
// ============================================

export interface AffiliatesListRequest {
  page: number;
  pageSize: number;
  tab: AffiliateTab;
  filters?: {
    search?: string;
    status?: CreatorStatus;
    managerId?: string;
  };
  sort?: {
    by: 'name' | 'createdAt' | 'totalSales' | 'email';
    direction: 'asc' | 'desc';
  };
}

// Current Affiliates (Approved)
export interface CurrentAffiliate {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  socialMediaHandles: SocialMediaHandle[];
  managedBy: string;
  managerName: string;
  discountCode: string;
  discountPercent: number;
  reward: number;
  totalSales: number;
  totalOrders: number;
  totalCommission: number;
  status: 'approved';
  createdAt: number;
  approvedAt?: number;
}

export interface CurrentAffiliatesData {
  items: CurrentAffiliate[];
  pagination: Pagination;
}

export type CurrentAffiliatesResponse = ApiResponse<CurrentAffiliatesData>;

// Pending Affiliates
export interface PendingAffiliate {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  socialMediaHandles: SocialMediaHandle[];
  managedBy?: string;
  managerName?: string;
  status: 'pending' | 'rejected';
  createdAt: number;
  rejectedAt?: number;
  rejectedReason?: string;
}

export interface PendingAffiliatesData {
  items: PendingAffiliate[];
  pagination: Pagination;
}

export type PendingAffiliatesResponse = ApiResponse<PendingAffiliatesData>;

// Affiliate Managers
export interface AffiliateManager {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalAffiliates: number;
  totalSales: number;
  createdAt: number;
}

export interface AffiliateManagersData {
  items: AffiliateManager[];
  pagination: Pagination;
}

export type AffiliateManagersResponse = ApiResponse<AffiliateManagersData>;

// Invite Affiliate
export interface InviteAffiliateRequest {
  name: string;
  phoneNumber: string;
  email: string;
  discountPercent: number;
  discountType: DiscountType;
  commissionPercent: number;
  commissionType: CommissionType;
  minOrderValue?: number;
  discountCode: string;
  invitedBy: string;
}

export interface InviteAffiliateData {
  id: string;
  inviteLink?: string;
}

export type InviteAffiliateResponse = ApiResponse<InviteAffiliateData>;

// Accept Affiliate
export interface AcceptAffiliateRequest {
  discountPercent: number;
  discountType: DiscountType;
  commissionPercent: number;
  commissionType: CommissionType;
  minOrderValue?: number;
  discountCode: string;
}

export type AcceptAffiliateResponse = ApiResponse<null>;

// Reject Affiliate
export interface RejectAffiliateRequest {
  reason?: string;
}

export type RejectAffiliateResponse = ApiResponse<null>;

// Affiliate Profile
export interface FeaturedCollection {
  id: string;
  name: string;
  url: string;
}

export interface FeaturedProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
}

export interface AffiliateProfile {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  status: CreatorStatus;
  socialMediaHandles: SocialMediaHandle[];
  
  // Stats
  totalRevenue: number;
  totalRevenueChange: number;
  totalOrders: number;
  totalOrdersChange: number;
  totalCommission: number;
  totalCommissionChange: number;
  
  // Offer Setup
  discountCode: string;
  discountAmount: string;
  commissionAmount: string;
  
  // Featured Items
  featuredCollections: FeaturedCollection[];
  featuredProducts: FeaturedProduct[];
  
  // Meta
  managedBy?: string;
  managerName?: string;
  createdAt: number;
  approvedAt?: number;
  approvedBy?: string;
}

export type AffiliateProfileResponse = ApiResponse<AffiliateProfile>;

// Update Offer
export interface UpdateOfferRequest {
  discountCode: string;
  discountAmount: string;
  commissionAmount: string;
}

// Update Collections
export interface UpdateCollectionsRequest {
  collections: FeaturedCollection[];
}

// Update Products
export interface UpdateProductsRequest {
  productIds: string[];
}

// ============================================
// Orders API Types
// ============================================

export interface OrdersListRequest {
  page: number;
  pageSize: number;
  tab: OrderTab;
  filters?: {
    search?: string;
    orderStatus?: OrderStatus;
    payoutStatus?: PayoutStatus;
    dateFrom?: string;
    dateTo?: string;
    affiliateId?: string;
  };
  sort?: {
    by: 'createdAt' | 'totalAmount' | 'orderNumber';
    direction: 'asc' | 'desc';
  };
}

export interface OrderItem {
  id: string;
  orderNumber: string;
  orderId: string;
  
  // Order Info
  orderDate: number;
  orderStatus: OrderStatus;
  
  // Customer Info
  customerId: string;
  customerName: string;
  customerEmail: string;
  
  // Discount Info
  discountCode: string;
  discountAmount: number;
  
  // Financial
  subtotalAmount: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  currencyCode: string;
  
  // Commission/Reward
  reward: number;
  rewardCurrency: string;
  
  // Attribution
  affiliateId?: string;
  affiliateName?: string;
  attributionType?: 'coupon' | 'referral' | 'pixel';
  
  // Payout
  payoutStatus: PayoutStatus;
  payoutDaysLeft?: number;
  payoutAmount?: number;
  payoutDate?: number;
  
  // Meta
  createdAt: number;
  updatedAt: number;
}

export interface OrdersListData {
  items: OrderItem[];
  pagination: Pagination;
}

export type OrdersListResponse = ApiResponse<OrdersListData>;

// ============================================
// Mock Data Generators (for development)
// ============================================

/**
 * Generate mock dashboard stats
 */
export function generateMockDashboardStats(): DashboardStatsData {
  return {
    topStats: {
      totalRevenue: 1743245,
      totalRevenueChange: 24,
      totalOrders: 13445,
      totalOrdersChange: 24,
      sessions: 1843445,
      sessionsChange: 24,
      activeAffiliates: 3445,
      activeAffiliatesChange: 24,
    },
    salesByChannel: [
      { name: 'Instagram', value: 3975471, percentage: 24 },
      { name: 'Youtube', value: 3975471, percentage: 24 },
      { name: 'Facebook', value: 3975471, percentage: 24 },
      { name: 'Twitter', value: 3975471, percentage: 24 },
      { name: 'Linkedin', value: 3975471, percentage: 24 },
    ],
    salesByProduct: [
      { id: 'prod_1', name: 'Frido Ultimate Wedge Plus Cushion', value: 39754706.71, percentage: 24 },
      { id: 'prod_2', name: 'Ultimate Car Comfort Bundle', value: 39754706.71, percentage: 24 },
      { id: 'prod_3', name: 'Frido Car Neck Mini Pillow', value: 39754706.71, percentage: 24 },
      { id: 'prod_4', name: 'Frido Travel Neck Pillow', value: 39754706.71, percentage: 24 },
      { id: 'prod_5', name: 'Frido Barefoot Sock Shoe Pro', value: 39754706.71, percentage: 24 },
    ],
    conversionRate: {
      rate: 4.27,
      change: -15,
      chartData: [
        { date: '2025-10-01', value: 3 },
        { date: '2025-10-02', value: 4 },
        { date: '2025-10-03', value: 5 },
        { date: '2025-10-04', value: 6 },
        { date: '2025-10-05', value: 8 },
        { date: '2025-10-06', value: 7, isProjected: true },
        { date: '2025-10-07', value: 6.5, isProjected: true },
        { date: '2025-10-08', value: 7, isProjected: true },
      ],
    },
    salesBreakdown: {
      grossSales: 39754706.71,
      grossSalesChange: 24,
      orders: 754706.71,
      ordersChange: 24,
      discounts: -39754.71,
      discountsChange: 24,
      payouts: -39754.71,
      payoutsChange: 24,
      returns: 0,
      returnsChange: null,
      taxes: 39754.71,
      taxesChange: 24,
      totalSales: 32754706.71,
      totalSalesChange: 24,
    },
    topAffiliates: [
      { id: 'aff_1', name: 'Alister D Silva', value: 39754706.71, percentage: 24 },
      { id: 'aff_2', name: 'Abin Sasidharan', value: 3975471, percentage: 24 },
      { id: 'aff_3', name: 'James Tharakan', value: 3975471, percentage: 24 },
      { id: 'aff_4', name: 'Manmohan', value: 3975471, percentage: 24 },
      { id: 'aff_5', name: 'Saloma Palms', value: 3975471, percentage: 24 },
    ],
    topManagers: [
      { id: 'mgr_1', name: 'Saiyed Abdal', value: 39754706.71, percentage: 24 },
      { id: 'mgr_2', name: 'Gautami Chati', value: 3975471, percentage: 24 },
      { id: 'mgr_3', name: 'Parag Swami', value: 3975471, percentage: 24 },
      { id: 'mgr_4', name: 'Dileep Pakkat', value: 3975471, percentage: 24 },
      { id: 'mgr_5', name: 'Chaitrali Bokil', value: 3975471, percentage: 24 },
    ],
  };
}

/**
 * Generate mock affiliate managers
 */
export function generateMockManagers(): AffiliateManager[] {
  return [
    { id: 'mgr_1', name: 'Abdal', email: 'abdal@myfrido.com', phone: '+91 9876543210', totalAffiliates: 25, totalSales: 3975471, createdAt: Date.now() },
    { id: 'mgr_2', name: 'Gautami Chati', email: 'gautami@myfrido.com', phone: '+91 9876543211', totalAffiliates: 18, totalSales: 2875471, createdAt: Date.now() },
    { id: 'mgr_3', name: 'Parag Swami', email: 'parag@myfrido.com', phone: '+91 9876543212', totalAffiliates: 15, totalSales: 1975471, createdAt: Date.now() },
  ];
}

/**
 * Generate mock order statuses
 */
export function generateMockOrderStatuses(): { orderStatuses: OrderStatus[]; payoutStatuses: PayoutStatus[] } {
  return {
    orderStatuses: ['delivered', 'cancelled', 'delivered', 'delivered', 'delivered', 'delivered', 'delivered', 'in_transit', 'in_transit', 'returned', 'in_transit', 'in_transit'],
    payoutStatuses: ['self_referral', 'cancelled', 'days_left', 'completed', 'completed', 'completed', 'completed', 'days_left', 'days_left', 'cancelled', 'days_left', 'days_left'],
  };
}

