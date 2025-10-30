# Authentication Flow Diagram

## Visual Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SalesHQ Affiliate CRM                        │
│                     Cookie-Based Authentication                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                           LOGIN FLOW                                │
└─────────────────────────────────────────────────────────────────────┘

    User Browser                Next.js App              Backend API
         │                           │                         │
         │  1. Enter credentials     │                         │
         │──────────────────────────>│                         │
         │                           │                         │
         │                           │  2. POST /createAdminLogin
         │                           │  { email, password }    │
         │                           │────────────────────────>│
         │                           │                         │
         │                           │  3. Return tokens       │
         │                           │  { adminProfile: {...,  │
         │                           │    idToken,             │
         │                           │    refreshToken } }     │
         │                           │<────────────────────────│
         │                           │                         │
         │                           │  4. Store in cookies    │
         │                           │  - idToken (HTTP-only)  │
         │                           │  - refreshToken         │
         │  5. Return profile        │    (HTTP-only)          │
         │  (without tokens)         │                         │
         │<──────────────────────────│                         │
         │                           │                         │
         │  6. Update Context        │                         │
         │  login(adminProfile)      │                         │
         │                           │                         │
         │  7. Redirect /dashboard   │                         │
         │                           │                         │


┌─────────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATED API CALL                         │
└─────────────────────────────────────────────────────────────────────┘

    User Browser           Next.js API Route         Backend API
         │                           │                         │
         │  1. apiClient.get(...)    │                         │
         │  (cookies auto-included)  │                         │
         │──────────────────────────>│                         │
         │                           │                         │
         │                           │  2. Read idToken from   │
         │                           │     cookies             │
         │                           │                         │
         │                           │  3. Backend API call    │
         │                           │  Authorization: Bearer  │
         │                           │  {idToken}              │
         │                           │────────────────────────>│
         │                           │                         │
         │                           │  4. Return data         │
         │                           │<────────────────────────│
         │                           │                         │
         │  5. Return response       │                         │
         │<──────────────────────────│                         │
         │                           │                         │


┌─────────────────────────────────────────────────────────────────────┐
│                          LOGOUT FLOW                                │
└─────────────────────────────────────────────────────────────────────┘

    User Browser                Next.js App
         │                           │
         │  1. Click logout button   │
         │  logout()                 │
         │──────────────────────────>│
         │                           │
         │                           │  2. POST /api/auth/logout
         │                           │                         
         │                           │  3. Clear cookies:
         │                           │  - idToken
         │  4. Clear context         │  - refreshToken
         │  admin = null             │                         
         │<──────────────────────────│
         │                           │
         │  5. Redirect /auth/login  │
         │                           │


┌─────────────────────────────────────────────────────────────────────┐
│                      COMPONENT ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────────┘

                        app/layout.tsx
                              │
                    ┌─────────┴─────────┐
                    │   AuthProvider    │  ← Context wraps entire app
                    │  (AuthContext)    │
                    └─────────┬─────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
         Dashboard         Sidebar          Login Page
         (useAuth)        (useAuth)         (useAuth)
            │                 │                 │
         Displays         Displays          Updates
        admin info      admin name +       context on
                         logout btn         success


┌─────────────────────────────────────────────────────────────────────┐
│                      SECURITY ARCHITECTURE                          │
└─────────────────────────────────────────────────────────────────────┘

  Token Storage:
  ┌──────────────────────────────────────────────┐
  │  Browser Cookies (HTTP-only)                 │
  │  ┌──────────────┐  ┌────────────────┐       │
  │  │   idToken    │  │ refreshToken   │       │
  │  │  (7 days)    │  │   (7 days)     │       │
  │  └──────────────┘  └────────────────┘       │
  │                                              │
  │  Properties:                                 │
  │  ✓ httpOnly: true  (No JS access)           │
  │  ✓ secure: true    (HTTPS only in prod)     │
  │  ✓ sameSite: lax   (CSRF protection)        │
  │  ✓ path: /         (All routes)             │
  └──────────────────────────────────────────────┘

  Context State:
  ┌──────────────────────────────────────────────┐
  │  AuthContext (Client-side)                   │
  │  {                                           │
  │    admin: {                                  │
  │      id: string,                             │
  │      name: string,                           │
  │      email: string,                          │
  │      createdAt: number                       │
  │    }                                         │
  │  }                                           │
  │                                              │
  │  ✓ No tokens in context                     │
  │  ✓ Non-sensitive data only                  │
  └──────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                      MIDDLEWARE PROTECTION                          │
