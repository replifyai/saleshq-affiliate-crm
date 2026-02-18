import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend, handleApiError } from '@/lib/server-utils';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: creatorId } = await params;
        if (!creatorId) {
            return NextResponse.json(
                { success: false, error: 'Creator ID is required' },
                { status: 400 }
            );
        }

        const body = await request.json().catch(() => ({}));

        const response = await fetchBackend(`/creators/${creatorId}/payout/initiate`, {
            method: 'POST',
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
