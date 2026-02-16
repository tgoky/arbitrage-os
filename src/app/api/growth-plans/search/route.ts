// app/api/growth-plans/search/route.ts - WITH SIMPLIFIED AUTHENTICATION
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GrowthPlanService } from '@/services/growthPlan.service';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { ListGrowthPlansResponse, GrowthPlanServiceResponse } from '@/types/growthPlan';

const growthPlanService = new GrowthPlanService();

//   SIMPLIFIED AUTHENTICATION (from work-items route)
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

export async function GET(request: NextRequest) {
  console.log(' Growth Plan Search API Route called');
  
  try {
    //   USE SIMPLIFIED AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('  Auth failed in growth plan search:', authError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    console.log('  Growth Plan Search user authenticated successfully:', user.id);
    const userId = user.id;

    //   RATE LIMITING for search
    const rateLimitResult = await rateLimit(
      `growth_plan_search:${userId}`,
      60, // 60 searches per hour
      3600
    );

    if (!rateLimitResult.success) {
      console.log('  Growth plan search rate limit exceeded for user:', userId);
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
      console.error('  Empty search query provided');
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

    console.log('🔍 Searching growth plans for query:', query.substring(0, 50) + '...', 'filters:', filters);

    let plans;
    try {
      plans = await growthPlanService.searchGrowthPlans(userId, query, filters);
      console.log('  Search completed, found', plans.length, 'plans');
    } catch (serviceError) {
      console.error('  Error during search:', serviceError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to search growth plans. Please try again.',
          debug: serviceError instanceof Error ? serviceError.message : 'Unknown service error'
        },
        { status: 500 }
      );
    }

    //   LOG USAGE
    try {
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
      console.log('  Growth plan search usage logged');
    } catch (logError) {
      console.error('⚠️ Growth plan search usage logging failed (non-critical):', logError);
    }

    const response: GrowthPlanServiceResponse<ListGrowthPlansResponse> = {
      success: true,
      data: {
        plans,
        total: plans.length,
        hasMore: false // Search results are limited by service
      }
    };

    console.log('  Growth plan search request completed successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('  Unexpected Growth Plan Search API Error:', error);
    console.error('Growth plan search error stack:', error instanceof Error ? error.stack : 'No stack');
    
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