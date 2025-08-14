// app/api/growth-plans/bulk/route.ts - Bulk operations with Supabase Auth
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { GrowthPlanService } from '@/services/growthPlan.service';
import { GrowthPlanServiceResponse } from '@/types/growthPlan';

const growthPlanService = new GrowthPlanService();

async function getAuthenticatedUser() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const body = await request.json();
    const { planIds } = body;

    if (!Array.isArray(planIds) || planIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Plan IDs array is required' },
        { status: 400 }
      );
    }

    const deletedCount = await growthPlanService.bulkDeleteGrowthPlans(userId, planIds);

    const response: GrowthPlanServiceResponse<{ deletedCount: number }> = {
      success: true,
      data: { deletedCount },
      message: `Successfully deleted ${deletedCount} growth plan(s)`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error bulk deleting growth plans:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete growth plans',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}