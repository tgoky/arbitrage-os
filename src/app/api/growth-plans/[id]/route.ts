// app/api/growth-plans/[id]/route.ts - Individual plan operations with Supabase Auth
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { GrowthPlanService } from '@/services/growthPlan.service';
import { validateGrowthPlanInput } from '../../../validators/growthPlan.validator';
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
    const body: UpdateGrowthPlanRequest = await request.json();
    const { updates } = body;

    // Validate partial updates
    if (Object.keys(updates).length > 0) {
      const validation = validateGrowthPlanInput(updates, true); // partial validation
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
    
    const response: GrowthPlanServiceResponse<UpdateGrowthPlanResponse> = {
      success: true,
      data: {
        planId,
        plan: JSON.parse(updatedPlan.content),
        updatedAt: updatedPlan.updated_at.toISOString()
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

    const success = await growthPlanService.deleteGrowthPlan(userId, planId);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Growth plan not found' },
        { status: 404 }
      );
    }

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