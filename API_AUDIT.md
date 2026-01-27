# Backend API Audit

This document lists the available backend API endpoints (Next.js API Routes), the response structure, and which fields are currently used by the frontend.

## 1. Creators List
**Endpoint**: `POST /api/creators`
**Backend Mapping**: `/getCreatorsDashboard`

### Response Fields Being Used
*   `data.items[]`
    *   `id`
    *   `name`
    *   `email`
    *   `phoneNumber`
    *   `socialMediaHandles` (platform)
    *   `createdAt`
    *   `approved` (status)
    *   `managedByName` (mapped to `managerName`)
    *   `coupons` (code, discountValue, discountType, commissionValue, commissionType)
    *   `referralLink` (referralCode)
    *   `uniqueReferralCode`
    *   `totalSales`
    *   `totalOrders`
    *   `totalCommission`
*   `data.page`
*   `data.pageSize`
*   `data.total`
*   `data.totalPages`
*   `data.hasNextPage`
*   `data.hasPrevPage`

### Fields Not Being Used
*   `data.items[]`
    *   `bio`
    *   `profileImage`
    *   `approvedAt`
    *   `approvedBy`
    *   `updatedAt`
    *   `phoneNumberVerified`
*   `data.appliedFilters`
*   `data.appliedSort`

### Actual API Response Structure
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "string",
        "name": "string",
        "phoneNumber": "string",
        "email": "string",
        "createdAt": number,
        "approved": "pending" | "approved" | "rejected",
        "socialMediaHandles": [{ "platform": "string", "handle": "string" }],
        "phoneNumberVerified": boolean,
        "bio": "string",
        "profileImage": "string",
        "updatedAt": "string",
        "approvedAt": "string",
        "approvedBy": "string",
        "managedByName": "string",
        "coupons": [
          {
            "code": "string",
            "discountType": "percentage" | "amount",
            "discountValue": number | string,
            "commissionType": "percentage" | "fixed",
            "commissionValue": "string",
            "commissionBasis": "string"
          }
        ],
        "referralLink": {
          "referralCode": "string",
          "commissionType": "string",
          "commissionValue": "string",
          "commissionBasis": "string",
          "active": boolean
        },
        "uniqueReferralCode": "string",
        "totalSales": "string",
        "totalOrders": number,
        "totalCommission": "string"
      }
    ],
    "page": number,
    "pageSize": number,
    "total": number,
    "totalPages": number,
    "hasNextPage": boolean,
    "hasPrevPage": boolean,
    "appliedFilters": {},
    "appliedSort": {}
  }
}
```

---

## 2. Orders List
**Endpoint**: `POST /api/orders`
**Backend Mapping**: `/getOrdersForAdmin`

### Response Fields Being Used
*   `data.data[]`
    *   `id` (or `orderId` / `orderNumber`)
    *   `createdAt`
    *   `customerEmail`
    *   `customerId`
    *   `orderStatus` (and `orderStatusUrl`)
    *   `paymentStatus`
    *   `appliedCoupons` (or `attributedCouponCode`)
    *   `totalAmount`
    *   `commissionAmount`
    *   `subtotalAmount`
    *   `shippingAmount`
    *   `taxAmount`
    *   `discountsTotal`
    *   `paymentMethod`
    *   `refundedAmount`
    *   `refundReason`
    *   `pixelEventId`
    *   `attributedCreatorId`
    *   `referralCode`
    *   `commissionRateValue`
    *   `commissionRateType`
    *   `commissionBasis`
    *   `commissionSource`
    *   `lineItems` (title, quantity, price)
*   `data.meta` (pagination)

### Fields Not Being Used
*   `data.data[]`
    *   `updatedAt`
    *   `currencyCode` (assumed unused or implicit)
    *   `commissionCurrency`
    *   `rawEvent`
    *   `attributionType` (fetched but not explicitly rendered in table, only in modal details if present)

### Actual API Response Structure
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "string",
        "orderId": "string",
        "orderNumber": "string",
        "pixelEventId": "string",
        "customerId": "string",
        "customerEmail": "string",
        "currencyCode": "string",
        "subtotalAmount": "string",
        "shippingAmount": "string",
        "taxAmount": "string",
        "totalAmount": "string",
        "discountsTotal": "string",
        "lineItems": [{ "title": "string", "quantity": number, "price": "string" }],
        "referralCode": "string",
        "appliedCoupons": ["string"],
        "attributedCreatorId": "string",
        "attributionType": "string",
        "attributedCouponCode": "string",
        "commissionBasis": "string",
        "commissionRateType": "string",
        "commissionRateValue": "string",
        "commissionAmount": "string",
        "commissionCurrency": "string",
        "commissionSource": "string",
        "paymentStatus": "paid" | "pending" | "refunded",
        "orderStatus": "string",
        "orderStatusUrl": "string",
        "paymentMethod": "string",
        "refundedAmount": "string",
        "refundReason": "string",
        "rawEvent": {},
        "createdAt": number,
        "updatedAt": number
      }
    ],
    "meta": {
      "currentPage": number,
      "totalPages": number,
      "totalItems": number,
      "itemsPerPage": number
    }
  }
}
```

---

## 3. Coupons List
**Endpoint**: `GET /api/coupons`
**Backend Mapping**: `/getAllCouponsForAdmin`

### Response Fields Being Used
*   `data[]`
    *   `id`
    *   `code`
    *   `creatorName`
    *   `type`
    *   `value`
    *   `currencyCode`
    *   `usageCount`
    *   `usageLimit`
    *   `active`
    *   `createdAt`
    *   `validFrom`
    *   `title`
    *   `description`

### Fields Not Being Used
*   `data[]`
    *   `creatorId` (used for filtering logic but available in object)
    *   `updatedAt`
    *   `minimumSpend`
    *   `validTo`
    *   `requestStatus`

