import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/server-utils';

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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to approve creator');
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Creator approved successfully',
      data: data.creator,
    });
  } catch (error) {
    console.error('Approve creator error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to approve creator' },
      { status: 500 }
    );
  }
}

