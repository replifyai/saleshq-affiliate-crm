# Mock API Request & Response Examples

Simple examples of API requests and responses for backend implementation.

---

## 1. Dashboard Stats API

### Endpoint: `GET /api/dashboard/stats`

**Request:**
```
GET /api/dashboard/stats?period=30days
```

**Response:**
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
      { "id": "1", "name": "Frido Ultimate Wedge Plus Cushion", "value": 39754706.71, "percentage": 24, "image": "https://cdn.myfrido.com/product1.jpg" },
      { "id": "2", "name": "Ultimate Car Comfort Bundle", "value": 39754706.71, "percentage": 24, "image": "https://cdn.myfrido.com/product2.jpg" },
      { "id": "3", "name": "Frido Car Neck Mini Pillow", "value": 39754706.71, "percentage": 24, "image": "https://cdn.myfrido.com/product3.jpg" },
      { "id": "4", "name": "Frido Travel Neck Pillow", "value": 39754706.71, "percentage": 24, "image": "https://cdn.myfrido.com/product4.jpg" },
      { "id": "5", "name": "Frido Barefoot Sock Shoe Pro", "value": 39754706.71, "percentage": 24, "image": "https://cdn.myfrido.com/product5.jpg" }
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
      { "id": "1", "name": "Alister D Silva", "value": 39754706.71, "percentage": 24 },
      { "id": "2", "name": "Abin Sasidharan", "value": 3975471, "percentage": 24 },
      { "id": "3", "name": "James Tharakan", "value": 3975471, "percentage": 24 },
      { "id": "4", "name": "Manmohan", "value": 3975471, "percentage": 24 },
      { "id": "5", "name": "Saloma Palms", "value": 3975471, "percentage": 24 }
    ],
    "topManagers": [
      { "id": "1", "name": "Saiyed Abdal", "value": 39754706.71, "percentage": 24 },
      { "id": "2", "name": "Gautami Chati", "value": 3975471, "percentage": 24 },
      { "id": "3", "name": "Parag Swami", "value": 3975471, "percentage": 24 },
      { "id": "4", "name": "Dileep Pakkat", "value": 3975471, "percentage": 24 },
      { "id": "5", "name": "Chaitrali Bokil", "value": 3975471, "percentage": 24 }
    ]
  }
}
```

---

## 2. Affiliates - Current (Approved) List

### Endpoint: `POST /api/affiliates/list`

**Request:**
```json
{
  "page": 1,
  "pageSize": 20,
  "tab": "current",
  "search": "Sameer",
  "filters": {
    "manager": "mgr_001",
    "status": "approved",
    "dateRange": {
      "from": "2024-01-01",
      "to": "2024-12-31"
    },
    "salesRange": {
      "min": 0,
      "max": 500000
    }
  },
  "sort": {
    "by": "totalSales",
    "direction": "desc"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "aff_001",
        "name": "Sameer Poswal",
        "email": "sameer@gmail.com",
        "phoneNumber": "+91 6282 9379 01",
        "socialMediaHandles": [
          { "platform": "instagram", "handle": "@sameer_poswal" }
        ],
        "managedBy": "mgr_001",
        "managerName": "Abdal",
        "discountCode": "SUJAL",
        "discountPercent": 10,
        "reward": 10,
        "totalSales": 8744.00,
        "totalOrders": 15,
        "totalCommission": 874.40,
        "status": "approved",
        "createdAt": 1701388800000
      },
      {
        "id": "aff_002",
        "name": "Yuvraj Gautam",
        "email": "yuvraj@gmail.com",
        "phoneNumber": "+91 6282 9379 02",
        "socialMediaHandles": [
          { "platform": "instagram", "handle": "@yuvraj_g" }
        ],
        "managedBy": "mgr_001",
        "managerName": "Abdal",
        "discountCode": "SUJAL",
        "discountPercent": 10,
        "reward": 10,
        "totalSales": 0,
        "totalOrders": 0,
        "totalCommission": 0,
        "status": "approved",
        "createdAt": 1701388800000
      },
      {
        "id": "aff_003",
        "name": "Soham",
        "email": "soham@gmail.com",
        "phoneNumber": "+91 6282 9379 03",
        "socialMediaHandles": [
          { "platform": "instagram", "handle": "@soham" }
        ],
        "managedBy": "mgr_001",
        "managerName": "Abdal",
        "discountCode": "SUJAL",
        "discountPercent": 10,
        "reward": 10,
        "totalSales": 11345.12,
        "totalOrders": 23,
        "totalCommission": 1134.51,
        "status": "approved",
        "createdAt": 1701388800000
      },
      {
        "id": "aff_004",
        "name": "Vaibhav Sharma",
        "email": "vaibhav@gmail.com",
        "phoneNumber": "+91 6282 9379 04",
        "socialMediaHandles": [
          { "platform": "instagram", "handle": "@vaibhav" }
        ],
        "managedBy": "mgr_001",
        "managerName": "Abdal",
        "discountCode": "SUJAL",
        "discountPercent": 10,
        "reward": 10,
        "totalSales": 14004.40,
        "totalOrders": 28,
        "totalCommission": 1400.44,
        "status": "approved",
        "createdAt": 1701388800000
      },
      {
        "id": "aff_005",
        "name": "Meenakshi Chauhan",
        "email": "meenakshi@gmail.com",
        "phoneNumber": "+91 6282 9379 05",
        "socialMediaHandles": [
          { "platform": "instagram", "handle": "@meenakshi" }
        ],
        "managedBy": "mgr_001",
        "managerName": "Abdal",
        "discountCode": "SUJAL",
        "discountPercent": 10,
        "reward": 10,
        "totalSales": 113112.50,
        "totalOrders": 156,
        "totalCommission": 11311.25,
        "status": "approved",
        "createdAt": 1701388800000
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 87,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

## 3. Affiliates - Pending List

### Endpoint: `POST /api/affiliates/list`

**Request:**
```json
{
  "page": 1,
  "pageSize": 20,
  "tab": "pending"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "aff_p001",
        "name": "Sujal Chandrashekhar",
        "email": "sujal.c@gmail.com",
        "phoneNumber": "+91 6282 9379 01",
        "socialMediaHandles": [
          { "platform": "instagram", "handle": "@sujal_c" }
        ],
        "status": "pending",
        "createdAt": 1701388800000
      },
      {
        "id": "aff_p002",
        "name": "Karanveer",
        "email": "karanveer@gmail.com",
        "phoneNumber": "+91 6282 9379 02",
        "socialMediaHandles": [
          { "platform": "instagram", "handle": "@karanveer" }
        ],
        "status": "pending",
        "createdAt": 1701475200000
      },
      {
        "id": "aff_p003",
        "name": "Shravani",
        "email": "shravani@gmail.com",
        "phoneNumber": "+91 6282 9379 03",
        "socialMediaHandles": [
          { "platform": "instagram", "handle": "@shravani" }
        ],
        "status": "rejected",
        "createdAt": 1701388800000,
        "rejectedAt": 1701475200000
      },
      {
        "id": "aff_p004",
        "name": "Isha Agrawal",
        "email": "isha@gmail.com",
        "phoneNumber": "+91 6282 9379 04",
        "socialMediaHandles": [
          { "platform": "instagram", "handle": "@isha" }
        ],
        "status": "pending",
        "createdAt": 1701561600000
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 5,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

**Note:** Pending affiliates do not have `managedBy` or `managerName` fields. A manager is assigned when the affiliate is accepted.

---

## 4. Affiliate Managers List

### Endpoint: `POST /api/affiliates/list`

**Request:**
```json
{
  "page": 1,
  "pageSize": 20,
  "tab": "managers"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "mgr_001",
        "name": "Abdal",
        "email": "abdal@myfrido.com",
        "phone": "+91 9876543210",
        "totalAffiliates": 25,
        "totalSales": 3975471,
        "createdAt": 1701388800000
      },
      {
        "id": "mgr_002",
        "name": "Gautami Chati",
        "email": "gautami@myfrido.com",
        "phone": "+91 9876543211",
        "totalAffiliates": 18,
        "totalSales": 2875471,
        "createdAt": 1701388800000
      },
      {
        "id": "mgr_003",
        "name": "Parag Swami",
        "email": "parag@myfrido.com",
        "phone": "+91 9876543212",
        "totalAffiliates": 15,
        "totalSales": 1975471,
        "createdAt": 1701388800000
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 3,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

---

## 4.1 Add New Manager

### Endpoint: `POST /api/managers`

**Request:**
```json
{
  "name": "Dileep Pakkat",
  "email": "dileep@myfrido.com",
  "phone": "+91 9876543213"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "mgr_004",
    "name": "Dileep Pakkat",
    "email": "dileep@myfrido.com",
    "phone": "+91 9876543213",
    "totalAffiliates": 0,
    "totalSales": 0,
    "createdAt": 1704153600000
  },
  "message": "Manager created successfully"
}
```

---

## 5. Accept Affiliate

### Endpoint: `PUT /api/affiliates/:id/accept`

**Request:**
```json
{
  "discountPercent": 10,
  "discountType": "percentage",
  "commissionPercent": 10,
  "commissionType": "percentage",
  "minOrderValue": 500,
  "discountCode": "SUJAL",
  "managerId": "mgr_001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Affiliate accepted successfully",
  "data": {
    "affiliateId": "aff_001",
    "managerId": "mgr_001",
    "managerName": "Abdal"
  }
}
```

---

## 6. Invite New Affiliate

### Endpoint: `POST /api/affiliates/invite`

**Request:**
```json
{
  "name": "Aromal",
  "phoneNumber": "+91 6292937901",
  "email": "Aromalsula@gmail.com",
  "discountPercent": 10,
  "discountType": "percentage",
  "commissionPercent": 10,
  "commissionType": "percentage",
  "minOrderValue": 500,
  "discountCode": "AROMAL",
  "invitedBy": "Abdal"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "aff_new_001",
    "inviteLink": "https://affiliate.myfrido.com/join/abc123"
  },
  "message": "Invite sent successfully"
}
```

---

## 7. Affiliate Profile

### Endpoint: `GET /api/affiliates/:id`

**Request:**
```
GET /api/affiliates/aff_001
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "aff_001",
    "name": "Shubham",
    "email": "shubham@gmail.com",
    "phoneNumber": "+91 6292937901",
    "status": "approved",
    "socialMediaHandles": [
      { "platform": "instagram", "handle": "@shubham" }
    ],
    "totalRevenue": 1743245,
    "totalRevenueChange": 24,
    "totalOrders": 13445,
    "totalOrdersChange": 24,
    "totalCommission": 1743,
    "totalCommissionChange": 24,
    "discountCode": "SHUBHAM",
    "discountAmount": "10%",
    "commissionAmount": "10%",
    "featuredCollections": [
      { "id": "col_1", "name": "Car comfort collections", "url": "https://myfrido.com/collections/car-comfort" },
      { "id": "col_2", "name": "Car comfort collections", "url": "https://myfrido.com/collections/car-comfort" },
      { "id": "col_3", "name": "Car comfort collections", "url": "https://myfrido.com/collections/car-comfort" }
    ],
    "featuredProducts": [
      { "id": "prod_1", "name": "Product Name Goes Here", "price": 2599, "originalPrice": 2599, "image": "https://cdn.myfrido.com/sock1.jpg" },
      { "id": "prod_2", "name": "Product Name Goes Here", "price": 2599, "originalPrice": 2599, "image": "https://cdn.myfrido.com/sock2.jpg" },
      { "id": "prod_3", "name": "Product Name Goes Here", "price": 2599, "originalPrice": 2599, "image": "https://cdn.myfrido.com/sock3.jpg" }
    ],
    "managedBy": "mgr_001",
    "managerName": "Abdal",
    "createdAt": 1701388800000,
    "approvedAt": 1701475200000
  }
}
```

---

## 8. Orders List

### Endpoint: `POST /api/orders/list`

**Request:**
```json
{
  "page": 1,
  "pageSize": 20,
  "tab": "all",
  "search": "MF123",
  "filters": {
    "orderStatus": ["delivered", "in_transit"],
    "payoutStatus": ["pending", "issued"],
    "dateRange": {
      "from": "2024-01-01",
      "to": "2024-12-31"
    },
    "amountRange": {
      "min": 0,
      "max": 50000
    },
    "affiliate": "Sameer"
  },
  "sort": {
    "by": "createdAt",
    "direction": "desc"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "ord_001",
        "orderNumber": "MF123456789012",
        "orderDate": 1724400000000,
        "orderStatus": "delivered",
        "customerName": "Aromal Sula",
        "customerEmail": "aromal@gmail.com",
        "discountCode": "SUJAL",
        "totalAmount": 32398.20,
        "currencyCode": "INR",
        "reward": 2454.90,
        "payoutStatus": "self_referral"
      },
      {
        "id": "ord_002",
        "orderNumber": "MF123456789012",
        "orderDate": 1724400000000,
        "orderStatus": "cancelled",
        "customerName": "Aromal Sula",
        "customerEmail": "aromal@gmail.com",
        "discountCode": "SUJAL",
        "totalAmount": 32398.20,
        "currencyCode": "INR",
        "reward": 2454.90,
        "payoutStatus": "cancelled"
      },
      {
        "id": "ord_003",
        "orderNumber": "MF123456789012",
        "orderDate": 1724400000000,
        "orderStatus": "delivered",
        "customerName": "Aromal Sula",
        "customerEmail": "aromal@gmail.com",
        "discountCode": "SUJAL",
        "totalAmount": 32398.20,
        "currencyCode": "INR",
        "reward": 2454.90,
        "payoutStatus": "days_left",
        "payoutDaysLeft": 7
      },
      {
        "id": "ord_004",
        "orderNumber": "MF123456789012",
        "orderDate": 1724400000000,
        "orderStatus": "delivered",
        "customerName": "Aromal Sula",
        "customerEmail": "aromal@gmail.com",
        "discountCode": "SUJAL",
        "totalAmount": 32398.20,
        "currencyCode": "INR",
        "reward": 2454.90,
        "payoutStatus": "completed"
      },
      {
        "id": "ord_005",
        "orderNumber": "MF123456789012",
        "orderDate": 1724400000000,
        "orderStatus": "in_transit",
        "customerName": "Aromal Sula",
        "customerEmail": "aromal@gmail.com",
        "discountCode": "SUJAL",
        "totalAmount": 32398.20,
        "currencyCode": "INR",
        "reward": 2454.90,
        "payoutStatus": "days_left",
        "payoutDaysLeft": 7
      },
      {
        "id": "ord_006",
        "orderNumber": "MF123456789012",
        "orderDate": 1724400000000,
        "orderStatus": "returned",
        "customerName": "Aromal Sula",
        "customerEmail": "aromal@gmail.com",
        "discountCode": "SUJAL",
        "totalAmount": 32398.20,
        "currencyCode": "INR",
        "reward": 2454.90,
        "payoutStatus": "cancelled"
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

## Status Values Reference

### Order Status
- `delivered` - Order delivered
- `cancelled` - Order cancelled
- `in_transit` - Order in transit
- `returned` - Order returned
- `processing` - Order processing

### Payout Status
- `self_referral` - Self referral (gray badge)
- `cancelled` - Cancelled (red badge)
- `days_left` - X days left for payout (blue badge)
- `completed` - Payout completed (green badge)
- `pending` - Payout pending (yellow badge)

### Affiliate Status
- `pending` - Pending approval
- `approved` - Approved/Active
- `rejected` - Rejected

---

## 9. Payouts - Issued List

### Endpoint: `POST /api/payouts/list`

**Request:**
```json
{
  "page": 1,
  "pageSize": 20,
  "tab": "issued",
  "search": "Sameer",
  "filters": {
    "paymentMethod": ["Bank Transfer", "UPI"],
    "dateRange": {
      "from": "2024-01-01",
      "to": "2024-12-31"
    },
    "amountRange": {
      "min": 0,
      "max": 200000
    },
    "affiliate": "Sameer"
  },
  "sort": {
    "by": "amount",
    "direction": "desc"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "pay_001",
        "affiliateId": "aff_001",
        "affiliateName": "Sameer Poswal",
        "affiliateEmail": "sameer@gmail.com",
        "amount": 8744.00,
        "currencyCode": "INR",
        "ordersCount": 15,
        "periodStart": 1701388800000,
        "periodEnd": 1704067200000,
        "status": "issued",
        "issuedAt": 1704153600000,
        "paymentMethod": "Bank Transfer",
        "bankDetails": {
          "bankName": "HDFC Bank",
          "accountNumber": "****4521"
        }
      },
      {
        "id": "pay_002",
        "affiliateId": "aff_002",
        "affiliateName": "Yuvraj Gautam",
        "affiliateEmail": "yuvraj@gmail.com",
        "amount": 12500.50,
        "currencyCode": "INR",
        "ordersCount": 23,
        "periodStart": 1701388800000,
        "periodEnd": 1704067200000,
        "status": "issued",
        "issuedAt": 1704153600000,
        "paymentMethod": "Bank Transfer",
        "bankDetails": {
          "bankName": "ICICI Bank",
          "accountNumber": "****7832"
        }
      },
      {
        "id": "pay_003",
        "affiliateId": "aff_003",
        "affiliateName": "Soham",
        "affiliateEmail": "soham@gmail.com",
        "amount": 5600.00,
        "currencyCode": "INR",
        "ordersCount": 8,
        "periodStart": 1701388800000,
        "periodEnd": 1704067200000,
        "status": "issued",
        "issuedAt": 1704153600000,
        "paymentMethod": "UPI"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 5,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    },
    "summary": {
      "totalAmount": 29344.50,
      "totalCount": 5
    }
  }
}
```

---

## 10. Payouts - Processed List

### Endpoint: `POST /api/payouts/list`

**Request:**
```json
{
  "page": 1,
  "pageSize": 20,
  "tab": "processed"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "pay_004",
        "affiliateId": "aff_004",
        "affiliateName": "Vaibhav Sharma",
        "affiliateEmail": "vaibhav@gmail.com",
        "amount": 14004.40,
        "currencyCode": "INR",
        "ordersCount": 28,
        "periodStart": 1698796800000,
        "periodEnd": 1701388800000,
        "status": "processed",
        "issuedAt": 1701475200000,
        "processedAt": 1701561600000,
        "transactionId": "TXN123456789",
        "paymentMethod": "Bank Transfer",
        "bankDetails": {
          "bankName": "SBI",
          "accountNumber": "****9012"
        }
      },
      {
        "id": "pay_005",
        "affiliateId": "aff_005",
        "affiliateName": "Meenakshi Chauhan",
        "affiliateEmail": "meenakshi@gmail.com",
        "amount": 113112.50,
        "currencyCode": "INR",
        "ordersCount": 156,
        "periodStart": 1698796800000,
        "periodEnd": 1701388800000,
        "status": "processed",
        "issuedAt": 1701475200000,
        "processedAt": 1701561600000,
        "transactionId": "TXN123456790",
        "paymentMethod": "Bank Transfer",
        "bankDetails": {
          "bankName": "Axis Bank",
          "accountNumber": "****3456"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 5,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    },
    "summary": {
      "totalAmount": 154390.71,
      "totalCount": 5
    }
  }
}
```

---

## 11. Mark Payout as Processed

### Endpoint: `PUT /api/payouts/:id/process`

**Request:**
```json
{
  "transactionId": "TXN123456794",
  "processedAt": 1704240000000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payout marked as processed"
}
```

---

## Payout Status Values
- `issued` - Payout issued, pending processing (amber badge)
- `processed` - Payout completed (green badge)
- `pending` - Payout pending (gray badge)
- `failed` - Payout failed (red badge)

---

## 12. Collections List

### Endpoint: `POST /api/collections/list`

**Request:**
```json
{
  "page": 1,
  "pageSize": 20,
  "search": "car comfort",
  "filters": {
    "dateRange": {
      "from": "2024-01-01",
      "to": "2024-12-31"
    },
    "productCount": {
      "min": 0,
      "max": 100
    },
    "hasProducts": "yes"
  },
  "sort": {
    "by": "createdAt",
    "direction": "desc"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "col_001",
        "title": "Car Comfort Collection",
        "handle": "car-comfort-collection",
        "description": "Premium car comfort products",
        "productCount": 12,
        "createdAt": 1701388800000,
        "updatedAt": 1704067200000
      },
      {
        "id": "col_002",
        "title": "Travel Essentials",
        "handle": "travel-essentials",
        "description": "Must-have travel products",
        "productCount": 8,
        "createdAt": 1701388800000,
        "updatedAt": 1704067200000
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 15,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

---

## Filter Options Reference

### Affiliates Filters
| Filter | Type | Options/Range | Description |
|--------|------|---------------|-------------|
| `manager` | select | Manager IDs | Filter by assigned manager |
| `status` | select | `approved`, `pending`, `rejected` | Filter by affiliate status |
| `dateRange` | daterange | `{ from: string, to: string }` | Filter by joined date |
| `salesRange` | range | `{ min: number, max: number }` | Filter by total sales (₹0 - ₹500,000) |

### Orders Filters
| Filter | Type | Options/Range | Description |
|--------|------|---------------|-------------|
| `orderStatus` | multiselect | `Paid`, `Partially Paid`, `Processing`, `Fulfilled`, `Unfulfilled`, `Cancelled`, `Refunded` | Filter by order status |
| `payoutStatus` | multiselect | `pending`, `issued`, `processed` | Filter by payout status |
| `dateRange` | daterange | `{ from: string, to: string }` | Filter by order date |
| `amountRange` | range | `{ min: number, max: number }` | Filter by order amount (₹0 - ₹50,000) |
| `affiliate` | text | string | Filter by affiliate name |

### Collections Filters
| Filter | Type | Options/Range | Description |
|--------|------|---------------|-------------|
| `dateRange` | daterange | `{ from: string, to: string }` | Filter by created date |
| `productCount` | range | `{ min: number, max: number }` | Filter by number of products (0 - 100) |
| `hasProducts` | select | `yes`, `no` | Filter by whether collection has products |

### Payouts Filters
| Filter | Type | Options/Range | Description |
|--------|------|---------------|-------------|
| `paymentMethod` | multiselect | `Bank Transfer`, `UPI`, `PayPal`, `Razorpay` | Filter by payment method |
| `dateRange` | daterange | `{ from: string, to: string }` | Filter by payout date |
| `amountRange` | range | `{ min: number, max: number }` | Filter by payout amount (₹0 - ₹200,000) |
| `affiliate` | text | string | Filter by affiliate name |

---

## Filter Types

### Select
Single selection from dropdown options.
```json
{
  "filterName": "option_value"
}
```

### Multiselect  
Multiple selections as array.
```json
{
  "filterName": ["option1", "option2"]
}
```

### Date Range
Date range with from and to dates (ISO format).
```json
{
  "filterName": {
    "from": "2024-01-01",
    "to": "2024-12-31"
  }
}
```

### Numeric Range
Number range with min and max values.
```json
{
  "filterName": {
    "min": 0,
    "max": 50000
  }
}
```

### Text
Free text search.
```json
{
  "filterName": "search text"
}
```

