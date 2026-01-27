import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend, handleApiError } from '@/lib/server-utils';

// Get dashboard stats with authentication
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let startDate = searchParams.get('startDate');
    let endDate = searchParams.get('endDate');
    const creatorId = searchParams.get('creatorId') || '';

    // Default to last 24 hours if dates are not provided
    if (!startDate || !endDate) {
      const now = new Date();
      endDate = now.toISOString();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      startDate = yesterday.toISOString();
    }

    // Make POST request to analytics API
    const response = await fetchBackend('/getAnalytics', {
      method: 'POST',
      body: JSON.stringify({
        startDate,
        endDate,
        creatorId,
      }),
    });

    if (!response.ok) {
      // Read error body for logging and user feedback
      let errorMessage = `Backend returned ${response.status} ${response.statusText}`;
      try {
        const text = await response.text();
        if (text) {
          try {
            const parsed = JSON.parse(text) as Record<string, unknown>;
            const msg =
              typeof parsed?.message === 'string'
                ? parsed.message
                : typeof parsed?.error === 'string'
                  ? parsed.error
                  : text.slice(0, 300);
            errorMessage = msg;
          } catch {
            errorMessage = text.slice(0, 300);
          }
        }
      } catch (_) {
        // ignore
      }
      console.error('Analytics API error:', response.status, errorMessage);
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: response.status }
      );
    }

    const analyticsData = await response.json();
    
    // Map the analytics response to DashboardStats format
    const analytics = analyticsData.analytics || {};
    const salesBreakdown = analytics.salesBreakdown || {};

    // Map response to DashboardStats (totalCommissions, totalActiveAffiliates from new getAnalytics shape)
    const stats = {
      totalRevenue: analytics.totalRevenue || 0,
      totalOrders: analytics.totalOrders || 0,
      totalCommissions: analytics.totalCommissions ?? 0,
      totalActiveAffiliates: analytics.totalActiveAffiliates ?? 0,
      // These fields are not available in analytics API, set to 0
      totalCreators: 0,
      activeCreators: 0,
      pendingCreators: 0,
      totalCoupons: 0,
      activeCoupons: 0,
      conversionRate: 0,
      averageOrderValue: analytics.totalOrders > 0 ? (analytics.totalRevenue || 0) / analytics.totalOrders : 0,
      salesBreakdown: {
        grossSales: salesBreakdown.grossSales || 0,
        discounts: salesBreakdown.discounts || 0,
        taxes: salesBreakdown.taxes || 0,
        returns: salesBreakdown.returns || 0,
        payouts: salesBreakdown.payouts || 0,
        commissions: salesBreakdown.commissions ?? 0,
        totalSales: salesBreakdown.totalSales || 0,
      },
      salesBySocialChannel: analytics.salesBySocialChannel || {},
      salesByProduct: analytics.salesByProduct || {},
      topAffiliates: analytics.topAffiliates || [],
      topManagers: analytics.topManagers || [],
      dateRange: analytics.dateRange || {
        start: startDate.split('T')[0],
        end: endDate.split('T')[0],
      },
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

