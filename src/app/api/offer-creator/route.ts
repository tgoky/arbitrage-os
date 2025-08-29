// app/api/offer-creator/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { OfferCreatorService } from '@/services/offerCreator.service';
import { 
  validateOfferCreatorInput, 
  validateOfferBusinessRules 
} from '../../validators/offerCreator.validator';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { 
  OfferCreatorInput, 
  GeneratedOfferPackage, 
  ApiResponse, 
  ApiResponseOptional,
  UserOffer,
  GuaranteeType
} from '@/types/offerCreator'; 

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

// ✅ FIXED: Use the EXACT same authentication function as pricing-calculator
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
        return { user, error: null };
      }
      
      console.log('Route handler auth failed:', error);
    } catch (helperError) {
      console.warn('Route handler client failed:', helperError);
    }
    
    // Method 2: Try with authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        
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
          return { user, error: null };
        }
        
        console.log('Token auth failed:', error);
      } catch (tokenError) {
        console.warn('Token auth error:', tokenError);
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
    return { user, error };
    
  } catch (error) {
    console.error('All authentication methods failed:', error);
    return { user: null, error };
  }
}

// ✅ FIXED: Add workspace validation function
async function validateWorkspaceAccess(userId: string, workspaceId: string): Promise<boolean> {
  try {
    const { prisma } = await import('@/lib/prisma');
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        user_id: userId
      }
    });
    return !!workspace;
  } catch (error) {
    console.error('Error validating workspace access:', error);
    return false;
  }
}

