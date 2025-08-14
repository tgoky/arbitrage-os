// app/api/offer-creator/[id]/optimize/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { OfferCreatorService } from '../../../../../services/offerCreator.service';
import { validateOptimizationRequest } from '../../../../validators/offerCreator.validator';
import { rateLimit } from '@/lib/rateLimit';

const RATE_LIMITS = {
  OPTIMIZATION: {
    limit: 5,
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

    // Rate limiting for optimization requests
    const rateLimitResult = await rateLimit(
      `optimization:${user.id}`,
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

    const validation = validateOptimizationRequest(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid optimization type', details: validation.errors },
        { status: 400 }
      );
    }

    // Check if validation.data exists
    if (!validation.data) {
      return NextResponse.json(
        { error: 'No valid data provided' },
        { status: 400 }
      );
    }

    const offerService = new OfferCreatorService();
    const optimization = await offerService.optimizeOffer(user.id, offerId, validation.data.type);

    return NextResponse.json({
      success: true,
      data: optimization,
      meta: {
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('Offer Optimization Error:', error);
    return NextResponse.json(
      { error: 'Failed to optimize offer' },
      { status: 500 }
    );
  }
}