# Creator Approve/Reject Actions

## Overview

Successfully integrated the backend API for approving and rejecting creators with proper authentication and error handling.

## Backend API Details

**Endpoint:** `POST https://dashboardapi-dkhjjaxofq-el.a.run.app/changeCreatorStatus`

### Request Structure

```json
{
  "uid": "string",        // Creator ID
  "status": "approved"    // "approved" or "rejected"
}
```

### Response Structure

```json
{
  "creator": {
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
}
```

## Implementation

### API Routes

#### Approve Creator
**File:** `app/api/creators/[id]/approve/route.ts`

```typescript
PUT /api/creators/{id}/approve

// Calls backend:
POST /changeCreatorStatus
{
  "uid": "{id}",
  "status": "approved"
}
```

**Features:**
- ✅ Automatic authentication with idToken from cookies
- ✅ Error handling with detailed messages
- ✅ Returns updated creator data
- ✅ Proper response structure

#### Reject Creator
**File:** `app/api/creators/[id]/reject/route.ts`

```typescript
PUT /api/creators/{id}/reject

// Calls backend:
POST /changeCreatorStatus
{
  "uid": "{id}",
  "status": "rejected"
}
```

**Features:**
- ✅ Automatic authentication with idToken from cookies
- ✅ Error handling with detailed messages
- ✅ Returns updated creator data
- ✅ Proper response structure

### Frontend Implementation

**File:** `app/dashboard/creators/page.tsx`

#### Approve Handler

```typescript
const handleApprove = async (creatorId: string) => {
  // 1. Confirmation dialog
  if (!confirm('Are you sure you want to approve this creator?')) {
    return;
  }
  
  try {
    // 2. Set loading state
    setLoading(true);
    
    // 3. Call API
    const response = await apiClient.put(`/creators/${creatorId}/approve`);
    
    // 4. Refresh list on success
    if (response.success) {
      await fetchCreators();
      alert('✓ Creator approved successfully!');
    }
  } catch (error) {
    // 5. Show error message
    alert(`✗ Error: ${errorMessage}`);
  } finally {
    // 6. Clear loading state
    setLoading(false);
  }
};
```

#### Reject Handler

```typescript
const handleReject = async (creatorId: string) => {
  // Same pattern as approve
  // Just calls /reject endpoint instead
};
```

## User Flow

### Approve Flow

```
User clicks Approve button (✓)
         ↓
Confirmation dialog appears
         ↓
User confirms
         ↓
Loading state activated
         ↓
API call to /creators/{id}/approve
         ↓
Backend API: POST /changeCreatorStatus
         ↓
Success response
         ↓
Refresh creators list
         ↓
Show success message
         ↓
Creator status updated to "Approved"
```

### Reject Flow

```
User clicks Reject button (✗)
         ↓
Confirmation dialog appears
         ↓
User confirms
         ↓
Loading state activated
         ↓
API call to /creators/{id}/reject
         ↓
Backend API: POST /changeCreatorStatus
         ↓
Success response
         ↓
Refresh creators list
         ↓
Show success message
         ↓
Creator status updated to "Rejected"
```

## UI Elements

### Action Buttons

**Location:** Creators table, Actions column

**Visibility:**
- Only shown for creators with status = "pending"
- Hidden for approved/rejected creators

**Buttons:**
```
┌────────────────────────────┐
│ [👁️ View]  [✓]  [✗]        │
└────────────────────────────┘
  View      Approve  Reject
```

### States

**Normal State:**
- Green approve button with checkmark icon
- Red reject button with X icon
- Both clickable

**Loading State:**
- All action buttons disabled
- Loading spinner shown
- User cannot click other actions

**After Success:**
- Buttons disappear (status no longer "pending")
- Badge updates to "Approved" or "Rejected"
- List refreshes automatically

## Error Handling

### Client-Side Errors

```typescript
try {
  await apiClient.put('/creators/123/approve');
} catch (error) {
  // Handles:
  // - Network errors
  // - API errors
  // - Timeout errors
  // - Invalid response
  
  const errorMessage = 
    error.response?.data?.error ||  // Backend error message
    error.message ||                 // JS error message
    'Failed to approve creator';     // Fallback
    
  alert(`✗ Error: ${errorMessage}`);
}
```

### Server-Side Errors

```typescript
// API Route error handling
if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));
  throw new Error(errorData.message || 'Failed to approve creator');
}
```

**Error Types:**
1. **Authentication errors** (401)
   - User not logged in
   - Token expired
   - Auto-redirects to login

2. **Permission errors** (403)
   - User not authorized
   - Shows error message

3. **Not found errors** (404)
   - Creator doesn't exist
   - Shows error message

4. **Server errors** (500)
   - Backend issue
   - Shows error message

## Authentication

All approve/reject requests automatically include authentication:

