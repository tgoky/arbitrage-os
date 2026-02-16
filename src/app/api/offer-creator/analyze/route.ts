// app/api/offer-creator/analyze/route.ts - UPDATED TO MATCH NEW STRUCTURE
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { OfferCreatorService } from '../../../../services/offerCreator.service';
import { validateOfferCreatorInput, validateOfferBusinessRules } from '../../../validators/offerCreator.validator';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { OfferCreatorInput, ApiResponse, BusinessRulesValidation } from '@/types/offerCreator';

const RATE_LIMITS = {
  ANALYSIS: {
    limit: 15, // Increased for better UX
    window: 3600 // 1 hour
  }
};

//   Enhanced authentication function (matches other routes)
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
      console.error('  Authentication failed:', error);
      return { user: null, error: error || new Error('No user found') };
    }
    
    console.log('  User authenticated:', user.id);
    return { user, error: null };
    
  } catch (error) {
    console.error('  Authentication error:', error);
    return { user: null, error };
  }
}


function getIndustryBenchmark(industry: string) {
  const benchmarks: Record<string, any> = {
    'B2B SaaS': {
      conversionRate: { min: 2.5, max: 6.0, average: 3.8 },
      proposalRate: { min: 20, max: 35, average: 27 },
      avgDealSize: { min: 30000, max: 100000, average: 55000 },
      timeToClose: { min: 45, max: 120, average: 75 }
    },
    'E-commerce': {
      conversionRate: { min: 1.5, max: 4.0, average: 2.8 },
      proposalRate: { min: 25, max: 45, average: 35 },
      avgDealSize: { min: 5000, max: 25000, average: 15000 },
      timeToClose: { min: 15, max: 45, average: 30 }
    },
    'Healthcare': {
      conversionRate: { min: 3.0, max: 7.0, average: 4.5 },
      proposalRate: { min: 18, max: 32, average: 25 },
      avgDealSize: { min: 50000, max: 150000, average: 85000 },
      timeToClose: { min: 60, max: 180, average: 120 }
    },
    'Finance': {
      conversionRate: { min: 2.8, max: 6.5, average: 4.2 },
      proposalRate: { min: 15, max: 30, average: 22 },
      avgDealSize: { min: 75000, max: 200000, average: 125000 },
      timeToClose: { min: 90, max: 240, average: 150 }
    },
    'Marketing Agencies': {
      conversionRate: { min: 4.0, max: 8.0, average: 6.0 },
      proposalRate: { min: 30, max: 50, average: 40 },
      avgDealSize: { min: 15000, max: 40000, average: 28000 },
      timeToClose: { min: 30, max: 75, average: 50 }
    },
    'General': {
      conversionRate: { min: 2.0, max: 5.0, average: 3.2 },
      proposalRate: { min: 20, max: 40, average: 30 },
      avgDealSize: { min: 20000, max: 60000, average: 40000 },
      timeToClose: { min: 30, max: 90, average: 60 }
    }
  };

  return benchmarks[industry] || benchmarks['General'];
}

