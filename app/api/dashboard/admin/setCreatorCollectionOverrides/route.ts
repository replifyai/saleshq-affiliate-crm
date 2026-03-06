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

        const response = await fetchBackend('/setCreatorCollectionOverrides', {
            method: 'POST',
            body: JSON.stringify({
                creatorId: body.creatorId,
                collectionId: body.collectionId,
                addedProductIds: body.addedProductIds || [],
                removedProductIds: body.removedProductIds || [],
            }),
        });

        if (!response.ok) {
            return handleApiError(null, response);
        }

        const data = await response.json();
        return NextResponse.json(data); // Returns the updated override configuration record
    } catch (error) {
        return handleApiError(error);
    }
}
