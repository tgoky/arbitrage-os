
// app/api/growth-plans/route.ts - Fixed for Supabase Auth
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { GrowthPlanService } from '@/services/growthPlan.service';
import { validateGrowthPlanInput, validateGrowthPlanBusinessRules } from '../../validators/growthPlan.validator';
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
  inputWithUserId  // ✅ Already has userId
);

    const response: GrowthPlanServiceResponse<CreateGrowthPlanResponse> = {
      success: true,
      data: {
        planId,
        plan
      },
      message: 'Growth plan created successfully'
    };

    return NextResponse.json(response, { status: 201 });

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