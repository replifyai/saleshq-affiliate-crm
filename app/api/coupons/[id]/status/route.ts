import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend, handleApiError } from '@/lib/server-utils';
import { ExternalCoupon, CommissionData } from '@/types';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log("id",id);
    const body = await request.json();
    const { status, commissionData } = body;
    console.log("body",body);
    console.log("status",status);
    if (!status || (status !== 'ACTIVE' && status !== 'INACTIVE')) {
      return NextResponse.json(
        { success: false, error: 'Status must be ACTIVE or INACTIVE' },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Coupon ID is required' },
        { status: 400 }
      );
    }

    // Validate commissionData if status is ACTIVE
    if (status === 'ACTIVE' && commissionData) {
      if (!commissionData.commissionType || !['fixed', 'percentage'].includes(commissionData.commissionType)) {
        return NextResponse.json(
          { success: false, error: 'Commission type must be fixed or percentage' },
          { status: 400 }
        );
      }
      
      if (commissionData.commissionValue === undefined || commissionData.commissionValue < 0) {
        return NextResponse.json(
          { success: false, error: 'Commission value must be a positive number' },
          { status: 400 }
        );
      }
      
      if (!commissionData.commissionBasis || !['subtotal_after_discounts', 'subtotal', 'total'].includes(commissionData.commissionBasis)) {
        return NextResponse.json(
          { success: false, error: 'Commission basis must be subtotal_after_discounts, subtotal, or total' },
          { status: 400 }
        );
      }
    }

    // Call backend API to change coupon status
    // The route parameter 'id' (coupon.id from frontend) is passed as 'couponId' to match the backend API format
    const requestBody: any = {
      couponId: id, // This is the coupon.id from the coupon data
      status: status,
    };

    // Add commissionData if provided
    if (commissionData) {
      requestBody.commissionData = commissionData;
    }

    console.log('Changing coupon status:', requestBody);

    const response = await fetchBackend('/changeCouponStatus', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
console.log("response",response);
    if (!response.ok) {
      return handleApiError(new Error('Backend request failed'), response);
    }

    const data = await response.json() as { coupon: ExternalCoupon };

    return NextResponse.json({
      success: true,
      message: `Coupon status changed to ${status}`,
      data: {
        id: data.coupon.id,
        code: data.coupon.code,
        status: data.coupon.status,
        active: data.coupon.status === 'ACTIVE',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

