import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend, handleApiError } from '@/lib/server-utils';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Call backend API to approve creator
    const response = await fetchBackend('/changeCreatorStatus', {
      method: 'POST',
      body: JSON.stringify({
        uid: id,
        status: 'approved',
      }),
    });

    if (!response.ok) {
      return handleApiError(new Error('Backend request failed'), response);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Creator approved successfully',
      data: data.creator,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

