# Creators API Integration

## Overview

Successfully integrated the backend creators API with filters, sorting, and pagination according to the backend specifications.

## Backend API Details

**Endpoint:** `POST https://dashboardapi-dkhjjaxofq-el.a.run.app/getCreatorsDashboard`

### Request Structure

```json
{
  "page": 1,
  "pageSize": 20,
  "filters": {
    "approved": "approved",  // "approved" | "pending" | "rejected"
    "phoneNumberVerified": true  // boolean
  },
  "sort": {
    "by": "createdAt",  // "createdAt" | "name" | "email" | "phoneNumber"
    "direction": "desc"  // "asc" | "desc"
  }
}
```

### Response Structure

```json
{
  "creators": {
    "items": [
      {
        "id": "string",
        "name": "string",
        "phoneNumber": "string",
        "email": "user@example.com",
        "createdAt": 0,
        "approved": "approved",
        "socialMediaHandles": [
          {
            "platform": "instagram",
            "handle": "string"
          }
        ],
        "phoneNumberVerified": true
      }
    ],
    "page": 0,
    "pageSize": 0,
    "total": 0,
    "totalPages": 0,
    "hasNextPage": true,
    "hasPrevPage": true,
    "appliedFilters": {
      "approved": "approved",
      "phoneNumberVerified": true
    },
    "appliedSort": {
      "by": "createdAt",
      "direction": "asc"
    }
  }
}
```

## What Was Updated

### 1. Type Definitions (`types/index.ts`)

**Updated Creator Interface:**
```typescript
export interface SocialMediaHandle {
  platform: string;
  handle: string;
}

export interface Creator {
  id: string;
  name: string;
  phoneNumber: string;  // NEW
  email: string;
  createdAt: number;  // Changed from string to number
  approved: CreatorStatus;  // Changed from status
  socialMediaHandles: SocialMediaHandle[];  // Changed structure
  phoneNumberVerified: boolean;  // NEW
  bio?: string;
  profileImage?: string;
  updatedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
}
```

**Updated Filters:**
```typescript
export interface CreatorFilters {
  approved?: CreatorStatus;  // Changed from status
  phoneNumberVerified?: boolean;  // NEW - removed search
  page?: number;
  pageSize?: number;  // Changed from limit
  sortBy?: 'name' | 'createdAt' | 'email' | 'phoneNumber';
  sortDirection?: 'asc' | 'desc';  // Changed from sortOrder
}
```

**New Response Type:**
```typescript
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
```

### 2. API Route (`app/api/creators/route.ts`)

**Changed from GET to POST:**
- Now accepts POST requests with body containing filters and sort options
- Calls backend API using `fetchBackend` utility with authentication
- Maps frontend filters to backend format

**Key Changes:**
```typescript
// Before: GET with query params
export async function GET(request: NextRequest) { ... }

// After: POST with request body
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { page, pageSize, filters, sort } = body;
  
  // Call backend with auth tokens from cookies
  const response = await fetchBackend('/getCreatorsDashboard', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });
}
```

### 3. UI Updates (`app/dashboard/creators/page.tsx`)

**Removed:**
- ❌ Search filter (not in backend API)
- ❌ Old status filter

**Added:**
- ✅ Approval status filter (pending/approved/rejected)
- ✅ Phone number verified filter (all/verified/not verified)
- ✅ Sort by field selector (createdAt/name/email/phoneNumber)
- ✅ Sort direction selector (asc/desc)
- ✅ Phone number column in table
- ✅ Phone verification status badge
- ✅ Clickable column headers for sorting
- ✅ Sort indicators on column headers

**Updated Table Columns:**
1. Name (sortable)
2. Email (sortable)
3. Phone Number (sortable) - NEW
4. Phone Verified (badge) - NEW
5. Status (approval status)
6. Created Date (sortable)
7. Actions

**Updated Profile Modal:**
- Shows phone number
- Shows phone verification status with badge
- Updated social media handles display (array format)

## UI Features

### Filter Panel

