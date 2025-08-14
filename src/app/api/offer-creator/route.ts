// app/api/offer-creator/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { OfferCreatorService } from '../../../services/offerCreator.service';
import { validateOfferCreatorInput } from '../../validators/offerCreator.validator';
import { rateLimit } from '@lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { RATE_LIMITS } from '@/utils/offerCreator.utils';

export async function POST(req: NextRequest) {
  try {
    // Create Supabase client for server-side auth
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });
    
    // Get the authenticated user
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting using utility constants
    const rateLimitResult = await rateLimit(
      user.id, 
      RATE_LIMITS.OFFER_GENERATION.limit, 
      RATE_LIMITS.OFFER_GENERATION.window
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many offers generated. Please try again later.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = validateOfferCreatorInput(body);
        
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.errors },
        { status: 400 }
      );
    }

    if (!validation.data) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      );
    }

    // Get user's workspace
    const { prisma } = await import('@/lib/prisma');
    let workspace = await prisma.workspace.findFirst({
      where: { user_id: user.id }
    });

    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          user_id: user.id,
          name: 'Default Workspace',
          slug: 'default',
          description: 'Default workspace for offers'
        }
      });
    }

    // Generate offer package
    const offerService = new OfferCreatorService();
    const offerInput = { ...validation.data, userId: user.id };
    const generatedOffer = await offerService.generateOffer(offerInput);

    // Save to database
    const offerId = await offerService.saveOffer(
      user.id, 
      workspace.id, 
      generatedOffer, 
      offerInput
    );

    // Log usage for analytics/billing
    await logUsage({
      userId: user.id,
      feature: 'offer_creator',
      tokens: generatedOffer.tokensUsed,
      timestamp: new Date(),
      metadata: {
        offerName: validation.data.offerName,
        offerType: validation.data.offerType,
        targetIndustry: validation.data.targetIndustry,
        conversionScore: generatedOffer.analysis.conversionPotential.score,
        offerId
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        offerId,
        offer: generatedOffer
      },
      meta: {
        tokensUsed: generatedOffer.tokensUsed,
        generationTime: generatedOffer.generationTime,
        remaining: rateLimitResult.limit - rateLimitResult.count
      }
    });

  } catch (error) {
    console.error('Offer Creation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate offer. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Create Supabase client for server-side auth
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });
    
    // Get the authenticated user
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    return NextResponse.json({
      success: true,
      data: offers
    });

  } catch (error) {
    console.error('Offers Fetch Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offers' },
      { status: 500 }
    );
  }
}
