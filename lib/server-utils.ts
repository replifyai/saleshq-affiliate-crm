import { cookies } from 'next/headers';

/**
 * Server-side utility to get authentication tokens from cookies
 * Use this in API routes to fetch tokens for backend API calls
 */
export async function getAuthTokens() {
  const cookieStore = await cookies();
  const idToken = cookieStore.get('idToken')?.value;
  const refreshToken = cookieStore.get('refreshToken')?.value;

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
  const headers = await getBackendHeaders();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'https://dashboardapi-dkhjjaxofq-el.a.run.app';

  const response = await fetch(`${backendUrl}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  return response;
}

