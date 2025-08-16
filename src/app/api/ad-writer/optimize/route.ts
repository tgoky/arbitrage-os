// app/api/ad-writer/optimize/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { AdWriterService } from '@/services/adWriter.service';
import { AdOptimizationType } from '@/types/adWriter';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';

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

    const userId = user.id;

    // Rate limiting
    const rateLimitResult = await rateLimit(
      `ad_optimization:${userId}`,
      30,
      3600
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Optimization rate limit exceeded. You can optimize 30 ads per hour.',
          resetTime: new Date(rateLimitResult.reset).toISOString(),
          remaining: rateLimitResult.remaining
        },
        { status: 429 }
      );
    }

    const { adCopy, optimizationType } = await req.json();
    
    if (!adCopy || !optimizationType) {
      return NextResponse.json(
        { error: 'Ad copy and optimization type are required' },
        { status: 400 }
      );
    }

    const validTypes: AdOptimizationType[] = ['emotional', 'urgency', 'benefits', 'social-proof', 'simplify'];
    if (!validTypes.includes(optimizationType)) {
      return NextResponse.json(
        { error: 'Invalid optimization type' },
        { status: 400 }
      );
    }
    
    const adWriterService = new AdWriterService();
    const optimizedAd = await adWriterService.optimizeAd(adCopy, optimizationType as AdOptimizationType);

    // ✅ LOG USAGE: Now generationTime exists
    await logUsage({
      userId,
      feature: 'ad_optimization',
      tokens: optimizedAd.tokensUsed,
      timestamp: new Date(),
      metadata: {
        optimizationType,
        originalLength: adCopy.length,
        optimizedLength: optimizedAd.content.length,
        generationTime: optimizedAd.generationTime, // ✅ Now this exists
        platform: 'optimization',
        action: 'optimize'
      }
    });

    return NextResponse.json({
      success: true,
      data: optimizedAd.content,
      meta: {
        tokensUsed: optimizedAd.tokensUsed,
        generationTime: optimizedAd.generationTime // ✅ Now this exists
      }
    }, {
      headers: {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': (rateLimitResult.remaining - 1).toString(),
        'X-RateLimit-Reset': rateLimitResult.reset.toString()
      }
    });

  } catch (error) {
    console.error('Ad Optimization Error:', error);
    return NextResponse.json(
      { error: 'Failed to optimize ad' },
      { status: 500 }
    );
  }
}