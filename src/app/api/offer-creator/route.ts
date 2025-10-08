// app/api/offer-creator/route.ts - FIXED TO MATCH FLAT STRUCTURE

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

import { createNotification } from '@/lib/notificationHelper';

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

// Authentication function (keeping the same as before)
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

// Workspace validation function
// Update the validateWorkspaceAccess function to return the workspace
async function validateWorkspaceAccess(userId: string, workspaceId: string): Promise<{ valid: boolean; workspace?: any }> {
  try {
    const { prisma } = await import('@/lib/prisma');
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        user_id: userId
      }
    });
    
    return { 
      valid: !!workspace, 
      workspace: workspace || undefined 
    };
  } catch (error) {
    console.error('Error validating workspace access:', error);
    return { valid: false };
  }
}

// POST method for generating signature offers
export async function POST(req: NextRequest) {
  console.log('🚀 Signature Offer Creator API Route called');
  
  try {
    // Authentication
      const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      console.error('❌ Auth failed:', authError);
      
      const response = NextResponse.json(
        { 
          success: false,
          error: 'Authentication required. Please clear your browser cookies and sign in again.',
          code: 'AUTH_REQUIRED'
        } as ApiResponseOptional<never>,
        { status: 401 }
      );

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

    // Get workspace ID
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

    // Validate workspace access
    const { valid: hasAccess, workspace } = await validateWorkspaceAccess(user.id, workspaceId);
if (!hasAccess || !workspace) {
  return NextResponse.json({ 
    success: false,
    error: 'Workspace not found or access denied.',
    code: 'WORKSPACE_ACCESS_DENIED'
  }, { status: 403 });
}

console.log('✅ Workspace validated:', workspace.name);


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
        } as ApiResponseOptional<never>,
        { status: 429 }
      );
    }
    console.log('✅ Rate limit check passed');

    // Debug logging
    console.log('🔍 RECEIVED BODY STRUCTURE:');
    console.log('- founder keys:', body.founder ? Object.keys(body.founder) : 'missing');
    console.log('- market keys:', body.market ? Object.keys(body.market) : 'missing');
    console.log('- business keys:', body.business ? Object.keys(body.business) : 'missing');
    console.log('- pricing keys:', body.pricing ? Object.keys(body.pricing) : 'missing');
    console.log('- voice keys:', body.voice ? Object.keys(body.voice) : 'missing');
    
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
          error: 'Invalid input for signature offer generation', 
          details: validation.errors
        } as ApiResponseOptional<never>,
        { status: 400 }
      );
    }

    if (!validation.data) {
      console.error('❌ Validation data is null');
      return NextResponse.json(
        { 
          success: false,
          error: 'No valid data provided for signature offer generation' 
        } as ApiResponseOptional<never>,
        { status: 400 }
      );
    }

    console.log('✅ Input validation passed');

    // Business rules validation
    console.log('🔍 Validating business rules...');
    const businessValidation = validateOfferBusinessRules(validation.data);
    if (!businessValidation.isValid) {
      console.warn('⚠️ Business rules validation warnings:', businessValidation.warnings);
    }

    // FIXED: Generate signature offers with flat structure
    console.log('🤖 Starting signature offer generation...');
    let generatedOffer: GeneratedOfferPackage;
    try {
      console.log('🔧 Initializing OfferCreatorService...');
      const offerService = new OfferCreatorService();
      
      console.log('⚡ Calling generateOffer method...');
      generatedOffer = await offerService.generateOffer(validation.data);
      
      console.log('✅ Signature offer generation completed successfully');
      
      // FIXED: Debug the flat structure (no more primaryOffer)
      console.log('📊 Generated offer structure:');
      console.log('- Offer keys:', Object.keys(generatedOffer));
      console.log('- Signature offers keys:', Object.keys(generatedOffer.signatureOffers || {}));
      console.log('- Starter name:', generatedOffer.signatureOffers?.starter?.name);
      console.log('- Core name:', generatedOffer.signatureOffers?.core?.name);
      console.log('- Premium name:', generatedOffer.signatureOffers?.premium?.name);
      console.log('- Analysis score:', generatedOffer.analysis?.conversionPotential?.score);
      console.log('- Tokens used:', generatedOffer.tokensUsed);
      console.log('- Generation time:', generatedOffer.generationTime + 'ms');
      console.log('- Comparison features count:', generatedOffer.comparisonTable?.features?.length);
      
      // FIXED: Validate the flat structure
      if (!generatedOffer.signatureOffers?.starter?.name ||
          !generatedOffer.signatureOffers?.core?.name ||
          !generatedOffer.signatureOffers?.premium?.name) {
        console.error('❌ Generated offer missing required offer names');
        throw new Error('Generated offer structure is incomplete - missing offer names');
      }
      
      if (!generatedOffer.signatureOffers?.starter?.scope?.length ||
          !generatedOffer.signatureOffers?.core?.scope?.length ||
          !generatedOffer.signatureOffers?.premium?.scope?.length) {
        console.error('❌ Generated offer missing required scope details');
        throw new Error('Generated offer structure is incomplete - missing scope details');
      }
      
    } catch (serviceError) {
      console.error('💥 Service error during generation:', serviceError);
      console.error('Service error stack:', serviceError instanceof Error ? serviceError.stack : 'No stack');
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to generate signature offers. Please try again.',
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

    // FIXED: Debug the flat structure before saving
    console.log('🔍 Pre-save validation check:');
    console.log('- User ID:', user.id);
    console.log('- Workspace ID:', workspaceId);
    console.log('- Generated offer keys:', Object.keys(generatedOffer));
    console.log('- Signature offers keys:', Object.keys(generatedOffer.signatureOffers || {}));
    console.log('- Validation data keys:', Object.keys(validation.data));

    // Auto-save the signature offers
    console.log('💾 Auto-saving signature offers...');
    let offerId: string;
    let saveSuccess = false;
    
    try {
      const offerService = new OfferCreatorService();
      offerId = await offerService.saveOffer(user.id, workspaceId, generatedOffer, validation.data);
      
      saveSuccess = true;
      console.log('✅ Signature offers AUTO-SAVED with ID:', offerId);
    } catch (saveError) {
      console.error('💥 Error auto-saving offers:', saveError);
      
      if (saveError instanceof Error) {
        console.error('💥 Save error details:', {
          message: saveError.message,
          stack: saveError.stack,
          name: saveError.name
        });
      }


      
      // Try simplified save approach
      try {
        console.log('🔄 Attempting simplified save approach...');
        const retryOfferService = new OfferCreatorService();
        
        // Create a simplified version for emergency save
        const simplifiedOffer = {
          ...generatedOffer,
          signatureOffers: {
            starter: { ...generatedOffer.signatureOffers.starter },
            core: { ...generatedOffer.signatureOffers.core },
            premium: { ...generatedOffer.signatureOffers.premium }
          }
        };
        
        offerId = await retryOfferService.saveOffer(user.id, workspaceId, simplifiedOffer, validation.data);
        saveSuccess = true;
        console.log('✅ Offers saved with simplified approach:', offerId);
      
      } catch (retryError) {
        console.error('💥 Retry save also failed:', retryError);
        offerId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        saveSuccess = false;
        console.warn('⚠️ Using temporary ID - offers not saved to database');
      }
    }

      try {
  await createNotification({
    userId: user.id,
    workspaceId: workspaceId,
    workspaceSlug: workspace.slug,
    type: 'offer_creator',
    itemId: offerId,
    metadata: {
      targetMarket: validation.data.market.targetMarket,
      industries: validation.data.founder.industries,
      conversionScore: generatedOffer.analysis?.conversionPotential?.score,
      pricePosture: validation.data.pricing.pricePosture,
      deliveryModels: validation.data.business.deliveryModel
    }
  });
  
  console.log('✅ Notification created for offer:', offerId);
} catch (notifError) {
  console.error('Failed to create notification:', notifError);
  // Don't fail the request if notification fails
}

    // Usage logging
    console.log('📊 Logging usage...');
    try {
      await logUsage({
        userId: user.id,
        feature: 'signature_offer_generation',
        tokens: generatedOffer.tokensUsed || 0,
        timestamp: new Date(),
        metadata: {
          offerId,
          workspaceId,
          saved: saveSuccess,
          targetMarket: validation.data.market.targetMarket,
          industries: validation.data.founder.industries,
          deliveryModels: validation.data.business.deliveryModel,
          pricePosture: validation.data.pricing.pricePosture,
          brandTone: validation.data.voice.brandTone,
          positioning: validation.data.voice.positioning,
          conversionScore: generatedOffer.analysis?.conversionPotential?.score,
          generationTime: generatedOffer.generationTime,
          businessWarnings: businessValidation.warnings.length,
          businessSuggestions: businessValidation.suggestions.length
        }
      });
      console.log('✅ Usage logged successfully');
    } catch (logError) {
      console.error('⚠️ Usage logging failed (non-critical):', logError);
    }

    console.log('🎉 Signature offer generation completed successfully');
    console.log(`📊 Final status: Generated=${true}, Saved=${saveSuccess}, OfferID=${offerId}`);
    
    // FIXED: Success response with flat structure
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
          conversionPotential: generatedOffer.analysis?.conversionPotential?.score,
          credibilityScore: generatedOffer.analysis?.conversionPotential?.factors?.find(f => f.factor.includes('credibility'))?.impact || 'Medium',
          marketFitScore: generatedOffer.analysis?.conversionPotential?.factors?.find(f => f.factor.includes('alignment'))?.impact || 'Medium',
          scalabilityScore: generatedOffer.analysis?.conversionPotential?.factors?.find(f => f.factor.includes('model'))?.impact || 'Medium'
        },
        version: '2.0'
      }
    } as ApiResponse<GeneratedOfferPackage>);

  } catch (error) {
    console.error('💥 Unexpected Signature Offer Creator API Error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate signature offers. Please try again.',
        debug: {
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      } as ApiResponseOptional<never>,
      { status: 500 }
    );
  }
}

