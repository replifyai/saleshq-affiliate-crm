import { NextRequest, NextResponse } from 'next/server';
import { ProductCollection } from '@/types';
import { fetchBackend, handleApiError } from '@/lib/server-utils';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Collection ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate that at least one field is being updated
    if (!body.name && !body.handle && body.description === undefined && !body.productIds) {
      return NextResponse.json(
        { success: false, error: 'At least one field (name, handle, description, or productIds) is required' },
        { status: 400 }
      );
    }

    // Build the request payload
    const requestBody: {
      id: string;
      name?: string;
      handle?: string;
      description?: string;
      productIds?: string[];
    } = {
      id,
    };

    if (body.name) {
      requestBody.name = body.name;
    }

    if (body.handle) {
      requestBody.handle = body.handle;
    }

    if (body.description !== undefined) {
      requestBody.description = body.description;
    }

    if (body.productIds) {
      requestBody.productIds = body.productIds;
    }

    // Call backend API to modify the collection
    const response = await fetchBackend('/modifyProductCollection', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      return handleApiError(new Error('Failed to modify product collection'), response);
    }

    const data = await response.json() as { productCollection: ProductCollection[] };

    return NextResponse.json({
      success: true,
      data: data.productCollection?.[0] || data,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Collection ID is required' },
        { status: 400 }
      );
    }

    // Call backend API to delete the collection
    const response = await fetchBackend('/deleteProductCollection', {
      method: 'POST',
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      return handleApiError(new Error('Failed to delete product collection'), response);
    }

    const data = await response.json() as { productCollection: { rowCount: number } };

    return NextResponse.json({
      success: true,
      message: 'Collection deleted successfully',
      data: data.productCollection,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