### Actual API Response Structure
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "code": "string",
      "creatorId": "string",
      "creatorName": "string",
      "type": "percentage" | "fixed_amount",
      "value": number,
      "currencyCode": "string",
      "title": "string",
      "description": "string",
      "usageCount": number,
      "usageLimit": number,
      "validFrom": "string",
      "validTo": "string",
      "minimumSpend": number,
      "active": boolean,
      "requestStatus": "pending" | "approved" | "rejected",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ]
}
```

---

## 4. Dashboard Stats
**Endpoint**: `GET /api/dashboard/stats`
**Backend Mapping**: `/getAnalytics`

### Response Fields Being Used
*   `data.totalRevenue`
*   `data.totalOrders`
*   `data.totalCommissions`
*   `data.totalActiveAffiliates`
*   `data.salesBySocialChannel`
*   `data.salesByProduct` (qty, sales, name)
*   `data.conversionRate`
*   `data.salesBreakdown` (grossSales, discounts, taxes, returns, payouts, commissions, totalSales)
*   `data.topAffiliates` (id, name, orders, revenue, commission)
*   `data.topManagers` (used in UI but currently empty from backend default)

### Fields Not Being Used
*   `data.totalCreators` (Hardcoded to 0)
*   `data.activeCreators` (Hardcoded to 0)
*   `data.pendingCreators` (Hardcoded to 0)
*   `data.totalCoupons` (Hardcoded to 0)
*   `data.activeCoupons` (Hardcoded to 0)
*   `data.averageOrderValue`
*   `data.dateRange`

### Actual API Response Structure
```json
{
  "success": true,
  "data": {
    "totalRevenue": number,
    "totalOrders": number,
    "totalCommissions": number,
    "totalActiveAffiliates": number,
    "totalCreators": 0,
    "activeCreators": 0,
    "pendingCreators": 0,
    "totalCoupons": 0,
    "activeCoupons": 0,
    "conversionRate": 0,
    "averageOrderValue": number,
    "salesBreakdown": {
      "grossSales": number,
      "discounts": number,
      "taxes": number,
      "returns": number,
      "payouts": number,
      "commissions": number,
      "totalSales": number
    },
    "salesBySocialChannel": {},
    "salesByProduct": {},
    "topAffiliates": [],
    "topManagers": [],
    "dateRange": {
      "start": "string",
      "end": "string"
    }
  }
}
```

---

## 5. Creator Profile
**Endpoint**: `GET /api/creators/[id]/profile`
**Backend Mapping**: `/getCreatorProfileForAdmin`

### Response Fields Being Used
*   `data` (Full Creator object with stats)
    *   (Usage depends on the specific detail page implementation, generally matches the List item but with more history/details)

### Fields Not Being Used
*   Similar to Creators List (bio, profileImage often unused if not displayed).

### Actual API Response Structure
```json
{
  "success": true,
  "data": {
    "profile": { ...CreatorFields },
    "stats": { ... },
    "coupons": [ ... ],
    "managedByName": "string"
    // ...other merged fields
  }
}
```

---

## 6. Admins List
**Endpoint**: `POST /api/admins`
**Backend Mapping**: `/getAllAdmins`

### Response Fields Being Used
*   `data.items[]` (id, name, email, createdAt, affiliateCount, totalSales, totalOrders, totalCommission)
*   `data.page`
*   `data.pageSize`
*   `data.total`
*   `data.totalPages`
*   `data.hasNextPage`
*   `data.hasPrevPage`

### Actual API Response Structure
```json
{
  "success": true,
  "data": {
    "items": [{ "id": "string", "name": "string", "email": "string", "createdAt": number }],
    "page": number,
    "pageSize": number,
    "total": number,
    "totalPages": number,
    "hasNextPage": boolean,
    "hasPrevPage": boolean,
    "appliedSort": {}
  }
}
```

---

## 7. Manager List (Dropdown)
**Endpoint**: `GET /api/managers/list`
**Backend Mapping**: `/getManagersList`

### Response Fields Being Used
*   `data.managers[]` (id, name)

### Actual API Response Structure
```json
{
  "success": true,
  "data": {
    "managers": [
      { "id": "string", "name": "string" }
    ]
  }
}
```

---

## 8. Products List
**Endpoint**: `GET /api/products`
**Backend Mapping**: `/getAllShopifyProducts`

### Response Fields Being Used
*   `data[]` (Used for name, image, price in dropdowns/lists)

### Actual API Response Structure
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "title": "string",
      "handle": "string",
      "status": "ACTIVE",
      "images": ["string"],
      "productType": "string"
    }
  ]
}
```

---

## 9. Collections List
**Endpoint**: `GET /api/collections`
**Backend Mapping**: `/getAllProductCollectionsForAdmin`

### Response Fields Being Used
*   `data[]` (id, name, handle, productIds)

### Actual API Response Structure
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "handle": "string",
      "description": "string",
      "productIds": ["string"],
      "createdAt": number,
      "updatedAt": number,
      "createdBy": "string"
    }
  ]
}
```

---

## 10. Admin Creation
**Endpoint**: `POST /api/admins/create`
**Backend Mapping**: `/createAdminProfile`

### Response Fields Being Used
*   `data` (id, name, email, createdAt)

### Actual API Response Structure
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "email": "string",
    "createdAt": number
  }
}
```

---

## 11. Auth Profile
**Endpoint**: `GET /api/auth/profile`
**Backend Mapping**: (Cookies read)

### Response Fields Being Used
*   `adminProfile` (Currently empty in code stub, implies need for implementation)

### Actual API Response Structure
```json
{
  "success": true,
  "adminProfile": {}
}
```