// POST method for analyzing signature offers
export async function POST(req: NextRequest) {
  try {
    console.log(' Signature Offer Analysis API called');

    //   Enhanced authentication
      const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      console.error('  Auth failed in offer analysis:', authError);
      
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

    console.log('  User authenticated successfully:', user.id);

    // Rate limiting for analysis requests
    console.log('🔍 Checking rate limits for user:', user.id);
    const rateLimitResult = await rateLimit(
      `signature_offer_analysis:${user.id}`,
      RATE_LIMITS.ANALYSIS.limit,
      RATE_LIMITS.ANALYSIS.window
    );
    if (!rateLimitResult.success) {
      console.log('  Rate limit exceeded for user:', user.id);
      return NextResponse.json(
        {
          success: false,
          error: 'Too many analysis requests. Please try again later.',
          retryAfter: rateLimitResult.reset
        } as ApiResponse<never>,
        { status: 429 }
      );
    }
    console.log('  Rate limit check passed');

    // Parse and validate request body
    console.log('📥 Parsing analysis request...');
    const body = await req.json();
    
    console.log('🔍 Analysis request structure:');
    console.log('- founder keys:', body.founder ? Object.keys(body.founder) : 'missing');
    console.log('- market keys:', body.market ? Object.keys(body.market) : 'missing');
    console.log('- business keys:', body.business ? Object.keys(body.business) : 'missing');
    console.log('- pricing keys:', body.pricing ? Object.keys(body.pricing) : 'missing');
    console.log('- voice keys:', body.voice ? Object.keys(body.voice) : 'missing');
    console.log('- analysis type:', body.analysisType || 'not specified');

    // Add userId to create proper OfferCreatorInput structure
    const inputWithUserId: OfferCreatorInput = {
      founder: body.founder || {},
      market: body.market || {},
      business: body.business || {},
      pricing: body.pricing || {},
      voice: body.voice || {},
      userId: user.id
    };

    // Validate the signature offer input
    console.log('🔍 Starting validation...');
    const validation = validateOfferCreatorInput(inputWithUserId);
    if (!validation.success) {
      console.error('  VALIDATION FAILED:');
      console.error('Validation errors:', JSON.stringify(validation.errors, null, 2));
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid signature offer input', 
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
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    if (!validation.data) {
      console.error('  Validation data is null');
      return NextResponse.json(
        { 
          success: false,
          error: 'No valid signature offer data provided' 
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    console.log('  Input validation passed');

    //   Perform signature offer analysis
    console.log('🔍 Starting signature offer analysis...');
    let businessValidation: BusinessRulesValidation;
    try {
      businessValidation = validateOfferBusinessRules(validation.data);
      console.log('  Business rules analysis completed');
      console.log('📊 Analysis results:');
      console.log('- Conversion score:', businessValidation.conversionPrediction.score);
      console.log('- Warnings:', businessValidation.warnings.length);
      console.log('- Suggestions:', businessValidation.suggestions.length);
    } catch (analysisError) {
      console.error('  Error during analysis:', analysisError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to analyze signature offer. Please try again.',
          debug: analysisError instanceof Error ? analysisError.message : 'Unknown analysis error'
        } as ApiResponse<never>,
        { status: 500 }
      );
    }

    // Get industry benchmark for context
    const primaryIndustry = validation.data.founder.industries[0] || 'General';
    const benchmark = getIndustryBenchmark(primaryIndustry);

    // Generate comprehensive analysis insights with proper typing
    const analysisInsights: {
      strengths: string[];
      weaknesses: string[];
      opportunities: string[];
      recommendations: string[];
      marketFit: {
        score: number;
        factors: Array<{
          factor: string;
          impact: 'positive' | 'negative' | 'neutral';
          weight: number;
        }>;
      };
      competitivePosition: {
        industry: string;
        differentiators: string[];
        positioning: string;
        pricePosture: string;
      };
      scalabilityAssessment: {
        deliveryModels: string[];
        capacity: string;
        monthlyHours: string;
        acv: string;
      };
    } = {
      strengths: [],
      weaknesses: [],
      opportunities: [],
      recommendations: businessValidation.suggestions,
      marketFit: {
        score: businessValidation.conversionPrediction.score,
        factors: businessValidation.conversionPrediction.factors
      },
      competitivePosition: {
        industry: primaryIndustry,
        differentiators: validation.data.voice.differentiators,
        positioning: validation.data.voice.positioning,
        pricePosture: validation.data.pricing.pricePosture
      },
      scalabilityAssessment: {
        deliveryModels: validation.data.business.deliveryModel,
        capacity: validation.data.business.capacity,
        monthlyHours: validation.data.business.monthlyHours,
        acv: validation.data.business.acv
      }
    };

    // Add strengths and weaknesses based on analysis
    if (businessValidation.conversionPrediction.score > 75) {
      analysisInsights.strengths.push('Strong conversion potential');
      analysisInsights.strengths.push('Well-aligned market positioning');
    } else if (businessValidation.conversionPrediction.score < 50) {
      analysisInsights.weaknesses.push('Low conversion potential');
      analysisInsights.opportunities.push('Significant room for improvement');
    }

    if (validation.data.founder.industries.length <= 2) {
      analysisInsights.strengths.push('Focused industry targeting');
    } else {
      analysisInsights.weaknesses.push('Too broad industry focus');
    }

    if (validation.data.voice.differentiators.length >= 3) {
      analysisInsights.strengths.push('Clear differentiation strategy');
    } else {
      analysisInsights.opportunities.push('Develop stronger differentiation');
    }

    if (validation.data.pricing.pricePosture === 'premium') {
      if (validation.data.pricing.guarantee !== 'none') {
        analysisInsights.strengths.push('Premium positioning with risk mitigation');
      } else {
        analysisInsights.opportunities.push('Add guarantee to strengthen premium positioning');
      }
    }

    // Assess delivery model scalability
    const scalableModels = ['productized-service', 'training', 'licensing'];
    const hasScalableModel = validation.data.business.deliveryModel.some(model => 
      scalableModels.includes(model)
    );
    
    if (hasScalableModel) {
      analysisInsights.strengths.push('Scalable delivery model selected');
    } else {
      analysisInsights.opportunities.push('Consider more scalable delivery models');
    }

    // Evaluate capacity planning
    const capacity = parseInt(validation.data.business.capacity);
    const monthlyHours = parseInt(validation.data.business.monthlyHours);
    if (!isNaN(capacity) && !isNaN(monthlyHours)) {
      const hoursPerClient = monthlyHours / capacity;
      if (hoursPerClient >= 10 && hoursPerClient <= 50) {
        analysisInsights.strengths.push('Well-balanced capacity planning');
      } else if (hoursPerClient < 10) {
        analysisInsights.weaknesses.push('Potentially insufficient time per client');
      } else {
        analysisInsights.weaknesses.push('High time commitment per client may limit scalability');
      }
    }

    //   Log usage for signature offer analysis
    console.log('📊 Logging usage...');
    try {
      await logUsage({
        userId: user.id,
        feature: 'signature_offer_analysis',
        tokens: 0, // No AI tokens for analysis (using business rules)
        timestamp: new Date(),
        metadata: {
          analysisType: body.analysisType || 'business_rules',
          targetMarket: validation.data.market.targetMarket,
          industries: validation.data.founder.industries,
          deliveryModels: validation.data.business.deliveryModel,
          pricePosture: validation.data.pricing.pricePosture,
          conversionScore: businessValidation.conversionPrediction.score,
          warningsCount: businessValidation.warnings.length,
          suggestionsCount: businessValidation.suggestions.length,
          primaryIndustry,
          hasStrongDifferentiation: validation.data.voice.differentiators.length >= 3
        }
      });
      console.log('  Usage logged successfully');
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('⚠️ Usage logging failed (non-critical):', logError);
    }

    console.log('🎉 Signature offer analysis completed successfully');
    return NextResponse.json({
      success: true,
      data: {
        inputSummary: {
          targetMarket: validation.data.market.targetMarket,
          buyerRole: validation.data.market.buyerRole,
          industries: validation.data.founder.industries,
          deliveryModels: validation.data.business.deliveryModel,
          pricePosture: validation.data.pricing.pricePosture,
          brandTone: validation.data.voice.brandTone,
          positioning: validation.data.voice.positioning
        },
        analysis: analysisInsights,
        businessValidation: {
          isValid: businessValidation.isValid,
          conversionScore: businessValidation.conversionPrediction.score,
          warnings: businessValidation.warnings,
          suggestions: businessValidation.suggestions.slice(0, 8), // Limit suggestions
          factors: businessValidation.conversionPrediction.factors
        },
        benchmark: {
          industry: primaryIndustry,
          metrics: benchmark,
          comparison: {
            aboveBenchmark: businessValidation.conversionPrediction.score > (benchmark.conversionRate?.average * 20 || 60),
            scoreVsBenchmark: businessValidation.conversionPrediction.score - (benchmark.conversionRate?.average * 20 || 60)
          }
        }
      },
      meta: {
        analysisType: 'comprehensive_business_rules',
        remaining: rateLimitResult.remaining,
        processingTime: Date.now(),
        industryBenchmarked: primaryIndustry
      }
    } as ApiResponse<any>);

  } catch (error) {
    console.error('  Unexpected Signature Offer Analysis Error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to analyze signature offer. Please try again.',
        debug: error instanceof Error ? error.message : 'Unknown error'
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}