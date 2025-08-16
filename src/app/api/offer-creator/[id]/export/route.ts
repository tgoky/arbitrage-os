// app/api/offer-creator/[id]/export/route.ts - WITH RATE LIMITING & USAGE
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { OfferCreatorService } from '../../../../../services/offerCreator.service';
import { rateLimit } from '@/lib/rateLimit'; // ✅ Add rate limiting
import { logUsage } from '@/lib/usage'; // ✅ Add usage logging

const RATE_LIMITS = {
  EXPORT: {
    limit: 20,
    window: 3600 // 1 hour
  }
};

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

    // ✅ ADD RATE LIMITING for exports
    const rateLimitResult = await rateLimit(
      `offer_export:${user.id}`,
      RATE_LIMITS.EXPORT.limit,
      RATE_LIMITS.EXPORT.window
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Export rate limit exceeded. You can export 20 offers per hour.',
          retryAfter: rateLimitResult.reset
        },
        { status: 429 }
      );
    }

    const offerId = params.id;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';

    const offerService = new OfferCreatorService();
    const exportData = await offerService.exportOffer(user.id, offerId, format as 'json' | 'html');

    if (!exportData) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }

    // ✅ LOG USAGE for export
    await logUsage({
      userId: user.id,
      feature: 'offer_export',
      tokens: 0, // No AI tokens for export
      timestamp: new Date(),
      metadata: {
        offerId,
        format,
        filename: exportData.filename
      }
    });

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: exportData.content,
        meta: {
          remaining: rateLimitResult.remaining
        }
      });
    }

    // For HTML format, return as downloadable file
    return new NextResponse(exportData.content as string, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${exportData.filename}"`,
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString()
      }
    });

  } catch (error) {
    console.error('Offer Export Error:', error);
    return NextResponse.json(
      { error: 'Failed to export offer' },
      { status: 500 }
    );
  }
}
