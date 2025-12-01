import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend, handleApiError } from '@/lib/server-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Product IDs are required' },
        { status: 400 }
      );
    }

    const response = await fetchBackend('/getShopifyProductsByIds', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      return handleApiError(new Error('Backend request failed'), response);
    }

    const data = await response.json();
    
    // Response structure: { products: [...] }
    const products = data.products || [];

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

