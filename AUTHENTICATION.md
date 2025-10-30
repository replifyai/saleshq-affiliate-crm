# Authentication Implementation Guide

This document explains how authentication works in the SalesHQ Affiliate CRM application.

## Overview

The application uses a cookie-based authentication system with Context API for state management. Tokens are stored in HTTP-only cookies for security, and the admin profile is managed via React Context.

## Architecture

### 1. Authentication Flow

```
User Login → Backend API → Store Tokens in Cookies → Update Context → Redirect to Dashboard
```

### 2. Components

#### Auth Context (`context/AuthContext.tsx`)
- Manages admin profile state across the application
- Provides `login`, `logout`, and `updateAdmin` functions
- Automatically fetches admin profile on app load

#### API Client (`lib/api-client.ts`)
- Handles all HTTP requests
- Automatically includes cookies in requests (`withCredentials: true`)
- Provides two sets of methods:
  - `get`, `post`, `put`, `delete` - for Next.js API routes (uses cookies automatically)
  - `getBackend`, `postBackend`, `putBackend`, `deleteBackend` - for direct backend calls (uses Authorization header)

#### Middleware (`middleware.ts`)
- Protects routes based on authentication status
- Checks for `idToken` cookie
- Redirects unauthenticated users to login
- Redirects authenticated users away from auth pages

## Token Storage

Tokens are stored in HTTP-only cookies:
- `idToken` - Primary authentication token
- `refreshToken` - Token for refreshing the idToken

**Why cookies over localStorage?**
- HTTP-only cookies are not accessible via JavaScript, preventing XSS attacks
- Cookies are automatically sent with requests
- More secure for storing sensitive tokens

## Usage Examples

### 1. Using Auth Context in Components

```typescript
'use client';

import { useAuth } from '@/context/AuthContext';

export default function MyComponent() {
  const { admin, logout, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!admin) {
    return <div>Not authenticated</div>;
  }

  return (
    <div>
      <p>Welcome, {admin.name}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### 2. Making API Calls from Client Components

#### To Next.js API Routes (recommended for most cases)
```typescript
import { apiClient } from '@/lib/api-client';

// Cookies are automatically included
const data = await apiClient.get('/dashboard/stats');
const result = await apiClient.post('/creators', { name: 'John' });
```

#### To Backend API Directly
```typescript
import { apiClient } from '@/lib/api-client';

// Authorization header with idToken is automatically added
const data = await apiClient.getBackend('/someEndpoint');
const result = await apiClient.postBackend('/anotherEndpoint', { data: 'value' });
```

### 3. Making Backend API Calls from Server Components/API Routes

#### Using the Server Utility (Recommended)
```typescript
import { fetchBackend } from '@/lib/server-utils';

export async function GET() {
  try {
    // Automatically includes Authorization header from cookies
    const response = await fetchBackend('/api/creators');
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
```

#### Manual Approach
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAuthTokens } from '@/lib/server-utils';

export async function GET(request: NextRequest) {
  const { idToken } = await getAuthTokens();
  
  if (!idToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const response = await fetch('https://dashboardapi-dkhjjaxofq-el.a.run.app/api/creators', {
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  return NextResponse.json(data);
}
```

## API Routes

### Login
**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "adminProfile": {
    "id": "string",
    "name": "string",
    "email": "user@example.com",
    "createdAt": 0
  }
}
```

**Cookies Set:**
- `idToken` (HTTP-only)
- `refreshToken` (HTTP-only)

### Logout
**Endpoint:** `POST /api/auth/logout`

Clears authentication cookies and returns success message.

### Get Profile
**Endpoint:** `GET /api/auth/profile`

Returns the current admin profile based on cookies.

## Security Considerations

1. **HTTP-only Cookies:** Tokens are stored in HTTP-only cookies, making them inaccessible to JavaScript
2. **Secure Flag:** In production, cookies use the `secure` flag (HTTPS only)
3. **SameSite:** Cookies use `SameSite=Lax` to prevent CSRF attacks
4. **Token Expiration:** Cookies expire after 7 days
5. **Middleware Protection:** Routes are protected at the middleware level

## Environment Variables

Create a `.env.local` file:

```env
# Backend API URL
NEXT_PUBLIC_BACKEND_API_URL=https://dashboardapi-dkhjjaxofq-el.a.run.app

# Node Environment
NODE_ENV=production
```

## Best Practices

1. **Always use the provided utilities:**
   - Client-side: Use `apiClient` methods
   - Server-side: Use `fetchBackend` or `getAuthTokens`

2. **Don't access cookies directly:**
   - Use the Context API for admin profile
   - Use server utilities for API routes

3. **Handle authentication errors:**
   - The API client automatically redirects to login on 401 errors
   - Always check for `admin` in components before rendering protected content

4. **Logout properly:**
   - Use the `logout()` function from useAuth()
   - This clears cookies on the server side

## Troubleshooting

### User Not Staying Logged In
- Check that cookies are being set (browser DevTools > Application > Cookies)
- Verify middleware is checking for `idToken` cookie
- Ensure `withCredentials: true` is set in axios config

### API Calls Not Authenticated
- Verify tokens exist in cookies
- Check that Authorization header is being set correctly
- Confirm backend API endpoint is correct

### Context Not Updating
- Ensure AuthProvider wraps your component tree in `app/layout.tsx`
- Verify you're calling `login()` after successful authentication

