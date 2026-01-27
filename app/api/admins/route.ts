import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend, handleApiError } from '@/lib/server-utils';

interface AdminsRequestBody {
  page?: number;
  pageSize?: number;
  sort?: { by: string; direction: 'asc' | 'desc' };
}

export async function POST(request: NextRequest) {
  try {
    let body: AdminsRequestBody = {};
    try {
      const text = await request.text();
      if (text && text.trim()) {
        body = JSON.parse(text);
      }
    } catch (parseError) {
      console.error('Admins API JSON parse error:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { page = 1, pageSize = 20, sort = { by: 'createdAt', direction: 'asc' } } = body;

    const response = await fetchBackend('/getAllAdmins', {
      method: 'POST',
      body: JSON.stringify({
        page,
        pageSize,
        sort: {
          by: sort.by,
          direction: sort.direction,
        },
      }),
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
      console.error('Admins API error:', response.status, errorMessage);
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    const adminsData = data.admins || {};
    const items = adminsData.items || [];
    const total = adminsData.total ?? items.length;
    const totalPages = adminsData.totalPages ?? (Math.ceil(total / pageSize) || 1);

    return NextResponse.json({
      success: true,
      data: {
        items,
        page: adminsData.page ?? page,
        pageSize: adminsData.pageSize ?? pageSize,
        total,
        totalPages,
        hasNextPage: adminsData.hasNextPage ?? false,
        hasPrevPage: adminsData.hasPrevPage ?? false,
        appliedSort: adminsData.appliedSort ?? sort,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