```
┌─────────────────────────────────────────────────────────────┐
│ Filters & Sorting                                           │
├─────────────────────────────────────────────────────────────┤
│ [Approval Status ▼] [Phone Verified ▼] [Sort By ▼] [Dir ▼] │
│ All Status          All                 Date Created  Desc  │
│                                                              │
│ [Refresh] button                                            │
└─────────────────────────────────────────────────────────────┘
```

### Table with Sorting

```
Name ⇅     Email ⇅    Phone ⇅    Verified    Status     Created ⇅    Actions
────────────────────────────────────────────────────────────────────────────
John Doe   john@...   +123...    ✓ Verified  Approved   Jan 1, 2024  [View]
Jane       jane@...   +456...    ✗ Not Ver.  Pending    Jan 2, 2024  [✓][✗]
```

### Badges

- **Phone Verified:** Green badge with phone icon
- **Not Verified:** Red badge with phone-off icon
- **Approval Status:** 
  - Green for Approved
  - Yellow for Pending
  - Red for Rejected

## Usage Example

### Fetch Creators with Filters

```typescript
const fetchCreators = async () => {
  const requestBody = {
    page: 1,
    pageSize: 20,
    filters: {
      approved: 'approved',  // Only approved creators
      phoneNumberVerified: true  // Only verified phones
    },
    sort: {
      by: 'createdAt',
      direction: 'desc'
    }
  };

  const response = await apiClient.post('/creators', requestBody);
  console.log(response.data.items);  // Array of creators
  console.log(response.data.total);   // Total count
};
```

### Filter Options

**Approval Status:**
- All Status
- Pending
- Approved
- Rejected

**Phone Verified:**
- All
- Verified
- Not Verified

**Sort By:**
- Date Created
- Name
- Email
- Phone Number

**Sort Direction:**
- Ascending
- Descending

## Pagination

The API uses cursor-based pagination with helper fields:

```typescript
{
  page: 1,           // Current page
  pageSize: 20,      // Items per page
  total: 150,        // Total items
  totalPages: 8,     // Total pages
  hasNextPage: true, // Can go forward
  hasPrevPage: false // Can go back
}
```

**UI Implementation:**
- Previous button (disabled if `!hasPrevPage`)
- Current page indicator
- Next button (disabled if `!hasNextPage`)
- Total count display

## Authentication

All requests to `/api/creators` automatically include authentication:

1. Client calls `apiClient.post('/creators', requestBody)`
2. Next.js API route receives request
3. `fetchBackend()` extracts `idToken` from cookies
4. Backend API called with `Authorization: Bearer {idToken}`
5. Response returned to client

**No manual token handling required!**

## Migration Notes

### Breaking Changes

1. **API Method Changed:** GET → POST
2. **Filter Names Changed:** 
   - `status` → `approved`
   - `limit` → `pageSize`
   - `sortOrder` → `sortDirection`
3. **Search Filter Removed:** Not supported by backend
4. **Creator Structure Changed:**
   - `status` → `approved`
   - `createdAt` now number (timestamp)
   - `socialMediaHandles` now array of objects

### If Using Old Code

Update your calls from:
```typescript
// OLD
apiClient.get('/creators?status=approved&page=1')
```

To:
```typescript
// NEW
apiClient.post('/creators', {
  page: 1,
  pageSize: 20,
  filters: { approved: 'approved' },
  sort: { by: 'createdAt', direction: 'desc' }
})
```

## Testing

### Test Filters
1. Select "Approved" status → Should show only approved creators
2. Select "Verified" phone → Should show only phone-verified creators
3. Combine both filters → Should show creators matching both

### Test Sorting
1. Click "Name" column header → Should sort by name
2. Click again → Should reverse sort direction
3. Select "Date Created" from dropdown → Should sort by date

### Test Pagination
1. Click "Next" → Should load page 2
2. Click "Previous" → Should go back to page 1
3. Previous should be disabled on page 1
4. Next should be disabled on last page

## Future Enhancements

Potential additions based on backend capabilities:

1. **Bulk Actions** - Select multiple creators for batch approval
2. **Export** - Download creators list as CSV
3. **Advanced Filters** - Date range, social media platform
4. **Quick Stats** - Show counts for each status
5. **Search** - If backend adds search capability later

