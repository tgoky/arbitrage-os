// app/api/growth-plans/analytics/route.ts - WITH RATE LIMITING
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { GrowthPlanService } from '@/services/growthPlan.service';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { GrowthPlanAnalytics, GrowthPlanServiceResponse } from '@/types/growthPlan';

const growthPlanService = new GrowthPlanService();

async function getAuthenticatedUser() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // ✅ ADD RATE LIMITING for analytics
    const rateLimitResult = await rateLimit(
      `growth_plan_analytics:${userId}`,
      50, // 50 analytics requests per hour
      3600
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Analytics rate limit exceeded' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    const workspaceId = searchParams.get('workspaceId');
    const timeframe = (searchParams.get('timeframe') || 'month') as 'week' | 'month' | 'quarter';

    const analytics = await growthPlanService.getGrowthPlanAnalytics(
      userId, 
      workspaceId || undefined, 
      timeframe
    );

    // ✅ LOG USAGE
    await logUsage({
      userId,
      feature: 'growth_plan_analytics',
      tokens: 0,
      timestamp: new Date(),
      metadata: {
        workspaceId,
        timeframe,
        totalPlans: analytics.totalPlans
      }
    });

    const response: GrowthPlanServiceResponse<GrowthPlanAnalytics> = {
      success: true,
      data: analytics
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching growth plan analytics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}