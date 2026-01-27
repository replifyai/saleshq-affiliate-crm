import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend, handleApiError } from '@/lib/server-utils';

interface CreateAdminBody {
  name: string;
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    let body: Partial<CreateAdminBody> = {};
    try {
      const text = await request.text();
      if (text && text.trim()) {
        body = JSON.parse(text);
      }
    } catch (parseError) {
      console.error('Create admin JSON parse error:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { name, email, password } = body;

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email and password are required' },
        { status: 400 }
      );
    }

    const response = await fetchBackend('/createAdminProfile', {
      method: 'POST',
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        password,
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
      console.error('Create admin API error:', response.status, errorMessage);
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: response.status }
      );
    }

    const data = (await response.json()) as {
      id?: string;
      name?: string;
      email?: string;
      createdAt?: number;
      password?: string | null;
    };

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        name: data.name,
        email: data.email,
        createdAt: data.createdAt ?? Date.now(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
