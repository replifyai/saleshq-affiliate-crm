import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/server-utils';

// Get dashboard stats with authentication
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query parameters for backend API
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    // Make authenticated request to backend API
    // The fetchBackend utility automatically includes the idToken from cookies
    const endpoint = `/api/dashboard/stats${params.toString() ? `?${params.toString()}` : ''}`;
    
    // For now, using mock data since we don't have the actual backend endpoint
    // Replace this with: const response = await fetchBackend(endpoint);
    // when the backend endpoint is available
    const mockStats = {
      totalRevenue: 125000,
      totalOrders: 1250,
      totalCreators: 150,
      activeCreators: 120,
      pendingCreators: 15,
      totalCoupons: 85,
      activeCoupons: 75,
      conversionRate: 3.5,
      averageOrderValue: 100,
    };

    // Example of how to use fetchBackend when the endpoint is ready:
    // const response = await fetchBackend(endpoint);
    // if (!response.ok) {
    //   throw new Error('Failed to fetch stats from backend');
    // }
    // const data = await response.json();

    return NextResponse.json({
      success: true,
      data: mockStats,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