// POST method for generating signature offers
export async function POST(req: NextRequest) {
  console.log('🚀 Enhanced Signature Offer Creator API Route called');
  
  try {
    // ✅ FIXED: Use the same authentication flow as pricing-calculator
    const { user, error: authError } = await getAuthenticatedUser(req);

    if (authError || !user) {
      console.error('❌ Auth failed in enhanced offer creator:', authError);
      
      // Clear corrupted cookies in response
      const response = NextResponse.json(
        { 
          success: false,
          error: 'Authentication required. Please clear your browser cookies and sign in again.',
          code: 'AUTH_REQUIRED'
        } as ApiResponseOptional<never>,
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

    // ✅ FIXED: Get workspace ID BEFORE validating it (was inside the auth failure block!)
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId') || body.workspaceId;

    if (!workspaceId) {
      return NextResponse.json({ 
        success: false,
        error: 'Workspace ID required. Please ensure you are accessing this from within a workspace.',
        code: 'WORKSPACE_ID_REQUIRED'
      }, { status: 400 });
    }

    // ✅ FIXED: Validate workspace access after getting workspaceId
    const hasAccess = await validateWorkspaceAccess(user.id, workspaceId);
    if (!hasAccess) {
      return NextResponse.json({ 
        success: false,
        error: 'Workspace not found or access denied.',
        code: 'WORKSPACE_ACCESS_DENIED'
      }, { status: 403 });
    }

    // Rate limiting for offer generation
    console.log('🔍 Checking rate limits for user:', user.id);
    const rateLimitResult = await rateLimit(
      `enhanced_signature_offer_generation:${user.id}`,
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
        } as ApiResponseOptional<never>,
        { status: 429 }
      );
    }
    console.log('✅ Rate limit check passed');

    // ✅ Enhanced debug logging for the new service structure
    console.log('🔍 RECEIVED BODY STRUCTURE:');
    console.log('- founder keys:', body.founder ? Object.keys(body.founder) : 'missing');
    console.log('- founder signatureResults length:', body.founder?.signatureResults?.length || 0);
    console.log('- founder industries:', body.founder?.industries || []);
    console.log('- market keys:', body.market ? Object.keys(body.market) : 'missing');
    console.log('- market targetMarket:', body.market?.targetMarket || 'missing');
    console.log('- market pains length:', body.market?.pains?.length || 0);
    console.log('- business keys:', body.business ? Object.keys(body.business) : 'missing');
    console.log('- business deliveryModel:', body.business?.deliveryModel || []);
    console.log('- business capacity:', body.business?.capacity || 'missing');
    console.log('- pricing keys:', body.pricing ? Object.keys(body.pricing) : 'missing');
    console.log('- pricing pricePosture:', body.pricing?.pricePosture || 'missing');
    console.log('- voice keys:', body.voice ? Object.keys(body.voice) : 'missing');
    console.log('- voice positioning:', body.voice?.positioning || 'missing');
    
    // Add userId to create proper OfferCreatorInput structure
    const inputWithUserId: OfferCreatorInput = {
      founder: body.founder || {},
      market: body.market || {},
      business: body.business || {},
      pricing: body.pricing || {},
      voice: body.voice || {},
      userId: user.id
    };

    console.log('🔍 Starting enhanced validation...');
    const validation = validateOfferCreatorInput(inputWithUserId);
    if (!validation.success) {
      console.error('❌ ENHANCED VALIDATION FAILED:');
      console.error('Validation errors:', JSON.stringify(validation.errors, null, 2));
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid input for enhanced signature offer generation', 
          details: validation.errors,
          debug: {
            receivedSections: {
              founder: !!body.founder,
              market: !!body.market,
              business: !!body.business,
              pricing: !!body.pricing,
              voice: !!body.voice
            },
            founderValidation: {
              hasSignatureResults: body.founder?.signatureResults?.length > 0,
              hasCoreStrengths: body.founder?.coreStrengths?.length > 0,
              hasProcesses: body.founder?.processes?.length > 0,
              hasIndustries: body.founder?.industries?.length > 0
            },
            marketValidation: {
              hasTargetMarket: !!body.market?.targetMarket,
              hasBuyerRole: !!body.market?.buyerRole,
              hasPains: body.market?.pains?.length > 0,
              hasOutcomes: body.market?.outcomes?.length > 0
            },
            businessValidation: {
              hasDeliveryModel: body.business?.deliveryModel?.length > 0,
              hasCapacity: !!body.business?.capacity,
              hasMonthlyHours: !!body.business?.monthlyHours,
              hasACV: !!body.business?.acv
            },
            missingRequiredFields: validation.errors.filter(err => 
              err.message?.includes('required')
            ).map(err => err.path?.join('.'))
          }
        } as ApiResponseOptional<never>,
        { status: 400 }
      );
    }

    if (!validation.data) {
      console.error('❌ Enhanced validation data is null');
      return NextResponse.json(
        { 
          success: false,
          error: 'No valid data provided for signature offer generation' 
        } as ApiResponseOptional<never>,
        { status: 400 }
      );
    }

    console.log('✅ Enhanced input validation passed');

    // ✅ Enhanced business rules validation
    console.log('🔍 Validating enhanced business rules...');
    const businessValidation = validateOfferBusinessRules(validation.data);
    if (!businessValidation.isValid) {
      console.warn('⚠️ Enhanced business rules validation warnings:', businessValidation.warnings);
    }
    console.log('📊 Business validation score:', businessValidation.conversionPrediction.score);

    // ✅ Generate enhanced signature offers with improved error handling
    console.log('🤖 Starting ENHANCED signature offer generation...');
    let generatedOffer: GeneratedOfferPackage;
    try {
      // ✅ Initialize the enhanced service
      console.log('🔧 Initializing enhanced OfferCreatorService...');
      const offerService = new OfferCreatorService();
      
      // ✅ Call the enhanced generation method
      console.log('⚡ Calling enhanced generateOffer method...');
      generatedOffer = await offerService.generateOffer(validation.data);
      
      console.log('✅ Enhanced signature offer generation completed successfully');
      console.log('📊 Enhanced generated offer structure:');
      console.log('- Primary offer tiers:', Object.keys(generatedOffer.primaryOffer.signatureOffers));
      console.log('- Starter name:', generatedOffer.primaryOffer.signatureOffers.starter.name);
      console.log('- Core name:', generatedOffer.primaryOffer.signatureOffers.core.name);
      console.log('- Premium name:', generatedOffer.primaryOffer.signatureOffers.premium.name);
      console.log('- Analysis score:', generatedOffer.analysis.conversionPotential.score);
      console.log('- Tokens used:', generatedOffer.tokensUsed);
      console.log('- Generation time:', generatedOffer.generationTime + 'ms');
      console.log('- Comparison features count:', generatedOffer.primaryOffer.comparisonTable.features.length);
      
      // ✅ Enhanced validation of the generated offer structure
      if (!generatedOffer.primaryOffer.signatureOffers.starter.name ||
          !generatedOffer.primaryOffer.signatureOffers.core.name ||
          !generatedOffer.primaryOffer.signatureOffers.premium.name) {
        console.error('❌ Generated offer missing required offer names');
        throw new Error('Generated offer structure is incomplete - missing offer names');
      }
      
      if (!generatedOffer.primaryOffer.signatureOffers.starter.scope?.length ||
          !generatedOffer.primaryOffer.signatureOffers.core.scope?.length ||
          !generatedOffer.primaryOffer.signatureOffers.premium.scope?.length) {
        console.error('❌ Generated offer missing required scope details');
        throw new Error('Generated offer structure is incomplete - missing scope details');
      }
      
    } catch (serviceError) {
      console.error('💥 Enhanced service error during generation:', serviceError);
      console.error('Enhanced service error stack:', serviceError instanceof Error ? serviceError.stack : 'No stack');
      
      // ✅ Enhanced error response with more context
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to generate enhanced signature offers. Please try again.',
          debug: {
            errorType: serviceError instanceof Error ? serviceError.constructor.name : 'Unknown',
            errorMessage: serviceError instanceof Error ? serviceError.message : 'Unknown service error',
            inputSummary: {
              targetMarket: validation.data.market.targetMarket,
              industries: validation.data.founder.industries,
              deliveryModels: validation.data.business.deliveryModel,
              pricePosture: validation.data.pricing.pricePosture
            }
          }
        } as ApiResponseOptional<never>,
        { status: 500 }
      );
    }

    // ✅ Debug the data structure before saving
    console.log('🔍 Pre-save validation check:');
    console.log('- User ID:', user.id);
    console.log('- Workspace ID:', workspaceId);
    console.log('- Generated offer keys:', Object.keys(generatedOffer));
    console.log('- Primary offer keys:', Object.keys(generatedOffer.primaryOffer));
    console.log('- Signature offers keys:', Object.keys(generatedOffer.primaryOffer.signatureOffers));
    console.log('- Validation data keys:', Object.keys(validation.data));

    // ✅ ENHANCED Auto-save the signature offers with better error handling
    console.log('💾 Auto-saving enhanced signature offers...');
    let offerId: string;
    let saveSuccess = false;
    
    try {
      const offerService = new OfferCreatorService();
      offerId = await offerService.saveOffer(user.id, workspaceId, generatedOffer, validation.data);
      saveSuccess = true;
      console.log('✅ Enhanced signature offers AUTO-SAVED with ID:', offerId);
    } catch (saveError) {
      console.error('💥 Error auto-saving enhanced offers:', saveError);
      
      // Log the specific error for debugging
      if (saveError instanceof Error) {
        console.error('💥 Save error details:', {
          message: saveError.message,
          stack: saveError.stack,
          name: saveError.name
        });
      }
      
      // Try alternative save approach
      try {
        console.log('🔄 Attempting simplified save approach...');
        
        // Create a new service instance for retry
        const retryOfferService = new OfferCreatorService();
        
        // Create a simplified version for emergency save
        const simplifiedOffer = {
          ...generatedOffer,
          primaryOffer: {
            ...generatedOffer.primaryOffer,
            signatureOffers: {
              starter: { ...generatedOffer.primaryOffer.signatureOffers.starter },
              core: { ...generatedOffer.primaryOffer.signatureOffers.core },
              premium: { ...generatedOffer.primaryOffer.signatureOffers.premium }
            }
          }
        };
        
        offerId = await retryOfferService.saveOffer(user.id, workspaceId, simplifiedOffer, validation.data);
        saveSuccess = true;
        console.log('✅ Enhanced offers saved with simplified approach:', offerId);
      } catch (retryError) {
        console.error('💥 Retry save also failed:', retryError);
        // Generate temp ID but mark as unsaved
        offerId = `temp_enhanced_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        saveSuccess = false;
        console.warn('⚠️ Using temporary ID - offers not saved to database');
      }
    }

    // ✅ Enhanced usage logging
    console.log('📊 Logging enhanced usage...');
    try {
      await logUsage({
        userId: user.id,
        feature: 'enhanced_signature_offer_generation',
        tokens: generatedOffer.tokensUsed || 0,
        timestamp: new Date(),
        metadata: {
          offerId,
          workspaceId,
          saved: saveSuccess, // Add save status to logging
          targetMarket: validation.data.market.targetMarket,
          industries: validation.data.founder.industries,
          deliveryModels: validation.data.business.deliveryModel,
          pricePosture: validation.data.pricing.pricePosture,
          brandTone: validation.data.voice.brandTone,
          positioning: validation.data.voice.positioning,
          conversionScore: generatedOffer.analysis.conversionPotential.score,
          generationTime: generatedOffer.generationTime,
          businessWarnings: businessValidation.warnings.length,
          businessSuggestions: businessValidation.suggestions.length,
          credibilityFactors: generatedOffer.analysis.conversionPotential.factors.length,
          enhancedVersion: true,
          founderCredibility: generatedOffer.analysis.conversionPotential.factors.find(f => f.factor.includes('credibility'))?.impact || 'Unknown',
          marketAlignment: generatedOffer.analysis.conversionPotential.factors.find(f => f.factor.includes('alignment'))?.impact || 'Unknown'
        }
      });
      console.log('✅ Enhanced usage logged successfully');
    } catch (logError) {
      console.error('⚠️ Enhanced usage logging failed (non-critical):', logError);
    }

    console.log('🎉 Enhanced signature offer generation completed successfully');
    console.log(`📊 Final status: Generated=${true}, Saved=${saveSuccess}, OfferID=${offerId}`);
    
    // ✅ Enhanced success response with save status and more detailed metadata
    return NextResponse.json({
      success: true,
      data: generatedOffer,
      meta: {
        offerId,
        saved: saveSuccess,
        autoSaved: saveSuccess,
        tokensUsed: generatedOffer.tokensUsed,
        generationTime: generatedOffer.generationTime,
        remaining: rateLimitResult.remaining,
        businessValidation: {
          conversionScore: businessValidation.conversionPrediction.score,
          warnings: businessValidation.warnings,
          suggestions: businessValidation.suggestions.slice(0, 5)
        },
        offerQuality: {
          conversionPotential: generatedOffer.analysis.conversionPotential.score,
          credibilityScore: generatedOffer.analysis.conversionPotential.factors.find(f => f.factor.includes('credibility'))?.impact || 'Medium',
          marketFitScore: generatedOffer.analysis.conversionPotential.factors.find(f => f.factor.includes('alignment'))?.impact || 'Medium',
          scalabilityScore: generatedOffer.analysis.conversionPotential.factors.find(f => f.factor.includes('model'))?.impact || 'Medium'
        },
        enhanced: true,
        version: '2.0'
      }
    } as ApiResponse<GeneratedOfferPackage>);

  } catch (error) {
    console.error('💥 Unexpected Enhanced Signature Offer Creator API Error:', error);
    console.error('Enhanced error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate enhanced signature offers. Please try again.',
        debug: {
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          enhanced: true
        }
      } as ApiResponseOptional<never>,
      { status: 500 }
    );
  }
}

// GET method for listing enhanced signature offers
export async function GET(req: NextRequest) {
  console.log('🚀 Enhanced Signature Offers List API Route called');
  
  try {
    // ✅ FIXED: Use the same authentication flow as pricing-calculator
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('❌ Auth failed in enhanced offers list:', authError);
      
      const response = NextResponse.json(
        { 
          success: false,
          error: 'Authentication required. Please clear your browser cookies and sign in again.',
          code: 'AUTH_REQUIRED'
        } as ApiResponseOptional<never>,
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
      `enhanced_signature_offers_list:${user.id}`, 
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
        } as ApiResponseOptional<never>,
        { status: 429 }
      );
    }
    console.log('✅ Rate limit check passed');

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const targetMarket = searchParams.get('targetMarket');
    const pricePosture = searchParams.get('pricePosture');

    // ✅ FIXED: Validate workspace access if provided
    if (workspaceId) {
      const hasAccess = await validateWorkspaceAccess(user.id, workspaceId);
      if (!hasAccess) {
        return NextResponse.json({ 
          success: false,
          error: 'Workspace access denied.',
          code: 'WORKSPACE_ACCESS_DENIED'
        }, { status: 403 });
      }
    }

    console.log('📋 Fetching enhanced signature offers for user:', user.id);
    console.log('🔍 Enhanced filters - workspace:', workspaceId, 'market:', targetMarket, 'pricing:', pricePosture);
    
    // ✅ Enhanced offer fetching with improved type safety
    let offers: UserOffer[];
    try {
      const offerService = new OfferCreatorService();
      offers = await offerService.getUserOffers(user.id, workspaceId || undefined);

      // ✅ Enhanced filtering with better type safety
      if (targetMarket) {
        offers = offers.filter(offer => {
          if (offer.metadata && typeof offer.metadata === 'object' && 'targetMarket' in offer.metadata) {
            const targetMarketValue = offer.metadata.targetMarket;
            if (typeof targetMarketValue === 'string') {
              return targetMarketValue.toLowerCase().includes(targetMarket.toLowerCase());
            }
          }
          return false;
        });
      }

      if (pricePosture) {
        offers = offers.filter(offer => {
          if (offer.metadata && typeof offer.metadata === 'object' && 'pricePosture' in offer.metadata) {
            return offer.metadata.pricePosture === pricePosture;
          }
          return false;
        });
      }
      
      console.log('✅ Retrieved', offers.length, 'enhanced signature offers');
      
      // ✅ Enhanced logging of offer details
      console.log('📊 Enhanced offers summary:');
      const offerStats = offers.reduce((stats, offer) => {
        const posture = offer.metadata?.pricePosture || 'unknown';
        stats[posture] = (stats[posture] || 0) + 1;
        return stats;
      }, {} as Record<string, number>);
      console.log('- Price posture distribution:', offerStats);
      
    } catch (fetchError) {
      console.error('💥 Error fetching enhanced offers:', fetchError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch enhanced signature offers. Please try again.',
          debug: {
            errorType: fetchError instanceof Error ? fetchError.constructor.name : 'Unknown',
            errorMessage: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error'
          }
        } as ApiResponseOptional<never>,
        { status: 500 }
      );
    }

    // ✅ Enhanced usage logging for listing offers
    console.log('📊 Logging enhanced list usage...');
    try {
      await logUsage({
        userId: user.id,
        feature: 'enhanced_signature_offers_list',
        tokens: 0,
        timestamp: new Date(),
        metadata: {
          workspaceId,
          targetMarket,
          pricePosture,
          resultCount: offers.length,
          enhanced: true,
          version: '2.0',
          filters: {
            hasWorkspaceFilter: !!workspaceId,
            hasMarketFilter: !!targetMarket,
            hasPricingFilter: !!pricePosture
          }
        }
      });
      console.log('✅ Enhanced list usage logged successfully');
    } catch (logError) {
      console.error('⚠️ Enhanced list usage logging failed (non-critical):', logError);
    }

    console.log('🎉 Enhanced signature offers fetch completed successfully');
    
    // ✅ Enhanced success response with richer metadata
    return NextResponse.json({
      success: true,
      data: offers,
      meta: {
        count: offers.length,
        remaining: rateLimitResult.remaining,
        filters: {
          workspaceId,
          targetMarket,
          pricePosture
        },
        statistics: {
          byPricePosture: offers.reduce((stats, offer) => {
            const posture = offer.metadata?.pricePosture || 'unknown';
            stats[posture] = (stats[posture] || 0) + 1;
            return stats;
          }, {} as Record<string, number>),
          byIndustry: offers.reduce((stats, offer) => {
            const industries = offer.metadata?.industries || [];
            industries.forEach(industry => {
              if (typeof industry === 'string') {
                stats[industry] = (stats[industry] || 0) + 1;
              }
            });
            return stats;
          }, {} as Record<string, number>),
          avgConversionScore: offers.reduce((sum, offer) => {
            return sum + (offer.metadata?.conversionScore || 0);
          }, 0) / (offers.length || 1)
        },
        enhanced: true,
        version: '2.0'
      }
    } as ApiResponse<UserOffer[]>);

  } catch (error) {
    console.error('💥 Unexpected Enhanced Signature Offers Fetch Error:', error);
    console.error('Enhanced error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch enhanced signature offers. Please try again.',
        debug: {
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          enhanced: true
        }
      } as ApiResponseOptional<never>,
      { status: 500 }
    );
  }
}