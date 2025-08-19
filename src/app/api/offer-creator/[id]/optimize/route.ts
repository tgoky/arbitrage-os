// app/api/offer-creator/[id]/optimize/route.ts - FIXED
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { OfferCreatorService } from '../../../../../services/offerCreator.service';
import { validateOptimizationRequest } from '../../../../validators/offerCreator.validator';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';

const RATE_LIMITS = {
  OPTIMIZATION: {
    limit: 10,
    window: 3600 // 1 hour
  }
};

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚀 Optimize API Route called for offer:', params.id);

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

    // Rate limiting for optimization requests
    const rateLimitResult = await rateLimit(
      `offer_optimization:${user.id}`,
      RATE_LIMITS.OPTIMIZATION.limit,
      RATE_LIMITS.OPTIMIZATION.window
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many optimization requests. Please try again later.',
          retryAfter: rateLimitResult.reset
        },
        { status: 429 }
      );
    }

    const offerId = params.id;
    const body = await req.json();

    console.log('🔧 Optimization request:', body);

    const validation = validateOptimizationRequest(body);
    if (!validation.success) {
      console.error('❌ Validation failed:', validation.errors);
      return NextResponse.json(
        { error: 'Invalid optimization type', details: validation.errors },
        { status: 400 }
      );
    }

    if (!validation.data) {
      return NextResponse.json(
        { error: 'No valid data provided' },
        { status: 400 }
      );
    }

    const offerService = new OfferCreatorService();
    const optimizationResult = await offerService.optimizeOffer(user.id, offerId, validation.data.type);

    if (!optimizationResult) {
      return NextResponse.json(
        { error: 'Offer not found or optimization failed' },
        { status: 404 }
      );
    }

    // Log usage for optimization
    await logUsage({
      userId: user.id,
      feature: 'offer_optimization',
      tokens: optimizationResult.tokensUsed || 0,
      timestamp: new Date(),
      metadata: {
        offerId,
        optimizationType: validation.data.type,
        hasOptimizedVersions: optimizationResult.optimizedVersions?.length > 0 || false,
        versionsGenerated: optimizationResult.optimizedVersions?.length || 0,
        originalElement: optimizationResult.originalElement
      }
    });

    return NextResponse.json({
      success: true,
      data: optimizationResult,
      meta: {
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('💥 Offer Optimization Error:', error);
    return NextResponse.json(
      { error: 'Failed to optimize offer' },
      { status: 500 }
    );
  }
}