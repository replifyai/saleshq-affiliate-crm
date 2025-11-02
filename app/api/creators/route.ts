import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend, handleApiError } from '@/lib/server-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { page = 1, pageSize = 20, filters = {}, sort = {} } = body;

    // Build request body for backend API
    const requestBody = {
      page,
      pageSize,
      filters: {
        ...(filters.approved && { approved: filters.approved }),
        ...(filters.phoneNumberVerified !== undefined && { phoneNumberVerified: filters.phoneNumberVerified }),
      },
      sort: {
        by: sort.by || 'createdAt',
        direction: sort.direction || 'desc',
      },
    };

    // Call backend API with authentication
    const response = await fetchBackend('/getCreatorsDashboard', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      return handleApiError(new Error('Backend request failed'), response);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data.creators,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

