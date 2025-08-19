// app/api/offer-creator/insights/route.ts - FIXED
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getIndustrySpecificTips, generateCopywritingVariations } from '@/utils/offerCreator.utils';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';

const RATE_LIMITS = {
  INSIGHTS: {
    limit: 50,
    window: 3600 // 1 hour
  }
};

export async function GET(req: NextRequest) {
  try {
    console.log('🚀 Insights API Route called');

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

    // Rate limiting for insights
    const rateLimitResult = await rateLimit(
      `offer_insights:${user.id}`,
      RATE_LIMITS.INSIGHTS.limit,
      RATE_LIMITS.INSIGHTS.window
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Insights rate limit exceeded.',
          retryAfter: rateLimitResult.reset
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const industry = searchParams.get('industry');
    const text = searchParams.get('text');
    const type = searchParams.get('type') as 'headline' | 'cta' | 'urgency';

    console.log('💡 Generating insights for:', { industry, text: text?.substring(0, 50), type });

    let data: any = {};

    // Get industry-specific tips
    if (industry) {
      data.industryTips = getIndustrySpecificTips(industry);
    }

    // Generate copywriting variations
    if (text && type) {
      data.variations = generateCopywritingVariations(text, type);
    }

    // Log usage for insights
    await logUsage({
      userId: user.id,
      feature: 'offer_insights',
      tokens: 0, // No AI tokens used for static insights
      timestamp: new Date(),
      metadata: {
        industry,
        textType: type,
        hasText: !!text,
        hasIndustry: !!industry
      }
    });

    // ✅ FIXED: Added missing return statement
    return NextResponse.json({
      success: true,
      data,
      meta: {
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('💥 Insights Fetch Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}