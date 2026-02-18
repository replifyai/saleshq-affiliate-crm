import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend, handleApiError } from '@/lib/server-utils';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        let endpoint = '/payouts/summary';
        const params = new URLSearchParams();
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        if (params.toString()) endpoint += `?${params.toString()}`;

        const response = await fetchBackend(endpoint);

        if (!response.ok) {
            return handleApiError(null, response);
        }

        const body = await response.json();
        return NextResponse.json({ success: true, data: body.data ?? body });
    } catch (error) {
        return handleApiError(error);
    }
}
