import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend, handleApiError } from '@/lib/server-utils';
import { CommissionData } from '@/types';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { commissionData } = body;

    // Validate commissionData
    if (commissionData) {
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

    // Call backend API to approve creator
    const requestBody: any = {
      uid: id,
      status: 'approved',
    };

    // Add commissionData if provided
    if (commissionData) {
      requestBody.commissionData = commissionData;
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

