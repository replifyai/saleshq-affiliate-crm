import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/server-utils';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Call backend API to reject creator
    const response = await fetchBackend('/changeCreatorStatus', {
      method: 'POST',
      body: JSON.stringify({
        uid: id,
        status: 'rejected',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to reject creator');
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Creator rejected successfully',
      data: data.creator,
    });
  } catch (error) {
    console.error('Reject creator error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to reject creator' },
      { status: 500 }
    );
  }
}

