// app/api/offer-creator/route.ts - UPDATE GET METHOD
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { OfferCreatorService } from '../../../services/offerCreator.service';
import { validateOfferCreatorInput } from '../../validators/offerCreator.validator';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';

const RATE_LIMITS = {
  OFFER_GENERATION: {
    limit: 5,
    window: 3600 // 1 hour
  },
  OFFER_LIST: {
    limit: 100,
    window: 3600 // 1 hour
  }
};

// POST method stays the same - already has rate limiting and usage logging

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ ADD RATE LIMITING for listing offers
    const rateLimitResult = await rateLimit(
      `offer_list:${user.id}`, 
      RATE_LIMITS.OFFER_LIST.limit, 
      RATE_LIMITS.OFFER_LIST.window
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const offerType = searchParams.get('offerType');

    const offerService = new OfferCreatorService();
    let offers = await offerService.getUserOffers(user.id, workspaceId || undefined);

    // Filter by offer type if specified
    if (offerType) {
      offers = offers.filter(offer => offer.offerType === offerType);
    }

    // ✅ LOG USAGE for listing offers
    await logUsage({
      userId: user.id,
      feature: 'offer_list',
      tokens: 0, // No AI tokens used
      timestamp: new Date(),
      metadata: {
        workspaceId,
        offerType,
        resultCount: offers.length
      }
    });

    return NextResponse.json({
      success: true,
      data: offers,
      meta: {
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('Offers Fetch Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offers' },
      { status: 500 }
    );
  }
}