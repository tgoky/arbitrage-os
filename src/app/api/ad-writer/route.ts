// app/api/ad-writer/route.ts - UPDATED WITH SIMPLIFIED AUTH
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { AdWriterService } from '@/services/adWriter.service';
import { validateAdWriterInput } from '@/app/validators/adWriter.validator';
import { rateLimit } from '../../../lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { convertToPlatforms, type Platform } from '@/types/adWriter';
import { createNotification } from '@/lib/notificationHelper';

// ✅ SIMPLIFIED: Authentication function from work-items
async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.error('❌ Authentication failed:', error);
      return { user: null, error: error || new Error('No user found') };
    }
    
    console.log('✅ User authenticated:', user.id);
    return { user, error: null };
    
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return { user: null, error };
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('=== AD WRITER API START ===');
    
    // Use simplified authentication
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('❌ Auth failed in ad writer:', authError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }
    
    console.log('User authenticated:', user.id);

    // Parse request body FIRST
    const body = await req.json();
    console.log('Request body received:', JSON.stringify(body, null, 2));

    // Get workspace ID from both sources
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId') || body.workspaceId;

    if (!workspaceId) {
      return NextResponse.json({ 
        error: 'Workspace ID required',
        code: 'WORKSPACE_ID_REQUIRED'
      }, { status: 400 });
    }

    // Validate workspace access
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        user_id: user.id
      }
    });

    if (!workspace) {
      return NextResponse.json({ 
        error: 'Workspace access denied',
        code: 'WORKSPACE_ACCESS_DENIED'
      }, { status: 403 });
    }

    console.log('Using workspace:', workspace.id);

    // RATE LIMITING for ad generation
    const rateLimitResult = await rateLimit(
      `ad_writer:${user.id}`,
      25, // 25 ad generations per hour
      3600
    );

    if (!rateLimitResult.success) {
      console.log('Rate limit exceeded for user:', user.id);
      return NextResponse.json(
        {
          error: 'Too many ad generation requests. You can generate 25 ads per hour.',
          retryAfter: rateLimitResult.reset,
          remaining: rateLimitResult.remaining
        },
        { status: 429 }
      );
    }

    // Validate input
    const validation = validateAdWriterInput(body);
    
    if (!validation.success) {
      console.error('Validation failed:', validation.errors);
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: validation.errors,
          received: body
        },
        { status: 400 }
      );
    }

    if (!validation.data) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      );
    }

    console.log('Validation passed');

    // Convert string platforms to Platform type and prepare data
    const validatedPlatforms = convertToPlatforms(validation.data.activePlatforms || []);
    
    const adGenerationInput = {
      ...validation.data,
      userId: user.id,
      platforms: validatedPlatforms,
      adLength: validation.data.adLength || 'medium'
    };

    console.log('Calling AdWriterService with:', JSON.stringify(adGenerationInput, null, 2));

    // Generate and save ads
    let result;
    
    try {
      const adWriterService = new AdWriterService();
      
      result = await adWriterService.generateAndSaveAds(
        adGenerationInput,
        user.id,
        workspace.id
      );
      
    } catch (serviceError) {
      console.error('Service error:', serviceError);
      return NextResponse.json(
        { error: 'Failed to generate ads. Please try again.' },
        { status: 500 }
      );
    }

    console.log('AdWriterService result:', {
      deliverableId: result.deliverableId,
      adsCount: result.ads.length,
      tokensUsed: result.tokensUsed,
      generationTime: result.generationTime
    });

    // After successful ad generation and saving
    try {
      await createNotification({
        userId: user.id,
        workspaceId: workspace.id,
        workspaceSlug: workspace.slug,
        type: 'ad_writer',
        itemId: result.deliverableId,
        metadata: {
          adCount: result.ads.length,
          platforms: validation.data.activePlatforms || [],
          businessName: validation.data.businessName,
          offerName: validation.data.offerName,
          adLength: validation.data.adLength,
          adType: validation.data.adType
        }
      });
      
      console.log('✅ Notification created for ad generation:', result.deliverableId);
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
      // Don't fail the request if notification fails
    }

    // Log usage for analytics/billing
    try {
      await logUsage({
        userId: user.id,
        feature: 'ad_writer',
        tokens: result.tokensUsed,
        timestamp: new Date(),
        metadata: {
          deliverableId: result.deliverableId,
          businessName: validation.data.businessName,
          offerName: validation.data.offerName,
          platforms: validation.data.activePlatforms || [],
          adCount: result.ads.length
        }
      });
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('Usage logging failed:', logError);
    }

    console.log('Usage logged successfully');

    // Return successful response
    const response = {
      success: true,
      data: {
        campaignId: result.deliverableId,
        ads: result.ads
      },
      meta: {
        tokensUsed: result.tokensUsed,
        generationTime: result.generationTime,
        remaining: rateLimitResult.remaining
      }
    };

    console.log('Sending success response');
    console.log('=== AD WRITER API END ===');

    return NextResponse.json(response);

  } catch (error) {
    console.error('=== AD WRITER API ERROR ===');
    console.error('Error details:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate ads. Please try again.',
        debug: process.env.NODE_ENV === 'development' ? {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: error instanceof Error ? error.constructor.name : typeof error
        } : undefined
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'healthy', 
    service: 'ad-writer',
    timestamp: new Date().toISOString()
  });
}