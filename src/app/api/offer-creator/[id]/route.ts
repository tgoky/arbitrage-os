// app/api/offer-creator/[id]/route.ts - WITH RATE LIMITING & USAGE
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { OfferCreatorService } from '../../../../services/offerCreator.service';
import { rateLimit } from '@/lib/rateLimit'; // ✅ Add rate limiting
import { logUsage } from '@/lib/usage'; // ✅ Add usage logging

const RATE_LIMITS = {
  OFFER_GET: {
    limit: 100,
    window: 3600 // 1 hour
  },
  OFFER_DELETE: {
    limit: 20,
    window: 3600 // 1 hour
  }
};

function isOfferExpired(expiryDate: string): boolean {
  const expiry = new Date(expiryDate);
  const now = new Date();
  return expiry <= now;
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

    // ✅ ADD RATE LIMITING for individual offer fetches
    const rateLimitResult = await rateLimit(
      `offer_get:${user.id}`,
      RATE_LIMITS.OFFER_GET.limit,
      RATE_LIMITS.OFFER_GET.window
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Offer fetch rate limit exceeded.',
          retryAfter: rateLimitResult.reset
        },
        { status: 429 }
      );
    }

    const offerId = params.id;
    const offerService = new OfferCreatorService();
    const offer = await offerService.getOffer(user.id, offerId);

    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }

    // Type assertion for metadata and check expiry status
    const metadata = offer.metadata as any;
    const expired = metadata?.expiryDate ? isOfferExpired(metadata.expiryDate) : false;

    // ✅ LOG USAGE for offer view - Enhanced with offer insights
    await logUsage({
      userId: user.id,
      feature: 'offer_view',
      tokens: 0, // No AI tokens for viewing
      timestamp: new Date(),
      metadata: {
        offerId,
        expired,
        action: 'view',
        offerDetails: {
          offerType: metadata?.offerType,
          targetIndustry: metadata?.targetIndustry,
          hasExpiryDate: !!metadata?.expiryDate,
          daysUntilExpiry: metadata?.expiryDate ? 
            Math.ceil((new Date(metadata.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null,
          conversionScore: metadata?.conversionScore || 0
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...offer,
        expired
      },
      meta: {
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('Offer Fetch Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offer' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // ✅ ADD RATE LIMITING for offer deletions
    const rateLimitResult = await rateLimit(
      `offer_delete:${user.id}`,
      RATE_LIMITS.OFFER_DELETE.limit,
      RATE_LIMITS.OFFER_DELETE.window
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Offer deletion rate limit exceeded.',
          retryAfter: rateLimitResult.reset
        },
        { status: 429 }
      );
    }

    const offerId = params.id;
    const offerService = new OfferCreatorService();
    const deleted = await offerService.deleteOffer(user.id, offerId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Offer not found or access denied' },
        { status: 404 }
      );
    }

    // ✅ LOG USAGE for offer deletion
    await logUsage({
      userId: user.id,
      feature: 'offer_delete',
      tokens: 0, // No AI tokens for deletion
      timestamp: new Date(),
      metadata: {
        offerId,
        action: 'delete'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Offer deleted successfully',
      meta: {
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('Offer Delete Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete offer' },
      { status: 500 }
    );
  }
}