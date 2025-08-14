// app/api/offer-creator/[id]/performance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { OfferCreatorService } from '../../../../../services/offerCreator.service';
import { validatePerformanceData } from '../../../../validators/offerCreator.validator';

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

    const offerId = params.id;
    const body = await req.json();

    const validation = validatePerformanceData(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid performance data', details: validation.errors },
        { status: 400 }
      );
    }

    // Check if validation.data exists
    if (!validation.data) {
      return NextResponse.json(
        { error: 'No valid performance data provided' },
        { status: 400 }
      );
    }

    const offerService = new OfferCreatorService();
    await offerService.updateOfferPerformance(user.id, offerId, validation.data);

    // Get updated performance data with insights
    const performanceData = await offerService.getOfferPerformance(user.id, offerId);

    return NextResponse.json({
      success: true,
      data: performanceData
    });

  } catch (error) {
    console.error('Performance Tracking Error:', error);
    return NextResponse.json(
      { error: 'Failed to record performance data' },
      { status: 500 }
    );
  }
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
    const performanceData = await offerService.getOfferPerformance(user.id, offerId);

    return NextResponse.json({
      success: true,
      data: performanceData
    });

  } catch (error) {
    console.error('Performance Fetch Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    );
  }
}