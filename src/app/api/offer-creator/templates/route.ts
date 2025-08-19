// app/api/offer-creator/templates/route.ts - FIXED
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { 
  OFFER_TEMPLATES, 
  filterTemplatesByIndustry, 
  filterTemplatesByType,
  INDUSTRIES,
  OFFER_TYPES 
} from '@/utils/offerCreator.utils';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';

const RATE_LIMITS = {
  TEMPLATES: {
    limit: 100,
    window: 3600 // 1 hour
  }
};

export async function GET(req: NextRequest) {
  try {
    console.log('🚀 Templates API Route called');

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

    // Rate limiting for templates
    const rateLimitResult = await rateLimit(
      `offer_templates:${user.id}`,
      RATE_LIMITS.TEMPLATES.limit,
      RATE_LIMITS.TEMPLATES.window
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Templates rate limit exceeded.',
          retryAfter: rateLimitResult.reset
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const industry = searchParams.get('industry');
    const offerType = searchParams.get('offerType');

    console.log('📋 Fetching templates for:', { industry, offerType });

    let templates = OFFER_TEMPLATES;
    
    // Filter by industry using utility function
    if (industry) {
      templates = filterTemplatesByIndustry(industry);
    }
    
    // Filter by offer type using utility function
    if (offerType) {
      templates = filterTemplatesByType(offerType);
    }

    // Log usage for templates
    await logUsage({
      userId: user.id,
      feature: 'offer_templates',
      tokens: 0, // No AI tokens used
      timestamp: new Date(),
      metadata: {
        industry,
        offerType,
        resultCount: templates.length
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        templates,
        industries: INDUSTRIES,
        offerTypes: OFFER_TYPES,
        total: templates.length
      },
      meta: {
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('💥 Templates Fetch Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}