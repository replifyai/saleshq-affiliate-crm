# Affiliate CRM Dashboard

Enterprise-grade CRM dashboard for managing affiliate programs with creators and coupons.

## Features

### Authentication
- Login page with backend API integration
- Cookie-based token storage (HTTP-only for security)
- React Context API for state management
- Protected routes via Next.js middleware
- Automatic token refresh support
- Secure session management (no localStorage)

### Dashboard
- Overview statistics (revenue, orders, creators, coupons)
- Date filter (24 hours, 7 days, 30 days, 90 days)
- Real-time performance metrics
- Conversion rate tracking

### Creators Management
- List all creators with pagination
- Filter by status (pending, approved, rejected)
- Search by name or email
- Approve/Reject creator profiles
- View creator profile details including social media handles

### Coupons Management
- List all coupons with pagination
- Filter by active status
- Search by coupon code
- View usage statistics
- Assign coupons to creators
- Configure discount types (percentage, fixed amount, free shipping)

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Project Structure

```
├── app/
│   ├── auth/
│   │   └── login/          # Authentication page
│   ├── dashboard/
│   │   ├── page.tsx        # Main dashboard
│   │   ├── creators/       # Creators management
│   │   └── coupons/        # Coupons management
│   ├── api/                # API routes (proxies to backend)
│   │   ├── auth/
│   │   │   ├── login/      # Login endpoint
│   │   │   ├── logout/     # Logout endpoint
│   │   │   └── profile/    # Get user profile
│   │   ├── dashboard/
│   │   ├── creators/
│   │   └── coupons/
│   └── layout.tsx
├── components/
│   ├── ui/                 # Reusable UI components
│   └── layout/             # Layout components (Sidebar, DashboardLayout)
├── context/
│   └── AuthContext.tsx     # Auth state management with React Context
├── lib/
│   ├── api-client.ts       # Axios client with cookie support
│   ├── server-utils.ts     # Server-side auth utilities
│   └── utils.ts            # Utility functions
├── types/
│   └── index.ts            # TypeScript type definitions
├── docs/
│   └── QUICK_START.md      # Quick reference guide
├── AUTHENTICATION.md       # Detailed auth documentation
└── middleware.ts           # Route protection middleware
```

## Getting Started

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env.local` file in the root directory (optional, defaults are provided):

```env
# Backend API URL (already configured)
NEXT_PUBLIC_BACKEND_API_URL=https://dashboardapi-dkhjjaxofq-el.a.run.app

# Node Environment
NODE_ENV=development
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Login

The application connects to the real backend API at:
```
https://dashboardapi-dkhjjaxofq-el.a.run.app/createAdminLogin
```

Use valid credentials provided by your backend administrator.

## API Integration

The application uses a **cookie-based authentication system** with tokens stored in HTTP-only cookies. All API calls automatically include authentication tokens.

### Architecture

1. **Client → Next.js API Routes** (recommended)
   - Cookies automatically included
   - Use `apiClient.get()`, `apiClient.post()`, etc.

2. **Client → Backend API** (direct calls)
   - Authorization header automatically added
   - Use `apiClient.getBackend()`, `apiClient.postBackend()`, etc.

3. **Server → Backend API** (from API routes)
   - Use `fetchBackend()` utility from `lib/server-utils.ts`
   - Tokens automatically extracted from cookies

### Authentication Flow

```
1. User logs in → Calls backend API
2. Backend returns tokens (idToken, refreshToken)
3. Tokens stored in HTTP-only cookies
4. Context updated with admin profile
5. All subsequent API calls include tokens automatically
```

### Current API Routes

- `POST /api/auth/login` - User authentication (connects to backend)
- `POST /api/auth/logout` - Clear session cookies
- `GET /api/auth/profile` - Get current user profile
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/creators` - List creators
- `PUT /api/creators/[id]/approve` - Approve creator
- `PUT /api/creators/[id]/reject` - Reject creator
- `GET /api/coupons` - List coupons
- `POST /api/coupons` - Create coupon

### Quick Usage Examples

**Client Component:**
```typescript
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api-client';

export default function MyComponent() {
  const { admin } = useAuth();
  
  const fetchData = async () => {
    const data = await apiClient.get('/dashboard/stats');
    console.log(data);
  };
  
  return <div>Hello {admin?.name}</div>;
}
```

**API Route:**
```typescript
import { fetchBackend } from '@/lib/server-utils';

export async function GET() {
  const response = await fetchBackend('/endpoint');
  const data = await response.json();
  return NextResponse.json(data);
}
```

See `docs/QUICK_START.md` for more examples.

## Customization

This is a customizable product that can be distributed to clients. Key areas for customization:

1. **Branding**: Update colors and logo in Tailwind config
2. **Features**: Add/remove features in the sidebar navigation
3. **API Integration**: Connect to your specific backend API
4. **Data Fields**: Modify type definitions to match your data model

## Production Deployment

```bash
npm run build
npm start
```

## Enterprise Features

- Production-ready architecture
- TypeScript for type safety
- Modular component structure
- Reusable UI components
- Proper error handling
- Loading states
- Responsive design
- Accessibility considerations

## Security

- ✅ **HTTP-only cookies** - Tokens not accessible via JavaScript (prevents XSS)
- ✅ **Secure flag in production** - Cookies only sent over HTTPS
- ✅ **SameSite protection** - Prevents CSRF attacks
- ✅ **Middleware route protection** - Unauthorized users redirected
- ✅ **Token-based authentication** - idToken and refreshToken support
- ✅ **No localStorage** - Tokens never exposed to client-side scripts
- ✅ **Automatic token handling** - Tokens included in all API requests
- ✅ **401 auto-redirect** - Expired sessions automatically redirect to login

## Documentation

- **`AUTHENTICATION.md`** - Complete authentication guide with detailed examples
- **`docs/QUICK_START.md`** - Quick reference for common patterns
- **`lib/server-utils.ts`** - Server-side utilities documentation
- **`context/AuthContext.tsx`** - Auth Context API reference

## License

Custom license for distributed product.
