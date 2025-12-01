import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend, handleApiError } from '@/lib/server-utils';

export async function GET(request: NextRequest) {
  try {
    // Call external API to get all Shopify products
    const response = await fetchBackend('/getAllShopifyProducts', {
      method: 'GET',
    });

    if (!response.ok) {
      return handleApiError(new Error('Backend request failed'), response);
    }

    const data = await response.json();
    
    // Handle various possible response structures from backend
    // The actual structure is: { productCollection: { success: true, data: [...] } }
    let products: any[] = [];
    
    if (Array.isArray(data)) {
      products = data;
    } else if (data.productCollection && data.productCollection.data && Array.isArray(data.productCollection.data)) {
      // This is the actual structure from the backend
      products = data.productCollection.data;
    } else if (data.products && Array.isArray(data.products)) {
      products = data.products;
    } else if (data.data && Array.isArray(data.data)) {
      products = data.data;
    } else if (data.items && Array.isArray(data.items)) {
      products = data.items;
    }

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

