import { NextRequest, NextResponse } from 'next/server';
import { ExternalCoupon, Coupon, CouponType } from '@/types';
import { fetchBackend, handleApiError } from '@/lib/server-utils';

// Helper function to map external API coupon to internal format
function mapExternalCoupon(externalCoupon: ExternalCoupon): Coupon {
  console.log("externalCoupon",externalCoupon);
  // Determine coupon type and value
  let type: CouponType = 'percentage';
  let value = 0;

  let currencyCode: string | undefined;

  if (externalCoupon.value.type === 'percentage' && externalCoupon.value.percentage !== undefined) {
    type = 'percentage';
    value = externalCoupon.value.percentage;
  } else if ((externalCoupon.value.type === 'fixed_amount' || externalCoupon.value.type === 'amount') && externalCoupon.value.amount !== undefined) {
    type = 'fixed_amount';
    // Handle both string and number amounts
    value = typeof externalCoupon.value.amount === 'string' 
      ? parseFloat(externalCoupon.value.amount) 
      : externalCoupon.value.amount;
    // Extract currency code if available
    currencyCode = externalCoupon.value.currencyCode;
  }

  return {
    id: externalCoupon.id,
    code: externalCoupon.code,
    creatorId: externalCoupon.createdBy || '',
    creatorName: externalCoupon.createdBy || 'Unknown',
    type,
    value,
    currencyCode,
    title: externalCoupon.title,
    description: externalCoupon.description,
    usageCount: externalCoupon?.usageCount || 0, // Not provided by API
    usageLimit: externalCoupon.usageLimit || undefined,
    validFrom: externalCoupon.startsAt,
    validTo: externalCoupon.endsAt || undefined,
    minimumSpend: undefined, // Not provided by API
    active: externalCoupon.status === 'ACTIVE',
    createdAt: new Date(externalCoupon.createdAt).toISOString(),
    updatedAt: new Date(externalCoupon.updatedAt).toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const creatorId = searchParams.get('creatorId');
    const active = searchParams.get('active');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Call external API with authentication
    // Pass pagination and filter parameters to backend
    const requestBody = {
      ...(page && { page }),
      ...(limit && { limit: limit }),
      ...(creatorId && creatorId !== 'all' && { creatorId }),
      ...(active && active !== 'all' && { active: active === 'true' }),
      ...(search && { search }),
    };

    const response = await fetchBackend('/getAllCouponsForAdmin', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
console.log(response);
    if (!response.ok) {
      return handleApiError(new Error('Backend request failed'), response);
    }

    const data = await response.json();
    console.log("data",data);
    
    // Map external coupons to internal format
    let coupons: Coupon[] = (data.coupons || []).map(mapExternalCoupon);

    // Apply client-side filters if backend didn't handle them
    // (These filters are also sent to backend, but we apply them as fallback)
    if (creatorId && creatorId !== 'all') {
      coupons = coupons.filter((c) => c.creatorId === creatorId);
    }

    if (active && active !== 'all') {
      const isActive = active === 'true';
      coupons = coupons.filter((c) => c.active === isActive);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      coupons = coupons.filter((c) =>
        c.code.toLowerCase().includes(searchLower)
      );
    }

    // Extract pagination metadata from backend response
    // Support multiple common pagination response formats
    const backendPagination = data.pagination || data.meta || {};
    const backendTotal = data.total || backendPagination.total || backendPagination.totalItems || backendPagination.totalRecords;
    const backendPage = backendPagination.currentPage || backendPagination.page || page;
    const backendTotalPages = backendPagination.totalPages || (backendTotal ? Math.ceil(backendTotal / limit) : 1);
    const backendLimit = backendPagination.itemsPerPage || backendPagination.limit || backendPagination.pageSize || limit;

    // Use backend pagination metadata if available, otherwise calculate from filtered data
    const paginationMeta = {
      currentPage: backendPage,
      totalPages: backendTotalPages || Math.ceil(coupons.length / limit),
      totalItems: backendTotal || coupons.length,
      itemsPerPage: backendLimit,
    };

    // If backend provided total count, it likely already paginated
    // Otherwise, apply client-side pagination as fallback
    let paginatedCoupons = coupons;
    if (!backendTotal && coupons.length > limit) {
      // Backend didn't paginate, apply client-side pagination
      const start = (page - 1) * limit;
      const end = start + limit;
      paginatedCoupons = coupons.slice(start, end);
    }

    return NextResponse.json({
      success: true,
      data: {
        data: paginatedCoupons,
        meta: paginationMeta,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // TODO: Implement backend API call to create coupon
    return NextResponse.json(
      { success: false, error: 'Coupon creation not yet implemented' },
      { status: 501 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

