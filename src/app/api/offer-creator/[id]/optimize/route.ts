// app/api/offer-creator/[id]/optimize/route.ts - UPDATED TO MATCH NEW STRUCTURE
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { OfferCreatorService } from '../../../../../services/offerCreator.service';
import { validateOptimizationRequest } from '../../../../validators/offerCreator.validator';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { OptimizationType, OptimizationResult, ApiResponse } from '@/types/offerCreator';

const RATE_LIMITS = {
  OPTIMIZATION: {
    limit: 15, // Increased slightly for better UX
    window: 3600 // 1 hour
  }
};

// ✅ Enhanced authentication function (matches main route)
// Use this IMPROVED 3-method approach in ALL routes
async function getAuthenticatedUser(request: NextRequest) {
  try {
    const cookieStore = cookies();
    
    // Method 1: Authorization header (most reliable for API calls)
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: { get: () => undefined },
          }
        );
        
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) {
          return { user, error: null };
        }
      } catch (tokenError) {
        console.warn('Token auth failed:', tokenError);
      }
    }
    
    // Method 2: SSR cookies (FIXED cookie handling)
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              try {
                const cookie = cookieStore.get(name);
                if (!cookie?.value) return undefined;
                
                // FIXED: Proper base64 cookie handling
                if (cookie.value.startsWith('base64-')) {
                  try {
                    const decoded = atob(cookie.value.substring(7));
                    JSON.parse(decoded); // Validate it's valid JSON
                    return cookie.value;
                  } catch (e) {
                    console.warn(`Corrupted base64 cookie ${name}, skipping`);
                    return undefined; // Skip corrupted cookies
                  }
                }
                
                return cookie.value;
              } catch (error) {
                console.warn(`Error reading cookie ${name}:`, error);
                return undefined;
              }
            },
          },
        }
      );
      
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        return { user, error: null };
      }
    } catch (ssrError) {
      console.warn('SSR cookie auth failed:', ssrError);
    }
    
    // Method 3: Route handler client (fallback)
    try {
      const supabase = createRouteHandlerClient({
        cookies: () => cookieStore
      });
      
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        return { user, error: null };
      }
    } catch (routeError) {
      console.warn('Route handler auth failed:', routeError);
    }
    
    return { user: null, error: new Error('All authentication methods failed') };
    
  } catch (error) {
    console.error('Authentication error:', error);
    return { user: null, error };
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚀 Signature Offer Optimize API Route called for offer:', params.id);

    // ✅ Enhanced authentication (matches main route)
    const { user, error: authError } = await getAuthenticatedUser(req);

    if (authError || !user) {
      console.error('❌ Auth failed in optimization:', authError);
      
      const response = NextResponse.json(
        { 
          success: false,
          error: 'Authentication required. Please clear your browser cookies and sign in again.',
          code: 'AUTH_REQUIRED'
        } as ApiResponse<never>,
        { status: 401 }
      );
      
      // Clear potentially corrupted cookies
      const cookiesToClear = [
        'sb-access-token',
        'sb-refresh-token',
        'supabase-auth-token'
      ];
      
      cookiesToClear.forEach(cookieName => {
        response.cookies.set(cookieName, '', {
          expires: new Date(0),
          path: '/',
        });
      });
      
      return response;
    }

    console.log('✅ User authenticated successfully:', user.id);

    // Rate limiting for optimization requests
    console.log('🔍 Checking rate limits for user:', user.id);
    const rateLimitResult = await rateLimit(
      `signature_offer_optimization:${user.id}`,
      RATE_LIMITS.OPTIMIZATION.limit,
      RATE_LIMITS.OPTIMIZATION.window
    );
    if (!rateLimitResult.success) {
      console.log('❌ Rate limit exceeded for user:', user.id);
      return NextResponse.json(
        {
          success: false,
          error: 'Too many optimization requests. Please try again later.',
          retryAfter: rateLimitResult.reset
        } as ApiResponse<never>,
        { status: 429 }
      );
    }
    console.log('✅ Rate limit check passed');

    const offerId = params.id;
    
    // Validate offer ID format
    if (!offerId || offerId.length < 10) {
      console.error('❌ Invalid offer ID:', offerId);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid offer ID format' 
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Parse and validate request body
    console.log('📥 Parsing optimization request...');
    const body = await req.json();

    console.log('🔧 Optimization request for offer:', offerId);
    console.log('🔧 Optimization type:', body.type);
    console.log('🔧 Additional params:', body.focus || 'none');

    // Validate optimization request
    const validation = validateOptimizationRequest(body);
    if (!validation.success) {
      console.error('❌ Validation failed:', validation.errors);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid optimization request', 
          details: validation.errors,
          debug: {
            receivedType: body.type,
            validTypes: ['pricing', 'positioning', 'messaging', 'delivery', 'guarantee']
          }
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    if (!validation.data) {
      console.error('❌ No valid optimization data provided');
      return NextResponse.json(
        { 
          success: false,
          error: 'No valid optimization data provided' 
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // ✅ Perform optimization with enhanced error handling
    console.log('🤖 Starting signature offer optimization...');
    let optimizationResult: OptimizationResult;
    try {
      const offerService = new OfferCreatorService();
      optimizationResult = await offerService.optimizeOffer(
        user.id, 
        offerId, 
        validation.data.type as OptimizationType
      );
      
      console.log('✅ Optimization completed successfully');
      console.log('📊 Generated', optimizationResult.optimizedVersions.length, 'optimization versions');
    } catch (serviceError) {
      console.error('💥 Service error during optimization:', serviceError);
      
      if (serviceError instanceof Error && serviceError.message === 'Offer not found') {
        return NextResponse.json(
          { 
            success: false,
            error: 'Signature offer not found or access denied',
            code: 'OFFER_NOT_FOUND'
          } as ApiResponse<never>,
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to optimize signature offer. Please try again.',
          debug: serviceError instanceof Error ? serviceError.message : 'Unknown service error'
        } as ApiResponse<never>,
        { status: 500 }
      );
    }

    if (!optimizationResult) {
      console.error('❌ Optimization returned null result');
      return NextResponse.json(
        { 
          success: false,
          error: 'Optimization failed to generate results',
          code: 'OPTIMIZATION_FAILED'
        } as ApiResponse<never>,
        { status: 500 }
      );
    }

    // ✅ Log usage for optimization with enhanced metadata
    console.log('📊 Logging usage...');
    try {
      await logUsage({
        userId: user.id,
        feature: 'signature_offer_optimization',
        tokens: optimizationResult.tokensUsed || 0,
        timestamp: new Date(),
        metadata: {
          offerId,
          optimizationType: validation.data.type,
          focus: validation.data.focus || null,
          hasOptimizedVersions: optimizationResult.optimizedVersions?.length > 0,
          versionsGenerated: optimizationResult.optimizedVersions?.length || 0,
          originalElement: optimizationResult.originalElement,
          avgExpectedImpact: optimizationResult.optimizedVersions.length > 0 
            ? optimizationResult.optimizedVersions[0].expectedImpact 
            : null
        }
      });
      console.log('✅ Usage logged successfully');
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('⚠️ Usage logging failed (non-critical):', logError);
    }

    console.log('🎉 Signature offer optimization completed successfully');
    return NextResponse.json({
      success: true,
      data: optimizationResult,
      meta: {
        offerId,
        optimizationType: validation.data.type,
        versionsGenerated: optimizationResult.optimizedVersions.length,
        tokensUsed: optimizationResult.tokensUsed,
        remaining: rateLimitResult.remaining
      }
    } as ApiResponse<OptimizationResult>);

  } catch (error) {
    console.error('💥 Unexpected Signature Offer Optimization Error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to optimize signature offer. Please try again.',
        debug: error instanceof Error ? error.message : 'Unknown error'
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

// GET method to retrieve optimization history for an offer
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚀 Get Optimization History API Route called for offer:', params.id);

    // ✅ Enhanced authentication
    const { user, error: authError } = await getAuthenticatedUser(req);

    if (authError || !user) {
      console.error('❌ Auth failed in optimization history:', authError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        } as ApiResponse<never>,
        { status: 401 }
      );
    }

    console.log('✅ User authenticated successfully:', user.id);

    const offerId = params.id;
    
    // Get optimization history from service
    console.log('📋 Fetching optimization history for offer:', offerId);
    try {
      const offerService = new OfferCreatorService();
      const offer = await offerService.getOffer(user.id, offerId);
      
      if (!offer) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Signature offer not found',
            code: 'OFFER_NOT_FOUND'
          } as ApiResponse<never>,
          { status: 404 }
        );
      }

      // Extract optimization history from metadata if available
      const metadata = offer.metadata as any || {};
      const optimizationHistory = metadata.optimizationHistory || [];

      console.log('✅ Retrieved optimization history with', optimizationHistory.length, 'entries');

      return NextResponse.json({
        success: true,
        data: {
          offerId,
          offerTitle: offer.title,
          optimizationHistory,
          lastOptimized: metadata.lastOptimized || null,
          totalOptimizations: optimizationHistory.length
        },
        meta: {
          count: optimizationHistory.length
        }
      } as ApiResponse<any>);

    } catch (fetchError) {
      console.error('💥 Error fetching optimization history:', fetchError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch optimization history',
          debug: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error'
        } as ApiResponse<never>,
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('💥 Unexpected Optimization History Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch optimization history',
        debug: error instanceof Error ? error.message : 'Unknown error'
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}