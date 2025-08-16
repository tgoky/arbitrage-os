// app/api/growth-plans/bulk/route.ts - WITH RATE LIMITING
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { GrowthPlanService } from '@/services/growthPlan.service';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
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

    // ✅ ADD RATE LIMITING for bulk operations
    const rateLimitResult = await rateLimit(
      `growth_plan_bulk_delete:${userId}`,
      5, // 5 bulk operations per hour (strict for destructive operations)
      3600
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Bulk delete rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { planIds } = body;

    if (!Array.isArray(planIds) || planIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Plan IDs array is required' },
        { status: 400 }
      );
    }

    // Limit bulk operations to prevent abuse
    if (planIds.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete more than 50 plans at once' },
        { status: 400 }
      );
    }

    const deletedCount = await growthPlanService.bulkDeleteGrowthPlans(userId, planIds);

    // ✅ LOG USAGE
    await logUsage({
      userId,
      feature: 'growth_plan_bulk_delete',
      tokens: 0,
      timestamp: new Date(),
      metadata: {
        requestedCount: planIds.length,
        deletedCount,
        planIds: planIds.slice(0, 10) // Log first 10 IDs only
      }
    });

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
