import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend, handleApiError } from '@/lib/server-utils';

export async function GET() {
    try {
        const response = await fetchBackend('/payment-config');

        if (!response.ok) {
            return handleApiError(null, response);
        }

        const body = await response.json();
        return NextResponse.json({ success: true, data: body.data ?? body });
    } catch (error) {
        return handleApiError(error);
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();

        const response = await fetchBackend('/payment-config', {
            method: 'PUT',
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            return handleApiError(null, response);
        }

        const data = await response.json();
        return NextResponse.json({ success: true, data: data.data ?? data });
    } catch (error) {
        return handleApiError(error);
    }
}
