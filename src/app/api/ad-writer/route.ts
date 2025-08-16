// app/api/ad-writer/route.ts - UPDATED to use service-level storage
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { AdWriterService } from '@/services/adWriter.service';
import { validateAdWriterInput } from '@/app/validators/adWriter.validator';
import { rateLimit } from '../../../lib/rateLimit';
import { logUsage } from '@/lib/usage'; // ✅ Fixed import path

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ✅ PROPER RATE LIMITING with specific limits
    const rateLimitResult = await rateLimit(
      `ad_writer:${user.id}`,
      25, // 25 ad generations per hour
      3600
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many ad generation requests. You can generate 25 ads per hour.',
          retryAfter: rateLimitResult.reset,
          remaining: rateLimitResult.remaining
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validation = validateAdWriterInput(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.errors },
        { status: 400 }
      );
    }

    // ✅ GET USER'S WORKSPACE (consistent pattern)
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
          description: 'Default workspace for ad campaigns'
        }
      });
    }

    // ✅ USE NEW SERVICE METHOD that generates AND saves
    const adWriterService = new AdWriterService();
    const result = await adWriterService.generateAndSaveAds(
      {
        ...validation.data,
        userId: user.id,
        platforms: validation.data.activePlatforms || ['facebook', 'google']
      },
      user.id,
      workspace.id
    );

    // ✅ LOG USAGE with deliverable reference
    await logUsage({
      userId: user.id,
      feature: 'ad_writer',
      tokens: result.tokensUsed,
      timestamp: new Date(),
      metadata: {
        deliverableId: result.deliverableId, // ✅ Now includes deliverable ID
        businessName: validation.data.businessName,
        offerName: validation.data.offerName,
        platforms: validation.data.activePlatforms || ['facebook', 'google'],
        adCount: result.ads.length
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        campaignId: result.deliverableId, // ✅ Return deliverable ID
        ads: result.ads
      },
      meta: {
        tokensUsed: result.tokensUsed,
        generationTime: result.generationTime,
        remaining: rateLimitResult.remaining
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