// app/api/offer-creator/[id]/performance/route.ts - WITH RATE LIMITING & USAGE
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { OfferCreatorService } from '../../../../../services/offerCreator.service';
import { validatePerformanceData } from '../../../../validators/offerCreator.validator';
import { rateLimit } from '@/lib/rateLimit'; // ✅ Add rate limiting
import { logUsage } from '@/lib/usage'; // ✅ Add usage logging

const RATE_LIMITS = {
  PERFORMANCE_UPDATE: {
    limit: 50,
    window: 3600 // 1 hour
  },
  PERFORMANCE_GET: {
    limit: 100,
    window: 3600 // 1 hour
  }
};

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore
    });

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ ADD RATE LIMITING for performance updates
    const rateLimitResult = await rateLimit(
      `offer_performance_update:${user.id}`,
      RATE_LIMITS.PERFORMANCE_UPDATE.limit,
      RATE_LIMITS.PERFORMANCE_UPDATE.window
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Performance update rate limit exceeded.',
          retryAfter: rateLimitResult.reset
        },
        { status: 429 }
      );
    }

    const offerId = params.id;
    const body = await req.json();

    const validation = validatePerformanceData(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid performance data', details: validation.errors },
        { status: 400 }
      );
    }

    if (!validation.data) {
      return NextResponse.json(
        { error: 'No valid performance data provided' },
        { status: 400 }
      );
    }

    const offerService = new OfferCreatorService();
    await offerService.updateOfferPerformance(user.id, offerId, validation.data);

    // Get updated performance data with insights
    const performanceData = await offerService.getOfferPerformance(user.id, offerId);

    // ✅ LOG USAGE for performance update - Using correct types
    await logUsage({
      userId: user.id,
      feature: 'offer_performance_update',
      tokens: 0, // No AI tokens for data update
      timestamp: new Date(),
      metadata: {
        offerId,
        metricsUpdated: Object.keys(validation.data),
        conversionRate: performanceData?.summary?.averageConversionRate || 0,
        totalConversions: performanceData?.summary?.totalConversions || 0,
        totalRevenue: performanceData?.summary?.totalRevenue || 0,
        trend: performanceData?.summary?.trend || 'no-data'
      }
    });

    return NextResponse.json({
      success: true,
      data: performanceData,
      meta: {
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('Performance Tracking Error:', error);
    return NextResponse.json(
      { error: 'Failed to record performance data' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore
    });

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ ADD RATE LIMITING for performance gets
    const rateLimitResult = await rateLimit(
      `offer_performance_get:${user.id}`,
      RATE_LIMITS.PERFORMANCE_GET.limit,
      RATE_LIMITS.PERFORMANCE_GET.window
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Performance fetch rate limit exceeded.',
          retryAfter: rateLimitResult.reset
        },
        { status: 429 }
      );
    }

    const offerId = params.id;
    const offerService = new OfferCreatorService();
    const performanceData = await offerService.getOfferPerformance(user.id, offerId);

    if (!performanceData) {
      return NextResponse.json(
        { error: 'Performance data not found' },
        { status: 404 }
      );
    }

    // ✅ LOG USAGE for performance fetch
    await logUsage({
      userId: user.id,
      feature: 'offer_performance_view',
      tokens: 0, // No AI tokens for viewing
      timestamp: new Date(),
      metadata: {
        offerId,
        action: 'view_performance'
      }
    });

    return NextResponse.json({
      success: true,
      data: performanceData,
      meta: {
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('Performance Fetch Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    );
  }
}
