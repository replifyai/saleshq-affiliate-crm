import { NextRequest, NextResponse } from 'next/server';
import { ProductCollection } from '@/types';
import { fetchBackend, handleApiError } from '@/lib/server-utils';

export async function GET(request: NextRequest) {
  try {
    // Call external API with authentication
    const response = await fetchBackend('/getAllProductCollectionsForAdmin', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      return handleApiError(new Error('Backend request failed'), response);
    }

    const data = await response.json();
    
    const collections: ProductCollection[] = data.productCollections || [];

    return NextResponse.json({
      success: true,
      data: collections,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.handle) {
      return NextResponse.json(
        { success: false, error: 'Name and handle are required' },
        { status: 400 }
      );
    }

    // Call external API to create collection
    const response = await fetchBackend('/createProductCollection', {
      method: 'POST',
      body: JSON.stringify({
        name: body.name,
        handle: body.handle,
        description: body.description || '',
        productIds: body.productIds || [],
      }),
    });

    if (!response.ok) {
      return handleApiError(new Error('Backend request failed'), response);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

