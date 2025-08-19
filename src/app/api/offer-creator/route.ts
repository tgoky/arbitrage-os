// app/api/offer-creator/route.ts - FIXED WITH ROBUST AUTH
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { OfferCreatorService } from '../../../services/offerCreator.service';
import { validateOfferCreatorInput } from '../../validators/offerCreator.validator';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';

const RATE_LIMITS = {
  OFFER_GENERATION: {
    limit: 50,
    window: 3600 // 1 hour
  },
  OFFER_LIST: {
    limit: 100,
    window: 3600 // 1 hour
  }
};

// ✅ Same robust authentication function as cold-email (that works!)
async function getAuthenticatedUser(request: NextRequest) {
  try {
    const cookieStore = cookies();
    
    // Method 1: Try with route handler client
    try {
      const supabase = createRouteHandlerClient({
        cookies: () => cookieStore
      });
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (!error && user) {
        console.log('✅ Auth Method 1 (route handler) succeeded for user:', user.id);
        return { user, error: null };
      }
      
      console.log('⚠️ Route handler auth failed:', error?.message);
    } catch (helperError) {
      console.warn('⚠️ Route handler client failed:', helperError);
    }
    
    // Method 2: Try with authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        console.log('🔍 Trying token auth with token:', token.substring(0, 20) + '...');
        
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              get: () => undefined,
            },
          }
        );
        
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (!error && user) {
          console.log('✅ Auth Method 2 (token) succeeded for user:', user.id);
          return { user, error: null };
        }
        
        console.log('⚠️ Token auth failed:', error?.message);
      } catch (tokenError) {
        console.warn('⚠️ Token auth error:', tokenError);
      }
    }
    
    // Method 3: Try with cookie validation
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            try {
              const cookie = cookieStore.get(name);
              if (!cookie?.value) return undefined;
              
              // Validate base64 cookies
              if (cookie.value.startsWith('base64-')) {
                try {
                  const decoded = atob(cookie.value.substring(7));
                  JSON.parse(decoded); // Validate JSON
                  return cookie.value;
                } catch (e) {
                  console.warn(`Invalid cookie ${name}, skipping...`);
                  return undefined;
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
    
    const { data: { user }, error } = await supabaseSSR.auth.getUser();
    
    if (!error && user) {
      console.log('✅ Auth Method 3 (SSR cookies) succeeded for user:', user.id);
    } else {
      console.log('⚠️ SSR cookie auth failed:', error?.message);
    }
    
    return { user, error };
    
  } catch (error) {
    console.error('💥 All authentication methods failed:', error);
    return { user: null, error };
  }
}

// POST method for generating offers
export async function POST(req: NextRequest) {
  console.log('🚀 Offer Creator API Route called');
  
  try {
    // ✅ Use robust authentication (same as cold-email that works)
    const { user, error: authError } = await getAuthenticatedUser(req);

    if (authError || !user) {
      console.error('❌ Auth failed in offer creator:', authError);
      
      // Clear corrupted cookies in response
      const response = NextResponse.json(
        { 
          success: false,
          error: 'Authentication required. Please clear your browser cookies and sign in again.',
          code: 'AUTH_REQUIRED'
        },
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

    // Rate limiting for offer generation
    console.log('🔍 Checking rate limits for user:', user.id);
    const rateLimitResult = await rateLimit(
      `offer_generation:${user.id}`,
      RATE_LIMITS.OFFER_GENERATION.limit,
      RATE_LIMITS.OFFER_GENERATION.window
    );
    if (!rateLimitResult.success) {
      console.log('❌ Rate limit exceeded for user:', user.id);
      return NextResponse.json(
        {
          success: false,
          error: 'Too many generation requests. Please try again later.',
          retryAfter: rateLimitResult.reset
        },
        { status: 429 }
      );
    }
    console.log('✅ Rate limit check passed');

    // Parse and validate request body
    console.log('📥 Parsing request body...');
    const body = await req.json();
    
    // ✅ Enhanced debug logging (like cold-email)
    console.log('🔍 RECEIVED BODY:', JSON.stringify(body, null, 2));
    console.log('🔍 BODY KEYS:', Object.keys(body));
    
    // Add userId to the input
    const inputWithUserId = {
      ...body,
      userId: user.id
    };

    console.log('🔍 Starting validation...');
    const validation = validateOfferCreatorInput(inputWithUserId);
    if (!validation.success) {
      console.error('❌ VALIDATION FAILED:');
      console.error('Validation errors:', JSON.stringify(validation.errors, null, 2));
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid input', 
          details: validation.errors,
          debug: {
            receivedFields: Object.keys(body),
            receivedData: body
          }
        },
        { status: 400 }
      );
    }

    if (!validation.data) {
      console.error('❌ Validation data is null');
      return NextResponse.json(
        { 
          success: false,
          error: 'No valid data provided' 
        },
        { status: 400 }
      );
    }

    console.log('✅ Input validation passed');
    console.log('✅ Validated data keys:', Object.keys(validation.data));

    // ✅ Generate offer with error handling
    console.log('🤖 Starting offer generation...');
    let generatedOffer;
    try {
      const offerService = new OfferCreatorService();
      generatedOffer = await offerService.generateOffer(validation.data);
      console.log('✅ Offer generation completed successfully');
    } catch (serviceError) {
      console.error('💥 Service error during generation:', serviceError);
      console.error('Service error stack:', serviceError instanceof Error ? serviceError.stack : 'No stack');
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to generate offer. Please try again.',
          debug: serviceError instanceof Error ? serviceError.message : 'Unknown service error'
        },
        { status: 500 }
      );
    }

    // Get workspace ID from request or use default
    const workspaceId = body.workspaceId || 'default';

    // 🚫 COMMENTED OUT: Save functionality for testing
    /*
    // ✅ Save the offer with error handling
    console.log('💾 Saving offer...');
    let offerId;
    try {
      const offerService = new OfferCreatorService();
      offerId = await offerService.saveOffer(user.id, workspaceId, generatedOffer, validation.data);
      console.log('✅ Offer saved with ID:', offerId);
    } catch (saveError) {
      console.error('💥 Error saving offer:', saveError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to save offer. Please try again.',
          debug: saveError instanceof Error ? saveError.message : 'Unknown save error'
        },
        { status: 500 }
      );
    }
    */

    // Generate a temporary ID for the response
    const tempOfferId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('🔧 Using temporary offer ID:', tempOfferId);

    // ✅ Log usage for offer generation with error handling
    console.log('📊 Logging usage...');
    try {
      await logUsage({
        userId: user.id,
        feature: 'offer_generation',
        tokens: generatedOffer.tokensUsed || 0,
        timestamp: new Date(),
        metadata: {
          offerId: tempOfferId, // Use temp ID
          offerType: validation.data.offerType,
          targetIndustry: validation.data.targetIndustry,
          conversionScore: generatedOffer.analysis?.conversionPotential?.score || 0,
          generationTime: generatedOffer.generationTime,
          saveSkipped: true // Flag that save was skipped
        }
      });
      console.log('✅ Usage logged successfully');
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('⚠️ Usage logging failed (non-critical):', logError);
    }

    console.log('🎉 Offer generation completed successfully (save skipped for testing)');
    return NextResponse.json({
      success: true,
      data: {
        offerId: tempOfferId, // Return temp ID
        offer: generatedOffer
      },
      meta: {
        remaining: rateLimitResult.remaining,
        saveSkipped: true // Let frontend know save was skipped
      }
    });

  } catch (error) {
    console.error('💥 Unexpected Offer Creator API Error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate offer. Please try again.',
        debug: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET method for listing offers
export async function GET(req: NextRequest) {
  console.log('🚀 Offer Creator GET API Route called');
  
  try {
    // ✅ Use robust authentication (same as cold-email that works)
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('❌ Auth failed in offer creator GET:', authError);
      
      const response = NextResponse.json(
        { 
          success: false,
          error: 'Authentication required. Please clear your browser cookies and sign in again.',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
      
      // Clear potentially corrupted cookies
      const cookiesToClear = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token'];
      cookiesToClear.forEach(cookieName => {
        response.cookies.set(cookieName, '', { expires: new Date(0), path: '/' });
      });
      
      return response;
    }

    console.log('✅ User authenticated successfully:', user.id);

    // Rate limiting for listing offers
    console.log('🔍 Checking rate limits for user:', user.id);
    const rateLimitResult = await rateLimit(
      `offer_list:${user.id}`, 
      RATE_LIMITS.OFFER_LIST.limit, 
      RATE_LIMITS.OFFER_LIST.window
    );
    if (!rateLimitResult.success) {
      console.log('❌ Rate limit exceeded for user:', user.id);
      return NextResponse.json(
        { 
          success: false,
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }
    console.log('✅ Rate limit check passed');

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const offerType = searchParams.get('offerType');

    console.log('📋 Fetching offers for user:', user.id);
    let offers;
    try {
      const offerService = new OfferCreatorService();
      offers = await offerService.getUserOffers(user.id, workspaceId || undefined);

      // Filter by offer type if specified
      if (offerType) {
        offers = offers.filter(offer => offer.offerType === offerType);
      }
      
      console.log('✅ Retrieved', offers.length, 'offers');
    } catch (fetchError) {
      console.error('💥 Error fetching offers:', fetchError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch offers. Please try again.',
          debug: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error'
        },
        { status: 500 }
      );
    }

    // ✅ Log usage for listing offers with error handling
    console.log('📊 Logging usage...');
    try {
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
      console.log('✅ Usage logged successfully');
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('⚠️ Usage logging failed (non-critical):', logError);
    }

    console.log('🎉 Offers fetch completed successfully');
    return NextResponse.json({
      success: true,
      data: offers,
      meta: {
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('💥 Unexpected Offers Fetch Error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch offers. Please try again.',
        debug: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}