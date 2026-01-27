import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend, handleApiError } from '@/lib/server-utils';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { commissionData, discountToCustomer } = body;

    // Validate commissionData (backend changeCreatorStatus expects commissionValue as string)
    let commissionPayload: { commissionType: string; commissionValue: string; commissionBasis: string } | undefined;
    if (commissionData) {
      if (!commissionData.commissionType || !['fixed', 'percentage'].includes(commissionData.commissionType)) {
        return NextResponse.json(
          { success: false, error: 'Commission type must be fixed or percentage' },
          { status: 400 }
        );
      }
      const val = commissionData.commissionValue;
      const num = typeof val === 'string' ? parseFloat(val) : Number(val);
      if (val === undefined || val === null || val === '' || Number.isNaN(num) || num < 0) {
        return NextResponse.json(
          { success: false, error: 'Commission value must be a positive number or string' },
          { status: 400 }
        );
      }
      if (!commissionData.commissionBasis || !['subtotal_after_discounts', 'subtotal', 'total'].includes(commissionData.commissionBasis)) {
        return NextResponse.json(
          { success: false, error: 'Commission basis must be subtotal_after_discounts, subtotal, or total' },
          { status: 400 }
        );
      }
      commissionPayload = {
        commissionType: commissionData.commissionType,
        commissionValue: typeof val === 'string' ? val : String(val),
        commissionBasis: commissionData.commissionBasis,
      };
    }

    // POST changeCreatorStatus: { uid, status, discountToCustomer?, commissionData? }
    const requestBody: Record<string, unknown> = {
      uid: id,
      status: 'approved',
    };
    if (discountToCustomer != null && typeof discountToCustomer === 'object' && 'type' in discountToCustomer && 'value' in discountToCustomer) {
      requestBody.discountToCustomer = {
        type: discountToCustomer.type,
        value: typeof (discountToCustomer as { value: unknown }).value === 'number'
          ? (discountToCustomer as { value: number }).value
          : Number((discountToCustomer as { value: unknown }).value) || 0,
      };
    }
    if (commissionPayload) {
      requestBody.commissionData = commissionPayload;
    }

    const response = await fetchBackend('/changeCreatorStatus', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      return handleApiError(new Error('Backend request failed'), response);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Creator approved successfully',
      data: data.creator,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

