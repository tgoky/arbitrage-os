// app/api/offer-creator/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
// Import ApiResponseOptional for error responses without data
import { OfferCreatorService, UserOffer } from '../../../services/offerCreator.service';
import { 
  validateOfferCreatorInput, 
  validateOfferBusinessRules 
} from '../../validators/offerCreator.validator';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
// Import both ApiResponse types
import { OfferCreatorInput, GeneratedOfferPackage, ApiResponse, ApiResponseOptional } from '@/types/offerCreator'; 

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

// POST method for generating signature offers
export async function POST(req: NextRequest) {
  console.log('🚀 Signature Offer Creator API Route called');
  
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
        } as ApiResponseOptional<never>, // Use ApiResponseOptional for error response
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
      `signature_offer_generation:${user.id}`,
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
        } as ApiResponseOptional<never>, // Use ApiResponseOptional for error response
        { status: 429 }
      );
    }
    console.log('✅ Rate limit check passed');

    // Parse and validate request body
    console.log('📥 Parsing request body...');
    const body = await req.json();
    
    // ✅ Enhanced debug logging
    console.log('🔍 RECEIVED BODY STRUCTURE:');
    console.log('- founder keys:', body.founder ? Object.keys(body.founder) : 'missing');
    console.log('- market keys:', body.market ? Object.keys(body.market) : 'missing');
    console.log('- business keys:', body.business ? Object.keys(body.business) : 'missing');
    console.log('- pricing keys:', body.pricing ? Object.keys(body.pricing) : 'missing');
    console.log('- voice keys:', body.voice ? Object.keys(body.voice) : 'missing');
    
    // Add userId to create proper OfferCreatorInput structure
    const inputWithUserId: OfferCreatorInput = {
      founder: body.founder || {},
      market: body.market || {},
      business: body.business || {},
      pricing: body.pricing || {},
      voice: body.voice || {},
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
            receivedSections: {
              founder: !!body.founder,
              market: !!body.market,
              business: !!body.business,
              pricing: !!body.pricing,
              voice: !!body.voice
            },
            missingRequiredFields: validation.errors.filter(err => 
              err.message?.includes('required')
            ).map(err => err.path?.join('.'))
          }
        } as ApiResponseOptional<never>, // Use ApiResponseOptional for error response
        { status: 400 }
      );
    }

    if (!validation.data) {
      console.error('❌ Validation data is null');
      return NextResponse.json(
        { 
          success: false,
          error: 'No valid data provided' 
        } as ApiResponseOptional<never>, // Use ApiResponseOptional for error response
        { status: 400 }
      );
    }

    console.log('✅ Input validation passed');

    // ✅ Business rules validation
    console.log('🔍 Validating business rules...');
    const businessValidation = validateOfferBusinessRules(validation.data);
    if (!businessValidation.isValid) {
      console.warn('⚠️ Business rules validation warnings:', businessValidation.warnings);
    }

    // ✅ Generate signature offers with error handling
    console.log('🤖 Starting signature offer generation...');
    let generatedOffer: GeneratedOfferPackage;
    try {
      const offerService = new OfferCreatorService();
      generatedOffer = await offerService.generateOffer(validation.data);
      console.log('✅ Signature offer generation completed successfully');
      console.log('📊 Generated offer structure:');
      console.log('- Primary offer tiers:', Object.keys(generatedOffer.primaryOffer.signatureOffers));
      console.log('- Analysis score:', generatedOffer.analysis.conversionPotential.score);
      console.log('- Tokens used:', generatedOffer.tokensUsed);
    } catch (serviceError) {
      console.error('💥 Service error during generation:', serviceError);
      console.error('Service error stack:', serviceError instanceof Error ? serviceError.stack : 'No stack');
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to generate signature offers. Please try again.',
          debug: serviceError instanceof Error ? serviceError.message : 'Unknown service error'
        } as ApiResponseOptional<never>, // Use ApiResponseOptional for error response
        { status: 500 }
      );
    }

    // Get workspace ID from request or use default
    const workspaceId = body.workspaceId || 'default';

    // ✅ Save the signature offers with error handling
    console.log('💾 Saving signature offers...');
    let offerId: string;
    try {
      const offerService = new OfferCreatorService();
      offerId = await offerService.saveOffer(user.id, workspaceId, generatedOffer, validation.data);
      console.log('✅ Signature offers saved with ID:', offerId);
    } catch (saveError) {
      console.error('💥 Error saving offers:', saveError);
      // Don't fail the request if saving fails - return the generated offers anyway
      console.warn('⚠️ Continuing without saving due to error');
      offerId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // ✅ Log usage for signature offer generation
    console.log('📊 Logging usage...');
    try {
      await logUsage({
        userId: user.id,
        feature: 'signature_offer_generation',
        tokens: generatedOffer.tokensUsed || 0,
        timestamp: new Date(),
        metadata: {
          offerId,
          targetMarket: validation.data.market.targetMarket,
          industries: validation.data.founder.industries,
          deliveryModels: validation.data.business.deliveryModel,
          pricePosture: validation.data.pricing.pricePosture,
          conversionScore: generatedOffer.analysis.conversionPotential.score,
          generationTime: generatedOffer.generationTime,
          businessWarnings: businessValidation.warnings.length,
          businessSuggestions: businessValidation.suggestions.length
        }
      });
      console.log('✅ Usage logged successfully');
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('⚠️ Usage logging failed (non-critical):', logError);
    }

    console.log('🎉 Signature offer generation completed successfully');
    // Success response with data - use ApiResponse<T>
    return NextResponse.json({
      success: true,
      data: generatedOffer, // This is required for ApiResponse<T>
      meta: {
        offerId,
        tokensUsed: generatedOffer.tokensUsed,
        generationTime: generatedOffer.generationTime,
        remaining: rateLimitResult.remaining,
        businessValidation: {
          conversionScore: businessValidation.conversionPrediction.score,
          warnings: businessValidation.warnings,
          suggestions: businessValidation.suggestions.slice(0, 5) // Limit suggestions
        }
      }
    } as ApiResponse<GeneratedOfferPackage>); // Use ApiResponse for success response with data

  } catch (error) {
    console.error('💥 Unexpected Signature Offer Creator API Error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate signature offers. Please try again.',
        debug: error instanceof Error ? error.message : 'Unknown error'
      } as ApiResponseOptional<never>, // Use ApiResponseOptional for unexpected error response
      { status: 500 }
    );
  }
}

