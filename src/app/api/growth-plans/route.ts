// app/api/growth-plans/route.ts - WITH RATE LIMITING
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { GrowthPlanService } from '@/services/growthPlan.service';
import { validateGrowthPlanInput, validateGrowthPlanBusinessRules } from '../../validators/growthPlan.validator';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { 
  GrowthPlanInput, 
  CreateGrowthPlanRequest, 
  CreateGrowthPlanResponse,
  ListGrowthPlansResponse,
  GrowthPlanServiceResponse 
} from '@/types/growthPlan';

const growthPlanService = new GrowthPlanService();

async function getAuthenticatedUser(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // ✅ RATE LIMITING: Growth plan generation is expensive!
    const rateLimitResult = await rateLimit(
      `growth_plan_generation:${userId}`,
      5, // 5 plans per hour
      3600 // 1 hour window
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded. You can generate 5 growth plans per hour.',
          data: {
            limit: rateLimitResult.limit,
            remaining: rateLimitResult.remaining,
            resetTime: new Date(rateLimitResult.reset).toISOString()
          }
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString()
          }
        }
      );
    }

    const body: CreateGrowthPlanRequest = await request.json();
    const { input, workspaceId } = body;

    // Add userId to input
    const inputWithUserId: GrowthPlanInput = {
      ...input,
      userId
    };

    // Validate input
    const validation = validateGrowthPlanInput(inputWithUserId);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          data: validation.errors
        },
        { status: 400 }
      );
    }

    // Validate business rules
    const businessValidation = validateGrowthPlanBusinessRules(validation.data);
    if (!businessValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Business validation failed',
          data: {
            errors: businessValidation.errors,
            warnings: businessValidation.warnings,
            insights: businessValidation.insights
          }
        },
        { status: 400 }
      );
    }

    // Log warnings if any (but still proceed)
    if (businessValidation.warnings.length > 0) {
      console.warn('Growth plan validation warnings:', businessValidation.warnings);
    }

    // Generate growth plan
    const plan = await growthPlanService.generateGrowthPlan(inputWithUserId); 

    // Save to database
    const planId = await growthPlanService.saveGrowthPlan(
      userId, 
      workspaceId || 'default', 
      plan, 
      inputWithUserId
    );

    // ✅ LOG USAGE: Track AI token consumption
    await logUsage({
      userId,
      feature: 'growth_plan_generation',
      tokens: plan.tokensUsed,
      timestamp: new Date(),
      metadata: {
        planId,
        clientCompany: input.clientCompany,
        industry: input.industry,
        timeframe: input.timeframe,
        generationTime: plan.generationTime
      }
    });

    const response: GrowthPlanServiceResponse<CreateGrowthPlanResponse> = {
      success: true,
      data: {
        planId,
        plan
      },
      message: 'Growth plan created successfully'
    };

    return NextResponse.json(response, { 
      status: 201,
      headers: {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.reset.toString()
      }
    });

  } catch (error) {
    console.error('Error creating growth plan:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create growth plan',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // ✅ LIGHT RATE LIMITING: Prevent API abuse on reads
    const rateLimitResult = await rateLimit(
      `growth_plan_list:${userId}`,
      100, // 100 requests per hour
      3600 // 1 hour window
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many requests. Please slow down.' 
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    const workspaceId = searchParams.get('workspaceId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const industry = searchParams.get('industry');
    const timeframe = searchParams.get('timeframe');

    const plans = await growthPlanService.getUserGrowthPlans(
      userId, 
      workspaceId || undefined
    );

    // Apply filters
    let filteredPlans = plans;
    if (industry) {
      filteredPlans = filteredPlans.filter(plan => plan.industry === industry);
    }
    if (timeframe) {
      filteredPlans = filteredPlans.filter(plan => plan.timeframe === timeframe);
    }

    // Apply pagination
    const paginatedPlans = filteredPlans.slice(offset, offset + limit);
    const hasMore = filteredPlans.length > offset + limit;

    const response: GrowthPlanServiceResponse<ListGrowthPlansResponse> = {
      success: true,
      data: {
        plans: paginatedPlans,
        total: filteredPlans.length,
        hasMore
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error listing growth plans:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list growth plans',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
