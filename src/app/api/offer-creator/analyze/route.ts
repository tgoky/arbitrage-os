// app/api/offer-creator/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { OfferCreatorService } from '../../../../services/offerCreator.service';
import { validateAnalysisRequest } from '../../../validators/offerCreator.validator';
import { rateLimit } from '@/lib/rateLimit';

const RATE_LIMITS = {
  ANALYSIS: {
    limit: 10,
    window: 3600 // 1 hour
  }
};

function getIndustryBenchmark(industry: string) {
  // Sample benchmark data - replace with actual implementation
  const benchmarks: Record<string, any> = {
    'B2B SaaS': {
      conversionRate: { min: 2, max: 5, average: 3.5 },
      clickThroughRate: { min: 3, max: 8, average: 5.5 }
    },
    'E-commerce': {
      conversionRate: { min: 1, max: 3, average: 2.1 },
      clickThroughRate: { min: 2, max: 6, average: 4.2 }
    }
  };
  
  return benchmarks[industry] || benchmarks['General'] || {
    conversionRate: { min: 2, max: 4, average: 3 },
    clickThroughRate: { min: 3, max: 7, average: 5 }
  };
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore
    });

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting for analysis requests
    const rateLimitResult = await rateLimit(
      `analysis:${user.id}`,
      RATE_LIMITS.ANALYSIS.limit,
      RATE_LIMITS.ANALYSIS.window
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many analysis requests. Please try again later.',
          retryAfter: rateLimitResult.reset
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validation = validateAnalysisRequest(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.errors },
        { status: 400 }
      );
    }

    if (!validation.data) {
      return NextResponse.json(
        { error: 'No valid data provided' },
        { status: 400 }
      );
    }

    const { offerText, industry, analysisType } = validation.data;

    // Analyze offer with service
    const offerService = new OfferCreatorService();
    const analysis = await offerService.analyzeOffer(validation.data);

    // Get industry benchmark for context
    const benchmark = industry ? getIndustryBenchmark(industry) : null;

    return NextResponse.json({
      success: true,
      data: {
        originalOffer: offerText,
        analysisType,
        analysis,
        benchmark
      },
      meta: {
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('Offer Analysis Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze offer' },
      { status: 500 }
    );
  }
}