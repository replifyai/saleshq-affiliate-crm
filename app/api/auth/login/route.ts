import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/server-utils';

const BACKEND_API_URL = 'https://dashboardapi-dkhjjaxofq-el.a.run.app';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Call the actual backend API
    const backendResponse = await fetch(`${BACKEND_API_URL}/createAdminLogin`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!backendResponse.ok) {
      return handleApiError(new Error('Backend request failed'), backendResponse);
    }

    const data = await backendResponse.json();
    const { adminProfile } = data;

    if (!adminProfile || !adminProfile.idToken || !adminProfile.refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Invalid response from server' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      adminProfile: {
        id: adminProfile.id,
        name: adminProfile.name,
        email: adminProfile.email,
        createdAt: adminProfile.createdAt,
      },
    });

    // Set cookies for tokens
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    };


    // Set new cookie names
    response.cookies.set('auth_token', adminProfile.idToken, cookieOptions);
    response.cookies.set('auth_refresh_token', adminProfile.refreshToken, cookieOptions);

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

