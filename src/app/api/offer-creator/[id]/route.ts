// app/api/offer-creator/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { OfferCreatorService } from '../../../../services/offerCreator.service';

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

    return NextResponse.json({
      success: true,
      data: {
        ...offer,
        expired
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

    const offerId = params.id;
    const offerService = new OfferCreatorService();
    const deleted = await offerService.deleteOffer(user.id, offerId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Offer not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Offer deleted successfully'
    });

  } catch (error) {
    console.error('Offer Delete Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete offer' },
      { status: 500 }
    );
  }
}