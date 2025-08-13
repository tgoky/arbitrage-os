// app/api/ad-writer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { AdWriterService } from '@/services/adWriter.service';
import { validateAdWriterInput } from '@/app/validators/adWriter.validator';
import { rateLimit } from '../../../lib/rateLimit';
import { logUsage } from '@lib/usage';

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

    // Rate limiting
    const rateLimitResult = await rateLimit(user.id);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = validateAdWriterInput(body);
        
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.errors },
        { status: 400 }
      );
    }

    // Generate ads using AI service
    const adWriterService = new AdWriterService();
    const generatedAds = await adWriterService.generateAds({
      ...body,
      userId: user.id,
      platforms: body.activePlatforms || ['facebook', 'google']
    });

    // Log usage for analytics/billing
    await logUsage({
      userId: user.id,
      feature: 'ad_writer',
      tokens: generatedAds.tokensUsed,
      timestamp: new Date()
    });

    return NextResponse.json({
      success: true,
      data: generatedAds.ads,
      meta: {
        tokensUsed: generatedAds.tokensUsed,
        generationTime: generatedAds.generationTime
      }
    });
   } catch (error) {
    console.error('Ad Writer API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate ads. Please try again.' },
      { status: 500 }
    );
  }
}