import { cookies } from 'next/headers';

/**
 * Server-side utility to get authentication tokens from cookies
 * Use this in API routes to fetch tokens for backend API calls
 */
export async function getAuthTokens() {
  const cookieStore = await cookies();
  const idToken = cookieStore.get('auth_token')?.value;
  const refreshToken = cookieStore.get('auth_refresh_token')?.value;

  return {
    idToken,
    refreshToken,
  };
}

/**
 * Server-side utility to create headers for backend API calls
 * This includes the authorization token from cookies
 */
export async function getBackendHeaders() {
  const { idToken } = await getAuthTokens();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'accept': 'application/json',
  };

  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  return headers;
}

/**
 * Server-side utility to make authenticated requests to the backend API
 */
export async function fetchBackend(
  endpoint: string,
  options: RequestInit = {}
) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'https://dashboardapi-dkhjjaxofq-el.a.run.app';

  // Helper to actually perform the request with the latest token from cookies
  const performRequest = async () => {
    const headers = await getBackendHeaders();
    return fetch(`${backendUrl}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });
  };

  // First attempt
  let response = await performRequest();

  // If unauthorized, try to refresh once, then retry
  if (response.status === 401) {
    const refreshed = await ensureSingleFlightRefresh();
    if (refreshed) {
      response = await performRequest();
    }
  }

  return response;
}

/**
 * Attempt to refresh tokens using the refresh token cookie.
 * Returns true if tokens were successfully refreshed and cookies updated.
 */
export async function refreshTokens(): Promise<boolean> {
  const cookieStore = await cookies();
  const existingRefreshToken = cookieStore.get('auth_refresh_token')?.value;
  if (!existingRefreshToken) return false;

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'https://dashboardapi-dkhjjaxofq-el.a.run.app';
  const apiKey = process.env.BACKEND_API_KEY;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }
  headers['Authorization'] = `Bearer ${existingRefreshToken}`;

  const res = await fetch(`${backendUrl}/refresh`, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    return false;
  }

  const data = await res.json().catch(() => null) as { idToken?: string; refreshToken?: string } | null;
  if (!data?.idToken || !data?.refreshToken) return false;

  // Update cookies to persist new tokens
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  };

  cookieStore.set('auth_token', data.idToken, cookieOptions);
  cookieStore.set('auth_refresh_token', data.refreshToken, cookieOptions);

  return true;
}

// Single-flight guard for refresh to avoid multiple concurrent refresh calls
let refreshInFlight: Promise<boolean> | null = null;
async function ensureSingleFlightRefresh(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        return await refreshTokens();
      } finally {
        // Release the lock immediately after completion
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

