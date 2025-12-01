// Core domain types
export type CreatorStatus = 'pending' | 'approved' | 'rejected';
export type CouponType = 'percentage' | 'fixed_amount' | 'free_shipping';
export type CouponRequestStatus = 'pending' | 'approved' | 'rejected';

// Auth types
export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  createdAt: number;
  idToken?: string;  // Optional - only present in backend response, never stored in context
  refreshToken?: string;  // Optional - only present in backend response, never stored in context
}

export interface LoginResponse {
  adminProfile: AdminProfile;
}

export interface SocialMediaHandle {
  platform: string;
  handle: string;
}

export interface Creator {
  id: string;
  name: string;
  phoneNumber: string;
  email: string;
  createdAt: number;
  approved: CreatorStatus;
  socialMediaHandles: SocialMediaHandle[];
  phoneNumberVerified: boolean;
  bio?: string;
  profileImage?: string;
  updatedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface Coupon {
  id: string;
  code: string;
  creatorId: string;
  creatorName: string;
  type: CouponType;
  value: number;
  currencyCode?: string; // Currency code for fixed_amount coupons (e.g., 'INR', 'USD')
  title?: string;
  description?: string;
  usageCount: number;
  usageLimit?: number;
  validFrom: string;
  validTo?: string;
  minimumSpend?: number;
  active: boolean;
  requestStatus?: CouponRequestStatus; // For creator-requested coupons
  createdAt: string;
  updatedAt: string;
}

// External API Coupon Response Type
export interface ExternalCouponValue {
  type: 'percentage' | 'fixed_amount' | 'amount';
  percentage?: number;
  amount?: number | string;
  currencyCode?: string;
  appliesOnEachItem?: boolean;
}

export interface ExternalCoupon {
  id: string;
  shopifyId: string;
  title: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  startsAt: string;
  endsAt: string;
  value: ExternalCouponValue;
  usageLimit: number;
  usesPerOrderLimit: number;
  itemsSelection: Record<string, any>;
  createdBy: string;
  approvedBy: string;
  approvedAt: number;
  description: string;
  createdAt: number;
  updatedAt: number;
  usageCount: number;
}

export interface ExternalCouponsResponse {
  coupons: ExternalCoupon[];
}

export interface CouponConfig {
  id: string;
  name: string;
  description?: string;
  settings: {
    type: CouponType;
    value: number;
    minimumSpend?: number;
    usageLimit?: number;
    validFrom?: string;
    validTo?: string;
  };
  createdAt: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCreators: number;
  activeCreators: number;
  pendingCreators: number;
  totalCoupons: number;
  activeCoupons: number;
  conversionRate: number;
  averageOrderValue: number;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Filter types
export interface CreatorFilters {
  approved?: CreatorStatus;
  phoneNumberVerified?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'createdAt' | 'email' | 'phoneNumber';
  sortDirection?: 'asc' | 'desc';
}

export interface CreatorsResponse {
  items: Creator[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  appliedFilters: {
    approved?: CreatorStatus;
    phoneNumberVerified?: boolean;
  };
  appliedSort: {
    by: string;
    direction: 'asc' | 'desc';
  };
}

export interface CouponFilters {
  creatorId?: string;
  active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'code' | 'createdAt' | 'usageCount';
  sortOrder?: 'asc' | 'desc';
}

export interface DashboardFilters {
  startDate: string;
  endDate: string;
}

// Order types
export type PaymentStatus = 'paid' | 'pending' | 'refunded' | 'partially_refunded';
export type AttributionType = 'coupon' | 'referral' | 'pixel';
export type CommissionBasis = 'subtotal_after_discounts' | 'subtotal' | 'total';
export type CommissionRateType = 'percentage' | 'fixed';
export type CommissionSource = 'coupon' | 'referral' | 'pixel';

export interface CommissionData {
  commissionType: 'fixed' | 'percentage';
  commissionValue: number;
  commissionBasis: CommissionBasis;
}

export interface OrderLineItem {
  id?: string;
  productId?: string;
  title?: string;
  quantity?: number;
  price?: string;
  [key: string]: any;
}

export interface Order {
  id: string;
  orderId: string;
  orderNumber: string;
  pixelEventId?: string;
  customerId: string;
  customerEmail: string;
  currencyCode: string;
  subtotalAmount: string;
  shippingAmount: string;
  taxAmount: string;
  totalAmount: string;
  discountsTotal: string;
  lineItems: OrderLineItem[];
  referralCode?: string;
  appliedCoupons: string[];
  attributedCreatorId?: string;
  attributionType?: AttributionType;
  attributedCouponCode?: string;
  commissionBasis?: CommissionBasis;
  commissionRateType?: CommissionRateType;
  commissionRateValue?: string;
  commissionAmount?: string;
  commissionCurrency?: string;
  commissionSource?: CommissionSource;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  refundedAmount?: string;
  refundReason?: string;
  rawEvent?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface OrderFilters {
  paymentStatus?: PaymentStatus;
  orderNumber?: string;
}

export interface OrderSort {
  by: 'createdAt' | 'totalAmount' | 'orderNumber' | 'paymentStatus';
  direction: 'asc' | 'desc';
}

export interface OrderRequest {
  page: number;
  pageSize: number;
  filters?: OrderFilters;
  sort?: OrderSort;
}

export interface OrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Product Collection types
export interface ProductCollection {
  id: string;
  name: string;
  handle: string;
  description?: string;
  productIds: string[];
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export interface ProductCollectionsResponse {
  productCollections: ProductCollection[];
}

// Shopify Product types
export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
  productType: string;
  images: string[];
  vendor?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShopifyProductsResponse {
  products: ShopifyProduct[];
}

