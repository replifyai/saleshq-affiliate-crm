import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend, handleApiError } from '@/lib/server-utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));

        if (!body.creatorId || !body.collectionId) {
            return NextResponse.json(
                { success: false, error: 'creatorId and collectionId are required' },
                { status: 400 }
            );
        }

        const response = await fetchBackend('/getResolvedProductsForCreator', {
            method: 'POST',
            body: JSON.stringify({
                creatorId: body.creatorId,
                collectionId: body.collectionId,
            }),
        });

        if (!response.ok) {
            return handleApiError(null, response);
        }

        const data = await response.json();
        return NextResponse.json(data); // Returns successful payload with `data` array of full Shopify products
    } catch (error) {
        return handleApiError(error);
    }
}
