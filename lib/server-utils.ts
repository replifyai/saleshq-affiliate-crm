import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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

/**
 * Centralized error handler for API routes
 * Extracts the exact error message from backend responses
 */
export async function handleApiError(
  error: unknown,
  response?: Response
): Promise<NextResponse> {
  console.error('API Error:', error);

  // Try to extract error from backend response
  if (response && !response.ok) {
    try {
      // Clone the response so we can read the body without consuming the original
      let responseToRead: Response | null = null;
      try {
        responseToRead = response.clone();
      } catch (cloneError) {
        // Body might already be consumed, continue without cloning
      }

      if (responseToRead) {
        const errorData = await responseToRead.json().catch(() => null);
        
        if (errorData) {
          // Try common error field names
          const errorMessage =
            errorData.message ||
            errorData.error ||
            errorData.errorMessage ||
            errorData.msg ||
            (typeof errorData === 'string' ? errorData : null) ||
            'An error occurred';

          return NextResponse.json(
            { success: false, error: errorMessage },
            { status: response.status }
          );
        }
      }
    } catch (parseError) {
      // If JSON parsing fails, try to get text
      try {
        let textResponse: Response | null = null;
        try {
          textResponse = response.clone();
        } catch (cloneError) {
          // Body might already be consumed
        }

        if (textResponse) {
          const errorText = await textResponse.text().catch(() => null);
          if (errorText) {
            return NextResponse.json(
              { success: false, error: errorText },
              { status: response.status }
            );
          }
        }
      } catch (textError) {
        // Fall through to status-based error
      }
    }

    // If no error data but response is not ok, return status-based error
    return NextResponse.json(
      { success: false, error: `Backend returned ${response.status} ${response.statusText}` },
      { status: response.status }
    );
  }

  // Handle JavaScript errors
  if (error instanceof Error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  // Fallback for unknown errors
  return NextResponse.json(
    { success: false, error: 'An unexpected error occurred' },
    { status: 500 }
  );
}

/**
 * Wrapper to handle backend response errors
 * Extracts error message from backend response if not ok
 */
export async function handleBackendResponse(
  response: Response
): Promise<Response> {
  if (!response.ok) {
    // Don't throw here, let the caller use handleApiError
    return response;
  }
  return response;
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

