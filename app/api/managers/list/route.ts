import { NextResponse } from 'next/server';
import { fetchBackend, handleApiError } from '@/lib/server-utils';

export interface ManagerListItem {
  id: string;
  name: string;
}

/** GET /api/managers/list - returns managers for assign dropdown (getManagersList) */
export async function GET() {
  try {
    const response = await fetchBackend('/getManagersList', {
      method: 'GET',
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
      console.error('Managers list API error:', response.status, errorMessage);
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: response.status }
      );
    }

    const data = (await response.json()) as { managers?: ManagerListItem[] };
    const managers = Array.isArray(data.managers) ? data.managers : [];

    return NextResponse.json({
      success: true,
      data: { managers },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
