import { NextRequest, NextResponse } from 'next/server';
import { Order, OrdersResponse, OrderRequest } from '@/types';
import { fetchBackend, handleApiError } from '@/lib/server-utils';

export async function POST(request: NextRequest) {
  try {
    // Safely parse request body
    let body: Partial<OrderRequest> = {};
    try {
      const text = await request.text();
      if (text && text.trim()) {
        body = JSON.parse(text);
      }
    } catch (parseError) {
      // If JSON parsing fails, return error
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { page = 1, pageSize = 20, filters = {}, sort = { by: 'createdAt', direction: 'desc' } } = body;

    // Prepare request body for backend
    const requestBody = {
      page,
      pageSize,
      filters: {
        ...(filters.paymentStatus && { paymentStatus: filters.paymentStatus }),
        ...(filters.orderNumber && { orderNumber: filters.orderNumber }),
      },
      sort: {
        by: sort.by,
        direction: sort.direction,
      },
    };

    // Call backend API
    const response = await fetchBackend('/getOrdersForAdmin', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      return handleApiError(new Error('Backend request failed'), response);
    }

    const data = await response.json();

    // Backend response structure: { orders: { orders: [...], pagination: {...} } }
    // Extract orders and pagination from the nested structure
    const ordersObj = data.orders || {};
    const orders = ordersObj.orders || (Array.isArray(ordersObj) ? ordersObj : []);
    const backendPagination = ordersObj.pagination || {};
    
    // Extract pagination values with fallbacks
    const backendTotal = backendPagination.total || orders.length;
    const backendPage = backendPagination.page || page;
    const backendTotalPages = backendPagination.totalPages || (backendTotal ? Math.ceil(backendTotal / pageSize) : 1);
    const backendLimit = backendPagination.pageSize || pageSize;

    // Map backend pagination to our internal format
    const paginationMeta = {
      currentPage: backendPage,
      totalPages: backendTotalPages,
      totalItems: backendTotal,
      itemsPerPage: backendLimit,
    };

    return NextResponse.json({
      success: true,
      data: {
        data: orders,
        meta: paginationMeta,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

