# Quick Start Guide - Authentication

This guide will help you quickly understand and use the authentication system in the SalesHQ Affiliate CRM.

## Table of Contents
1. [Overview](#overview)
2. [Quick Examples](#quick-examples)
3. [Common Patterns](#common-patterns)
4. [Troubleshooting](#troubleshooting)

## Overview

**Authentication Method:** Cookie-based with Context API  
**Token Storage:** HTTP-only cookies (`idToken`, `refreshToken`)  
**State Management:** React Context (`AuthContext`)

## Quick Examples

### 1. Access Current User in Component

```typescript
'use client';

import { useAuth } from '@/context/AuthContext';

export default function MyPage() {
  const { admin, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!admin) return <div>Not authenticated</div>;

  return (
    <div>
      <h1>Welcome, {admin.name}!</h1>
      <p>Email: {admin.email}</p>
      <p>ID: {admin.id}</p>
    </div>
  );
}
```

### 2. Make an API Call (Client-Side)

```typescript
import { apiClient } from '@/lib/api-client';

// Example: Fetch creators
async function fetchCreators() {
  try {
    const response = await apiClient.get('/creators');
    console.log(response);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example: Create a creator
async function createCreator(data) {
  try {
    const response = await apiClient.post('/creators', data);
    console.log('Created:', response);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### 3. Protected API Route (Server-Side)

```typescript
// app/api/my-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/server-utils';

export async function GET(request: NextRequest) {
  try {
    // This automatically includes the idToken from cookies
    const response = await fetchBackend('/backend-endpoint');
    
    if (!response.ok) {
      throw new Error('Backend request failed');
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch' },
      { status: 500 }
    );
  }
}
```

### 4. Logout User

```typescript
'use client';

import { useAuth } from '@/context/AuthContext';

export default function LogoutButton() {
  const { logout } = useAuth();

  return (
    <button onClick={logout}>
      Logout
    </button>
  );
}
```

## Common Patterns

### Pattern 1: Conditional Rendering Based on Auth

```typescript
'use client';

import { useAuth } from '@/context/AuthContext';

export default function ConditionalComponent() {
  const { admin } = useAuth();

  return (
    <div>
      {admin ? (
        <div>Authenticated content for {admin.name}</div>
      ) : (
        <div>Please log in</div>
      )}
    </div>
  );
}
```

### Pattern 2: Fetch Data on Component Mount

```typescript
'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

export default function DataComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await apiClient.get('/dashboard/stats');
        setData(result.data);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>No data</div>;

  return <div>{/* Render your data */}</div>;
}
```

### Pattern 3: Form Submission with API Call

```typescript
'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

export default function CreateForm() {
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/creators', formData);
      console.log('Success:', response);
      // Reset form or redirect
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

### Pattern 4: Server Action with Authentication

```typescript
// app/api/my-action/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthTokens } from '@/lib/server-utils';

export async function POST(request: NextRequest) {
  try {
    // Get tokens from cookies
    const { idToken } = await getAuthTokens();
    
    if (!idToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Make backend API call with token
    const response = await fetch('https://dashboardapi-dkhjjaxofq-el.a.run.app/endpoint', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
```

## Key Files Reference

| File | Purpose |
|------|---------|
| `context/AuthContext.tsx` | Auth state management |
| `lib/api-client.ts` | HTTP client for API calls |
| `lib/server-utils.ts` | Server-side auth utilities |
| `middleware.ts` | Route protection |
| `app/api/auth/login/route.ts` | Login endpoint |
| `app/api/auth/logout/route.ts` | Logout endpoint |

## Troubleshooting

### Issue: "useAuth must be used within an AuthProvider"
**Solution:** Make sure `AuthProvider` wraps your app in `app/layout.tsx`

### Issue: API calls return 401 Unauthorized
**Solution:** 
1. Check if you're logged in (idToken cookie exists)
2. Verify the token hasn't expired
3. Try logging out and logging back in

### Issue: Admin profile is null
**Solution:**
1. Check browser console for errors
2. Verify `/api/auth/profile` returns data
3. Make sure cookies are enabled in browser

### Issue: Logout doesn't work
**Solution:**
1. Use `logout()` from `useAuth()` hook
2. Don't manually delete cookies from client-side
3. Check `/api/auth/logout` is being called

### Issue: Can't read cookies in API route
**Solution:**
1. Use `await cookies()` (async function)
2. Import from `next/headers`, not `next/server`
3. Only works in Server Components and API Routes

## TypeScript Types

```typescript
// Admin Profile
interface AdminProfile {
  id: string;
  name: string;
  email: string;
  createdAt: number;
  idToken: string;
  refreshToken: string;
}

// Auth Context Type
interface AuthContextType {
  admin: AdminProfile | null;
  isLoading: boolean;
  login: (adminProfile: AdminProfile) => void;
  logout: () => void;
  updateAdmin: (adminProfile: AdminProfile) => void;
}
```

## Best Practices

1. ✅ **Always use the Auth Context** for accessing user info
2. ✅ **Use apiClient methods** for making HTTP requests
3. ✅ **Use server utilities** in API routes for backend calls
4. ✅ **Check loading states** before rendering auth-dependent content
5. ✅ **Handle errors gracefully** in API calls
6. ❌ **Don't access cookies directly** from client components
7. ❌ **Don't store tokens in localStorage**
8. ❌ **Don't bypass the apiClient** for authenticated requests

## Need More Help?

- Full documentation: `AUTHENTICATION.md`
- Backend API integration: `lib/server-utils.ts`
- Example implementations: Check `app/auth/login/page.tsx` and `components/layout/Sidebar.tsx`

