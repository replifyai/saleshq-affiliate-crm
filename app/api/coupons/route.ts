import { NextRequest, NextResponse } from 'next/server';
import { ExternalCoupon, Coupon, CouponType } from '@/types';
import { fetchBackend } from '@/lib/server-utils';

// Helper function to map external API coupon to internal format
function mapExternalCoupon(externalCoupon: ExternalCoupon): Coupon {
  // Determine coupon type and value
  let type: CouponType = 'percentage';
  let value = 0;

  if (externalCoupon.value.type === 'percentage' && externalCoupon.value.percentage !== undefined) {
    type = 'percentage';
    value = externalCoupon.value.percentage;
  } else if (externalCoupon.value.type === 'fixed_amount' && externalCoupon.value.amount !== undefined) {
    type = 'fixed_amount';
    value = externalCoupon.value.amount;
  }

  return {
    id: externalCoupon.id,
    code: externalCoupon.code,
    creatorId: externalCoupon.createdBy || '',
    creatorName: externalCoupon.createdBy || 'Unknown',
    type,
    value,
    title: externalCoupon.title,
    description: externalCoupon.description,
    usageCount: 0, // Not provided by API
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
    const response = await fetchBackend('/getAllCouponsForAdmin', {
      method: 'POST',
      body: '',
    });
console.log(response);
    if (!response.ok) {
      throw new Error('Failed to fetch coupons from external API');
    }

    const data = await response.json();
    
    // Map external coupons to internal format
    let coupons: Coupon[] = data.coupons.map(mapExternalCoupon);

    // Apply filters
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

    // Pagination
    const totalItems = coupons.length;
    const totalPages = Math.ceil(totalItems / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedCoupons = coupons.slice(start, end);

    return NextResponse.json({
      success: true,
      data: {
        data: paginatedCoupons,
        meta: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch coupons' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // TODO: Replace with actual backend call to create coupon
    console.log('Creating coupon:', body);

    // Mock response
    const newCoupon = {
      id: Math.random().toString(36).substr(2, 9),
      code: `CODE${Math.floor(Math.random() * 10000)}`,
      creatorId: body.creatorId,
      creatorName: 'Creator Name',
      type: body.type,
      value: body.value,
      title: body.title || '',
      description: body.description || '',
      usageCount: 0,
      usageLimit: body.usageLimit,
      validFrom: body.validFrom,
      validTo: body.validTo,
      minimumSpend: body.minimumSpend,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockCoupons.push(newCoupon);

    return NextResponse.json({
      success: true,
      data: newCoupon,
      message: 'Coupon created successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create coupon' },
      { status: 500 }
    );
  }
}

