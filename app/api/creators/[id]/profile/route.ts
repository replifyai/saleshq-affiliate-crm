import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend, handleApiError } from '@/lib/server-utils';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: uid } = await params;
    if (!uid) {
      return NextResponse.json(
        { success: false, error: 'Creator ID is required' },
        { status: 400 }
      );
    }

    const response = await fetchBackend('/getCreatorProfileForAdmin', {
      method: 'POST',
      body: JSON.stringify({ uid }),
    });

    if (!response.ok) {
      let errorMessage = `Backend returned ${response.status} ${response.statusText}`;
      try {
        const text = await response.text();
        if (text) {
          try {
            const parsed = JSON.parse(text) as Record<string, unknown>;
            errorMessage =
              typeof parsed?.message === 'string'
                ? parsed.message
                : typeof parsed?.error === 'string'
                  ? parsed.error
                  : text.slice(0, 300);
          } catch {
            errorMessage = text.slice(0, 300);
          }
        }
      } catch (_) {
        // ignore
      }
      console.error('Creator profile API error:', response.status, errorMessage);
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: response.status }
      );
    }

    const body = await response.json();
    // Backend returns { profile, stats, coupons, managedByName, ... } or { data: { profile, ... } }
    const data = body.data ?? body;

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