// GET method for listing signature offers
export async function GET(req: NextRequest) {
  console.log('🚀 Signature Offers List API Route called');
  
  try {
    // ✅ Use robust authentication (same as cold-email that works)
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('❌ Auth failed in offers list:', authError);
      
      const response = NextResponse.json(
        { 
          success: false,
          error: 'Authentication required. Please clear your browser cookies and sign in again.',
          code: 'AUTH_REQUIRED'
        } as ApiResponseOptional<never>, // Use ApiResponseOptional for error response
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
      `signature_offers_list:${user.id}`, 
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
        } as ApiResponseOptional<never>, // Use ApiResponseOptional for error response
        { status: 429 }
      );
    }
    console.log('✅ Rate limit check passed');

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const targetMarket = searchParams.get('targetMarket');
    const pricePosture = searchParams.get('pricePosture');

    console.log('📋 Fetching signature offers for user:', user.id);
    console.log('🔍 Filters - workspace:', workspaceId, 'market:', targetMarket, 'pricing:', pricePosture);
    
   // Inside the GET method of app/api/offer-creator/route.ts
// ...
let offers: UserOffer[]; // Explicitly type the variable
try {
  const offerService = new OfferCreatorService();
  offers = await offerService.getUserOffers(user.id, workspaceId || undefined); // Assign the value

  // Apply additional filters
  if (targetMarket) {
    offers = offers.filter(offer =>
      offer.metadata?.targetMarket?.toLowerCase().includes(targetMarket.toLowerCase())
    );
  }

  // Use explicit check for pricePosture filter
  if (pricePosture) {
    offers = offers.filter(offer => {
      // Ensure metadata exists and is an object before accessing pricePosture
      // This reinforces the type check for TS
      if (offer.metadata && typeof offer.metadata === 'object' && 'pricePosture' in offer.metadata) {
        return offer.metadata.pricePosture === pricePosture;
      }
      return false; // Exclude offers without pricePosture metadata when filtering by it
    });
  }
      
      console.log('✅ Retrieved', offers.length, 'signature offers');
    } catch (fetchError) {
      console.error('💥 Error fetching offers:', fetchError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch signature offers. Please try again.',
          debug: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error'
        } as ApiResponseOptional<never>, // Use ApiResponseOptional for error response
        { status: 500 }
      );
    }

    // ✅ Log usage for listing offers
    console.log('📊 Logging usage...');
    try {
      await logUsage({
        userId: user.id,
        feature: 'signature_offers_list',
        tokens: 0, // No AI tokens used
        timestamp: new Date(),
        metadata: {
          workspaceId,
          targetMarket,
          pricePosture,
          resultCount: offers.length
        }
      });
      console.log('✅ Usage logged successfully');
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('⚠️ Usage logging failed (non-critical):', logError);
    }

    console.log('🎉 Signature offers fetch completed successfully');
    // Success response with data - use ApiResponse<T>
    return NextResponse.json({
      success: true,
      data: offers, // This is required for ApiResponse<T>
      meta: {
        count: offers.length,
        remaining: rateLimitResult.remaining,
        filters: {
          workspaceId,
          targetMarket,
          pricePosture
        }
      }
    } as ApiResponse<UserOffer[]>); // Use ApiResponse for success response with data

  } catch (error) {
    console.error('💥 Unexpected Signature Offers Fetch Error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch signature offers. Please try again.',
        debug: error instanceof Error ? error.message : 'Unknown error'
      } as ApiResponseOptional<never>, // Use ApiResponseOptional for unexpected error response
      { status: 500 }
    );
  }
}