```
Frontend Call:
  apiClient.put('/creators/123/approve')

       ↓

Next.js API Route:
  fetchBackend('/changeCreatorStatus', {
    method: 'POST',
    body: JSON.stringify({ uid: '123', status: 'approved' })
  })

       ↓

Server Utility:
  - Reads idToken from cookies
  - Adds Authorization header
  - Makes backend request

       ↓

Backend API:
  POST /changeCreatorStatus
  Headers: {
    Authorization: Bearer {idToken}
  }
```

## Response Handling

### Success Response

```typescript
{
  success: true,
  message: 'Creator approved successfully',
  data: {
    id: '123',
    name: 'John Doe',
    approved: 'approved',
    // ... other creator fields
  }
}
```

**Actions:**
1. Refresh creators list
2. Show success message
3. Clear loading state
4. Updated status appears in table

### Error Response

```typescript
{
  success: false,
  error: 'Failed to approve creator',
}
```

**Actions:**
1. Show error message
2. Clear loading state
3. List remains unchanged
4. User can retry

## User Experience

### Confirmation Dialogs

**Why?**
- Prevents accidental approvals/rejections
- Critical actions require explicit confirmation

**Message:**
- Approve: "Are you sure you want to approve this creator?"
- Reject: "Are you sure you want to reject this creator?"

**Options:**
- OK - Proceed with action
- Cancel - Abort action

### Success Messages

**Format:** `✓ Creator [approved/rejected] successfully!`

**Display:**
- Browser alert (can be replaced with toast notifications)
- Clear and concise
- Includes checkmark emoji for visual feedback

### Error Messages

**Format:** `✗ Error: [detailed error message]`

**Display:**
- Browser alert (can be replaced with toast notifications)
- Shows actual error from backend when available
- Includes X emoji for visual feedback

## Testing

### Test Approve Action

1. Navigate to Creators page
2. Find a creator with "Pending" status
3. Click approve button (✓)
4. Confirm in dialog
5. Verify:
   - Loading state appears
   - Success message shows
   - List refreshes
   - Status changes to "Approved"
   - Approve/Reject buttons disappear

### Test Reject Action

1. Navigate to Creators page
2. Find a creator with "Pending" status
3. Click reject button (✗)
4. Confirm in dialog
5. Verify:
   - Loading state appears
   - Success message shows
   - List refreshes
   - Status changes to "Rejected"
   - Approve/Reject buttons disappear

### Test Error Scenarios

1. **Network Error:**
   - Disconnect internet
   - Try to approve/reject
   - Should show network error message

2. **Invalid Creator:**
   - Manually call API with invalid ID
   - Should show "not found" error

3. **Unauthorized:**
   - Clear cookies/logout
   - Try to approve/reject
   - Should redirect to login

### Test Confirmation Cancel

1. Click approve/reject button
2. Click "Cancel" in confirmation dialog
3. Verify:
   - No API call made
   - Status unchanged
   - No loading state

## Code Structure

### Files Modified/Created

```
app/api/creators/[id]/
├── approve/
│   └── route.ts          ✓ Updated - calls backend API
└── reject/
    └── route.ts          ✓ Updated - calls backend API

app/dashboard/creators/
└── page.tsx              ✓ Enhanced - better error handling

lib/
└── server-utils.ts       ✓ Used - fetchBackend utility
```

### Dependencies

- `fetchBackend` - Server-side authenticated fetch
- `apiClient` - Client-side API calls with cookies
- Authentication cookies (idToken, refreshToken)

## Migration from Previous Version

### Before

```typescript
// Mock implementation
export async function PUT(request, { params }) {
  const { id } = params;
  console.log('Approving creator:', id);
  return NextResponse.json({ success: true });
}
```

### After

```typescript
// Real backend integration
export async function PUT(request, { params }) {
  const { id } = await params;
  
  const response = await fetchBackend('/changeCreatorStatus', {
    method: 'POST',
    body: JSON.stringify({ uid: id, status: 'approved' }),
  });
  
  const data = await response.json();
  return NextResponse.json({ 
    success: true, 
    data: data.creator 
  });
}
```

## Future Enhancements

Potential improvements:

1. **Toast Notifications**
   - Replace alert() with non-blocking toasts
   - Better UX with dismissible messages
   - Queue multiple notifications

2. **Optimistic Updates**
   - Update UI immediately
   - Rollback on error
   - Faster perceived performance

3. **Bulk Actions**
   - Select multiple creators
   - Approve/reject in batch
   - Progress indicator

4. **Undo Functionality**
   - Allow reverting recent actions
   - Time-limited undo window
   - Restore previous state

5. **Action History**
   - Log who approved/rejected
   - Timestamp of actions
   - Audit trail

6. **Custom Rejection Reasons**
   - Add reason field
   - Store in database
   - Show in creator profile

## Summary

✅ **Approve/Reject functionality complete:**
- Real backend API integration
- Automatic authentication
- Confirmation dialogs
- Error handling
- Loading states
- Success/error messages
- List auto-refresh
- Clean code structure

The approve and reject actions now work seamlessly with your backend API!

