// app/api/growth-plans/search/route.ts - WITH RATE LIMITING
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { GrowthPlanService } from '@/services/growthPlan.service';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { ListGrowthPlansResponse, GrowthPlanServiceResponse } from '@/types/growthPlan';

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

    // ✅ ADD RATE LIMITING for search
    const rateLimitResult = await rateLimit(
      `growth_plan_search:${userId}`,
      60, // 60 searches per hour
      3600
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Search rate limit exceeded' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    const query = searchParams.get('q') || '';
    const industry = searchParams.get('industry');
    const timeframe = searchParams.get('timeframe');
    const workspaceId = searchParams.get('workspaceId');

    if (!query.trim()) {
      return NextResponse.json(
        { success: false, error: 'Search query is required' },
        { status: 400 }
      );
    }

    const filters = {
      ...(industry && { industry }),
      ...(timeframe && { timeframe }),
      ...(workspaceId && { workspaceId })
    };

    const plans = await growthPlanService.searchGrowthPlans(userId, query, filters);

    // ✅ LOG USAGE
    await logUsage({
      userId,
      feature: 'growth_plan_search',
      tokens: 0,
      timestamp: new Date(),
      metadata: {
        query: query.substring(0, 100), // Log first 100 chars only
        filters,
        resultCount: plans.length
      }
    });

    const response: GrowthPlanServiceResponse<ListGrowthPlansResponse> = {
      success: true,
      data: {
        plans,
        total: plans.length,
        hasMore: false // Search results are limited by service
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error searching growth plans:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search growth plans',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}