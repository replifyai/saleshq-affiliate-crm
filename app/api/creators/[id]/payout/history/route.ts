import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend, handleApiError } from '@/lib/server-utils';

export async function GET(
    _request: NextRequest,
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

        const response = await fetchBackend(`/creators/${creatorId}/payout/history`);

        if (!response.ok) {
            return handleApiError(null, response);
        }

        const body = await response.json();
        return NextResponse.json({ success: true, data: body.data ?? body });
    } catch (error) {
        return handleApiError(error);
    }
}