└─────────────────────────────────────────────────────────────────────┘

    Every Request
         │
         ▼
    middleware.ts
         │
         ├─> /api/* ────────────────> Allow (handled by API routes)
         │
         ├─> /auth/login ───┬─> Has idToken cookie? ─> Redirect /dashboard
         │                  └─> No cookie? ──────────> Allow
         │
         └─> /dashboard ────┬─> Has idToken cookie? ─> Allow
                            └─> No cookie? ──────────> Redirect /auth/login


┌─────────────────────────────────────────────────────────────────────┐
│                        DATA FLOW SUMMARY                            │
└─────────────────────────────────────────────────────────────────────┘

  Client Component              API Client               API Route
       │                            │                        │
       │  apiClient.get(...)        │                        │
       │───────────────────────────>│                        │
       │                            │                        │
       │                   Cookies auto-included             │
       │                   (withCredentials: true)           │
       │                            │                        │
       │                            │  GET /api/endpoint    │
       │                            │  Cookie: idToken=...  │
       │                            │───────────────────────>│
       │                            │                        │
       │                            │         Read cookies   │
       │                            │         getAuthTokens()│
       │                            │                        │
       │                            │         Call backend   │
       │                            │         Authorization: │
       │                            │         Bearer {token} │
       │                            │                        │
       │                            │   Response data       │
       │                            │<──────────────────────│
       │                            │                        │
       │       Response             │                        │
       │<───────────────────────────│                        │
       │                            │                        │


┌─────────────────────────────────────────────────────────────────────┐
│                      KEY FILES REFERENCE                            │
└─────────────────────────────────────────────────────────────────────┘

  Authentication Layer:
    context/AuthContext.tsx ............... Global auth state
    lib/api-client.ts ..................... HTTP client with cookies
    lib/server-utils.ts ................... Server-side utilities
    middleware.ts ......................... Route protection

  API Endpoints:
    app/api/auth/login/route.ts ........... Login with backend
    app/api/auth/logout/route.ts .......... Clear cookies
    app/api/auth/profile/route.ts ......... Get user info

  Components:
    app/auth/login/page.tsx ............... Login form
    components/layout/Sidebar.tsx ......... User display + logout
    app/layout.tsx ........................ AuthProvider wrapper

  Types:
    types/index.ts ........................ AdminProfile, etc.

  Documentation:
    AUTHENTICATION.md ..................... Complete guide
    docs/QUICK_START.md ................... Quick reference
    IMPLEMENTATION_SUMMARY.md ............. What was built


┌─────────────────────────────────────────────────────────────────────┐
│                      SECURITY CHECKLIST                             │
└─────────────────────────────────────────────────────────────────────┘

  ✅ Tokens stored in HTTP-only cookies (not accessible via JS)
  ✅ Secure flag enabled in production (HTTPS only)
  ✅ SameSite=lax for CSRF protection
  ✅ No localStorage usage (completely removed)
  ✅ Tokens never in client-side state/context
  ✅ Automatic 401 redirect to login
  ✅ Middleware protects all routes
  ✅ Tokens auto-included in API calls
  ✅ Proper logout with cookie clearing
  ✅ Type-safe with TypeScript
  ✅ Error handling throughout
  ✅ Loading states for UX

```