// GET method remains the same as it was working correctly
export async function GET(req: NextRequest) {
  console.log('🚀 Signature Offers List API Route called');
  
  try {
       const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('❌ Auth failed in offers list:', authError);
      
      const response = NextResponse.json(
        { 
          success: false,
          error: 'Authentication required. Please clear your browser cookies and sign in again.',
          code: 'AUTH_REQUIRED'
        } as ApiResponseOptional<never>,
        { status: 401 }
      );
      
      const cookiesToClear = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token'];
      cookiesToClear.forEach(cookieName => {
        response.cookies.set(cookieName, '', { expires: new Date(0), path: '/' });
      });
      
      return response;
    }

    console.log('✅ User authenticated successfully:', user.id);

    // Rate limiting
    const rateLimitResult = await rateLimit(
      `signature_offers_list:${user.id}`, 
      RATE_LIMITS.OFFER_LIST.limit, 
      RATE_LIMITS.OFFER_LIST.window
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.reset 
        } as ApiResponseOptional<never>,
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const targetMarket = searchParams.get('targetMarket');
    const pricePosture = searchParams.get('pricePosture');

    // Validate workspace access if provided
    if (workspaceId) {
     const { valid: hasAccess, workspace } = await validateWorkspaceAccess(user.id, workspaceId);
     if (!hasAccess || !workspace) {
  return NextResponse.json({ 
    success: false,
    error: 'Workspace not found or access denied.',
    code: 'WORKSPACE_ACCESS_DENIED'
  }, { status: 403 });
}

console.log('✅ Workspace validated:', workspace.name);
 } // <-- ADD THIS CLOSING BRACE
    
    
    let offers: UserOffer[];
    try {
      const offerService = new OfferCreatorService();
      offers = await offerService.getUserOffers(user.id, workspaceId || undefined);

      // Apply filters
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
      
      console.log('✅ Retrieved', offers.length, 'signature offers');
      
    } catch (fetchError) {
      console.error('💥 Error fetching offers:', fetchError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch signature offers. Please try again.'
        } as ApiResponseOptional<never>,
        { status: 500 }
      );
    }

    // Usage logging
    try {
      await logUsage({
        userId: user.id,
        feature: 'signature_offers_list',
        tokens: 0,
        timestamp: new Date(),
        metadata: {
          workspaceId,
          targetMarket,
          pricePosture,
          resultCount: offers.length
        }
      });
    } catch (logError) {
      console.error('⚠️ List usage logging failed (non-critical):', logError);
    }

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
        }
      }
    } as ApiResponse<UserOffer[]>);

  } catch (error) {
    console.error('💥 Unexpected Signature Offers Fetch Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch signature offers. Please try again.'
      } as ApiResponseOptional<never>,
      { status: 500 }
    );
  }
}