// app/api/offer-creator/benchmarks/route.ts - FIXED
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { INDUSTRY_BENCHMARKS, getIndustryBenchmark } from '@/utils/offerCreator.utils';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';

const RATE_LIMITS = {
  BENCHMARKS: {
    limit: 100,
    window: 3600 // 1 hour
  }
};

export async function GET(req: NextRequest) {
  try {
    console.log('🚀 Benchmarks API Route called');

    // ✅ SIMPLE AUTH (same as cold email)
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore
    });

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      console.error('❌ Auth failed:', error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.id);

    // Rate limiting for benchmarks
    const rateLimitResult = await rateLimit(
      `offer_benchmarks:${user.id}`,
      RATE_LIMITS.BENCHMARKS.limit,
      RATE_LIMITS.BENCHMARKS.window
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Benchmarks rate limit exceeded.',
          retryAfter: rateLimitResult.reset
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const industry = searchParams.get('industry');

    console.log('📊 Fetching benchmarks for industry:', industry || 'all');

    let responseData;
    if (industry) {
      // Return specific industry benchmark
      const benchmark = getIndustryBenchmark(industry);
      responseData = {
        industry,
        benchmark,
        industrySpecific: benchmark
      };
    } else {
      // Return all industry benchmarks
      responseData = {
        benchmarks: INDUSTRY_BENCHMARKS,
        industries: Object.keys(INDUSTRY_BENCHMARKS)
      };
    }

    // Log usage for benchmarks
    await logUsage({
      userId: user.id,
      feature: 'offer_benchmarks',
      tokens: 0, // No AI tokens used
      timestamp: new Date(),
      metadata: {
        industry,
        requestType: industry ? 'specific' : 'all'
      }
    });

    return NextResponse.json({
      success: true,
      data: responseData,
      meta: {
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('💥 Benchmarks Fetch Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch benchmarks' },
      { status: 500 }
    );
  }
}