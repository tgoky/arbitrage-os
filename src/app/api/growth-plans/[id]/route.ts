// app/api/growth-plans/[id]/route.ts - WITH RATE LIMITING
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { GrowthPlanService } from '@/services/growthPlan.service';
import { validateGrowthPlanInput } from '../../../validators/growthPlan.validator';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { 
  GetGrowthPlanResponse, 
  UpdateGrowthPlanRequest, 
  UpdateGrowthPlanResponse,
  GrowthPlanServiceResponse 
} from '@/types/growthPlan';

const growthPlanService = new GrowthPlanService();

async function getAuthenticatedUser() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const planId = params.id;

    // ✅ LIGHT RATE LIMITING: Prevent abuse
    const rateLimitResult = await rateLimit(
      `growth_plan_read:${userId}`,
      200, // 200 reads per hour
      3600
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 429 }
      );
    }

    const plan = await growthPlanService.getGrowthPlan(userId, planId);
    
    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Growth plan not found' },
        { status: 404 }
      );
    }

    const response: GrowthPlanServiceResponse<GetGrowthPlanResponse> = {
      success: true,
      data: { plan }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching growth plan:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch growth plan',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const planId = params.id;

    // ✅ MODERATE RATE LIMITING: Updates might trigger AI regeneration
    const rateLimitResult = await rateLimit(
      `growth_plan_update:${userId}`,
      20, // 20 updates per hour
      3600
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Update rate limit exceeded. You can update 20 plans per hour.' 
        },
        { status: 429 }
      );
    }

    const body: UpdateGrowthPlanRequest = await request.json();
    const { updates } = body;

    // Validate partial updates
    if (Object.keys(updates).length > 0) {
      const validation = validateGrowthPlanInput(updates, true);
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
    }

    const updatedPlan = await growthPlanService.updateGrowthPlan(userId, planId, updates);
    
    // ✅ LOG USAGE: If AI was used for regeneration
    if (updatedPlan.metadata.updateType === 'full_regeneration') {
      await logUsage({
        userId,
        feature: 'growth_plan_update_regeneration',
        tokens: updatedPlan.metadata.lastGenerationTime || 0,
        timestamp: new Date(),
        metadata: {
          planId,
          updateType: 'full_regeneration',
          fieldsUpdated: Object.keys(updates)
        }
      });
    }
    
    const response: GrowthPlanServiceResponse<UpdateGrowthPlanResponse> = {
      success: true,
      data: {
        planId,
        plan: updatedPlan.plan,
        updatedAt: updatedPlan.updatedAt.toISOString()
      },
      message: 'Growth plan updated successfully'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error updating growth plan:', error);
    
    if (error instanceof Error && error.message === 'Growth plan not found') {
      return NextResponse.json(
        { success: false, error: 'Growth plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update growth plan',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const planId = params.id;

    // ✅ MODERATE RATE LIMITING: Prevent delete spam
    const rateLimitResult = await rateLimit(
      `growth_plan_delete:${userId}`,
      50, // 50 deletes per hour
      3600
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Delete rate limit exceeded' },
        { status: 429 }
      );
    }

    const success = await growthPlanService.deleteGrowthPlan(userId, planId);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Growth plan not found' },
        { status: 404 }
      );
    }

    // ✅ LOG USAGE: Track deletions
    await logUsage({
      userId,
      feature: 'growth_plan_deletion',
      tokens: 0,
      timestamp: new Date(),
      metadata: {
        planId,
        action: 'delete'
      }
    });

    const response: GrowthPlanServiceResponse = {
      success: true,
      message: 'Growth plan deleted successfully'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error deleting growth plan:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete growth plan',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
