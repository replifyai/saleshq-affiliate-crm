# API Structure Documentation

This document outlines the API endpoints, request payloads, and response structures needed for the Frido Affiliate CRM dashboard.

---

## Table of Contents

1. [Dashboard APIs](#dashboard-apis)
2. [Affiliates APIs](#affiliates-apis)
3. [Orders APIs](#orders-apis)
4. [Common Types](#common-types)

---

## Dashboard APIs

### GET /api/dashboard/stats

Returns dashboard statistics and analytics data.

#### Request

```typescript
// Query Parameters
interface DashboardStatsRequest {
  startDate?: string;  // ISO date string
  endDate?: string;    // ISO date string
  period?: '7days' | '30days' | '90days' | 'custom';
}
```

#### Response

```typescript
interface DashboardStatsResponse {
  success: boolean;
  data: {
    // Top Stats Cards
    topStats: {
      totalRevenue: number;           // e.g., 1743245
      totalRevenueChange: number;     // Percentage change, e.g., 24
      totalOrders: number;            // e.g., 13445
      totalOrdersChange: number;      // Percentage change
      sessions: number;               // e.g., 1843445
      sessionsChange: number;         // Percentage change
      activeAffiliates: number;       // e.g., 3445
      activeAffiliatesChange: number; // Percentage change
    };
    
    // Sales by Social Channels
    salesByChannel: Array<{
      name: string;        // 'Instagram' | 'Youtube' | 'Facebook' | 'Twitter' | 'Linkedin'
      value: number;       // Total sales value, e.g., 3975471
      percentage: number;  // Change percentage, e.g., 24
    }>;
    
    // Sales by Product
    salesByProduct: Array<{
      id: string;
      name: string;        // Product name
      value: number;       // Total sales value
      percentage: number;  // Change percentage
      image?: string;      // Product image URL
    }>;
    
    // Referral Conversion Rate
    conversionRate: {
      rate: number;        // e.g., 4.27
      change: number;      // e.g., -15 (negative means decrease)
      chartData: Array<{
        date: string;      // e.g., '2025-10-01'
        value: number;     // Conversion rate for that day
        isProjected?: boolean;  // true for future/projected data
      }>;
    };
    
    // Sales Breakdown
    salesBreakdown: {
      grossSales: number;
      grossSalesChange: number;
      orders: number;
      ordersChange: number;
      discounts: number;          // Negative value
      discountsChange: number;
      payouts: number;            // Negative value
      payoutsChange: number;
      returns: number;
      returnsChange: number | null;  // null if no change data
      taxes: number;
      taxesChange: number;
      totalSales: number;
      totalSalesChange: number;
    };
    
    // Top 5 Affiliates
    topAffiliates: Array<{
      id: string;
      name: string;
      value: number;       // Total sales
      percentage: number;  // Change percentage
    }>;
    
    // Top 5 Affiliate Managers
    topManagers: Array<{
      id: string;
      name: string;
      value: number;       // Total sales
      percentage: number;  // Change percentage
    }>;
  };
}
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "topStats": {
      "totalRevenue": 1743245,
      "totalRevenueChange": 24,
      "totalOrders": 13445,
      "totalOrdersChange": 24,
      "sessions": 1843445,
      "sessionsChange": 24,
      "activeAffiliates": 3445,
      "activeAffiliatesChange": 24
    },
    "salesByChannel": [
      { "name": "Instagram", "value": 3975471, "percentage": 24 },
      { "name": "Youtube", "value": 3975471, "percentage": 24 },
      { "name": "Facebook", "value": 3975471, "percentage": 24 },
      { "name": "Twitter", "value": 3975471, "percentage": 24 },
      { "name": "Linkedin", "value": 3975471, "percentage": 24 }
    ],
    "salesByProduct": [
      { "id": "prod_1", "name": "Frido Ultimate Wedge Plus Cushion", "value": 39754706.71, "percentage": 24, "image": "https://..." },
      { "id": "prod_2", "name": "Ultimate Car Comfort Bundle", "value": 39754706.71, "percentage": 24, "image": "https://..." }
    ],
    "conversionRate": {
      "rate": 4.27,
      "change": -15,
      "chartData": [
        { "date": "2025-10-01", "value": 3 },
        { "date": "2025-10-02", "value": 4 },
        { "date": "2025-10-03", "value": 5 },
        { "date": "2025-10-04", "value": 6 },
        { "date": "2025-10-05", "value": 8 },
        { "date": "2025-10-06", "value": 7, "isProjected": true },
        { "date": "2025-10-07", "value": 6.5, "isProjected": true },
        { "date": "2025-10-08", "value": 7, "isProjected": true }
      ]
    },
    "salesBreakdown": {
      "grossSales": 39754706.71,
      "grossSalesChange": 24,
      "orders": 754706.71,
      "ordersChange": 24,
      "discounts": -39754.71,
      "discountsChange": 24,
      "payouts": -39754.71,
      "payoutsChange": 24,
      "returns": 0,
      "returnsChange": null,
      "taxes": 39754.71,
      "taxesChange": 24,
      "totalSales": 32754706.71,
      "totalSalesChange": 24
    },
    "topAffiliates": [
      { "id": "aff_1", "name": "Alister D Silva", "value": 39754706.71, "percentage": 24 },
      { "id": "aff_2", "name": "Abin Sasidharan", "value": 3975471, "percentage": 24 }
    ],
    "topManagers": [
      { "id": "mgr_1", "name": "Saiyed Abdal", "value": 39754706.71, "percentage": 24 },
      { "id": "mgr_2", "name": "Gautami Chati", "value": 3975471, "percentage": 24 }
    ]
  }
}
```

---

## Affiliates APIs

### POST /api/affiliates/list

Returns paginated list of affiliates with optional filters.

#### Request

```typescript
interface AffiliatesListRequest {
  page: number;           // e.g., 1
  pageSize: number;       // e.g., 20
  tab: 'current' | 'pending' | 'managers';
  filters?: {
    search?: string;      // Search by name, email, phone
    status?: 'approved' | 'pending' | 'rejected';
    managerId?: string;   // Filter by manager
  };
  sort?: {
    by: 'name' | 'createdAt' | 'totalSales' | 'email';
    direction: 'asc' | 'desc';
  };
}
```

#### Response (Current Affiliates Tab)

```typescript
interface CurrentAffiliatesResponse {
  success: boolean;
  data: {
    items: Array<{
      id: string;
      name: string;
      email: string;
      phoneNumber: string;
      socialMediaHandles: Array<{
        platform: 'instagram' | 'youtube' | 'facebook' | 'twitter' | 'linkedin';
        handle: string;
        url?: string;
      }>;
      managedBy: string;           // Manager ID
      managerName: string;         // Manager name for display
      discountCode: string;        // e.g., 'SUJAL'
      discountPercent: number;     // e.g., 10
      reward: number;              // Commission percentage, e.g., 10
      totalSales: number;          // e.g., 8744.00
      totalOrders: number;
      totalCommission: number;
      status: 'approved';
      createdAt: number;           // Unix timestamp
      approvedAt?: number;
    }>;
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}
```

#### Response (Pending Tab)

```typescript
interface PendingAffiliatesResponse {
  success: boolean;
  data: {
    items: Array<{
      id: string;
      name: string;
      email: string;
      phoneNumber: string;
      socialMediaHandles: Array<{
        platform: string;
        handle: string;
      }>;
      managedBy?: string;
      managerName?: string;
      status: 'pending' | 'rejected';
      createdAt: number;
      rejectedAt?: number;
      rejectedReason?: string;
    }>;
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}
```

#### Response (Managers Tab)

```typescript
interface AffiliateManagersResponse {
  success: boolean;
  data: {
    items: Array<{
      id: string;
      name: string;
      email: string;
      phone: string;
      totalAffiliates: number;
      totalSales: number;
      createdAt: number;
    }>;
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
}
```

### POST /api/affiliates/invite

Invite a new affiliate.

#### Request

```typescript
interface InviteAffiliateRequest {
  name: string;
  phoneNumber: string;          // e.g., '+91 6292937901'
  email: string;
  discountPercent: number;      // e.g., 10
  discountType: 'percentage' | 'fixed';
  commissionPercent: number;    // e.g., 10
  commissionType: 'percentage' | 'fixed';
  minOrderValue?: number;       // e.g., 500
  discountCode: string;         // e.g., 'AROMAL'
  invitedBy: string;            // Manager name or ID
}
```

#### Response

```typescript
interface InviteAffiliateResponse {
  success: boolean;
  data?: {
    id: string;
    inviteLink?: string;
  };
  message?: string;
  error?: string;
}
```

### PUT /api/affiliates/:id/accept

Accept a pending affiliate.

#### Request

```typescript
interface AcceptAffiliateRequest {
  discountPercent: number;
  discountType: 'percentage' | 'fixed';
  commissionPercent: number;
  commissionType: 'percentage' | 'fixed';
  minOrderValue?: number;
  discountCode: string;
}
```

#### Response

```typescript
interface AcceptAffiliateResponse {
  success: boolean;
  message?: string;
  error?: string;
}
```

### PUT /api/affiliates/:id/reject

Reject a pending affiliate.

#### Request

```typescript
interface RejectAffiliateRequest {
  reason?: string;
}
```

#### Response

```typescript
interface RejectAffiliateResponse {
  success: boolean;
  message?: string;
  error?: string;
}
```

### GET /api/affiliates/:id

Get affiliate profile details.

#### Response

```typescript
interface AffiliateProfileResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    status: 'approved' | 'pending' | 'rejected';
    socialMediaHandles: Array<{
      platform: string;
      handle: string;
      url?: string;
    }>;
    
    // Stats
    totalRevenue: number;
    totalRevenueChange: number;
    totalOrders: number;
    totalOrdersChange: number;
    totalCommission: number;
    totalCommissionChange: number;
    
    // Offer Setup
    discountCode: string;
    discountAmount: string;       // e.g., '10%' or '₹100'
    commissionAmount: string;     // e.g., '10%'
    
    // Featured Collections
    featuredCollections: Array<{
      id: string;
      name: string;
      url: string;
    }>;
    
    // Featured Products
    featuredProducts: Array<{
      id: string;
      name: string;
      price: number;
      originalPrice?: number;
      image: string;
    }>;
    
    // Meta
    managedBy?: string;
    managerName?: string;
    createdAt: number;
    approvedAt?: number;
    approvedBy?: string;
  };
}
```

### PUT /api/affiliates/:id/offer

Update affiliate offer settings.

#### Request

```typescript
interface UpdateOfferRequest {
  discountCode: string;
  discountAmount: string;      // e.g., '10%'
  commissionAmount: string;    // e.g., '10%'
}
```

### PUT /api/affiliates/:id/collections

Update affiliate featured collections.

#### Request

```typescript
interface UpdateCollectionsRequest {
  collections: Array<{
    id: string;
    name: string;
    url: string;
  }>;
}
```

### PUT /api/affiliates/:id/products

Update affiliate featured products.

#### Request

```typescript
interface UpdateProductsRequest {
  productIds: string[];
}
```

---

## Orders APIs

### POST /api/orders/list

Returns paginated list of orders.

#### Request

```typescript
interface OrdersListRequest {
  page: number;
  pageSize: number;
  tab: 'all' | 'payout_pending' | 'payout_done';
  filters?: {
    search?: string;           // Search by order ID, customer name
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
```

#### Response

```typescript
type OrderStatus = 'delivered' | 'cancelled' | 'in_transit' | 'returned' | 'processing';
type PayoutStatus = 'self_referral' | 'cancelled' | 'days_left' | 'completed' | 'pending';

interface OrdersListResponse {
  success: boolean;
  data: {
    items: Array<{
      id: string;
      orderNumber: string;        // e.g., 'MF123456789012'
      orderId: string;
      
      // Order Info
      orderDate: number;          // Unix timestamp
      orderStatus: OrderStatus;
      
      // Customer Info
      customerId: string;
      customerName: string;       // e.g., 'Aromal Sula'
      customerEmail: string;
      
      // Discount Info
      discountCode: string;       // e.g., 'SUJAL'
      discountAmount: number;
      
      // Financial
      subtotalAmount: number;
      shippingAmount: number;
      taxAmount: number;
      totalAmount: number;        // e.g., 32398.20
      currencyCode: string;       // e.g., 'INR'
      
      // Commission/Reward
      reward: number;             // e.g., 2454.90
      rewardCurrency: string;
      
      // Attribution
      affiliateId?: string;
      affiliateName?: string;
      attributionType?: 'coupon' | 'referral' | 'pixel';
      
      // Payout
      payoutStatus: PayoutStatus;
      payoutDaysLeft?: number;    // Only when payoutStatus is 'days_left'
      payoutAmount?: number;
      payoutDate?: number;
      
      // Meta
      createdAt: number;
      updatedAt: number;
    }>;
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "order_1",
        "orderNumber": "MF123456789012",
        "orderId": "gid://shopify/Order/123456",
        "orderDate": 1724400000000,
        "orderStatus": "delivered",
        "customerId": "cust_1",
        "customerName": "Aromal Sula",
        "customerEmail": "aromal@gmail.com",
        "discountCode": "SUJAL",
        "discountAmount": 3239.82,
        "subtotalAmount": 35638.02,
        "shippingAmount": 0,
        "taxAmount": 0,
        "totalAmount": 32398.20,
        "currencyCode": "INR",
        "reward": 2454.90,
        "rewardCurrency": "INR",
        "affiliateId": "aff_1",
        "affiliateName": "Sujal",
        "attributionType": "coupon",
        "payoutStatus": "completed",
        "createdAt": 1724400000000,
        "updatedAt": 1724400000000
      },
      {
        "id": "order_2",
        "orderNumber": "MF123456789013",
        "orderDate": 1724400000000,
        "orderStatus": "in_transit",
        "customerName": "Aromal Sula",
        "discountCode": "SUJAL",
        "totalAmount": 32398.20,
        "currencyCode": "INR",
        "reward": 2454.90,
        "payoutStatus": "days_left",
        "payoutDaysLeft": 7
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

## Common Types

### TypeScript Type Definitions

```typescript
// Enums
type CreatorStatus = 'pending' | 'approved' | 'rejected';
type OrderStatus = 'delivered' | 'cancelled' | 'in_transit' | 'returned' | 'processing';
type PayoutStatus = 'self_referral' | 'cancelled' | 'days_left' | 'completed' | 'pending';
type SocialPlatform = 'instagram' | 'youtube' | 'facebook' | 'twitter' | 'linkedin';
type DiscountType = 'percentage' | 'fixed';
type CommissionType = 'percentage' | 'fixed';
type CommissionBasis = 'subtotal_after_discounts' | 'subtotal' | 'total';

// Common Interfaces
interface SocialMediaHandle {
  platform: SocialPlatform;
  handle: string;
  url?: string;
  followersCount?: number;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Currency formatting note
// All monetary values should be in the smallest unit or as decimal numbers
// Currency code should always be provided
// Frontend will format as per locale (e.g., ₹32,398.20 for INR)
```

---

## Status Codes

| Code | Description |
|------|-------------|
| 200  | Success |
| 400  | Bad Request - Invalid parameters |
| 401  | Unauthorized - Invalid or expired token |
| 403  | Forbidden - Insufficient permissions |
| 404  | Not Found - Resource doesn't exist |
| 500  | Internal Server Error |

---

## Notes for Backend Implementation

1. **Authentication**: All endpoints require `idToken` in cookies or Authorization header
2. **Pagination**: Default pageSize is 20, max is 100
3. **Dates**: Use Unix timestamps (milliseconds) for all date fields
4. **Currency**: Always include currencyCode with monetary values
5. **Changes/Percentages**: Positive = increase, Negative = decrease
6. **Search**: Should search across relevant text fields (name, email, phone, order number)
7. **Sorting**: Default sort is `createdAt` descending

