// app/api/growth-plans/analytics/route.ts - WITH SIMPLIFIED AUTHENTICATION
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GrowthPlanService } from '@/services/growthPlan.service';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { GrowthPlanAnalytics, GrowthPlanServiceResponse } from '@/types/growthPlan';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
  console.log(' Growth Plan Analytics API Route called');
  
  try {
    //   USE SIMPLIFIED AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('  Auth failed in growth plan analytics:', authError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    console.log('  Growth Plan Analytics user authenticated successfully:', user.id);
    const userId = user.id;

    //   RATE LIMITING for analytics
    const rateLimitResult = await rateLimit(
      `growth_plan_analytics:${userId}`,
      50, // 50 analytics requests per hour
      3600
    );

    if (!rateLimitResult.success) {
      console.log('  Growth plan analytics rate limit exceeded for user:', userId);
      return NextResponse.json(
        { success: false, error: 'Analytics rate limit exceeded' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Get raw workspaceId from query params
    const rawWorkspaceId = searchParams.get('workspaceId');
    const timeframe = (searchParams.get('timeframe') || 'month') as 'week' | 'month' | 'quarter';

    console.log('📊 Fetching REAL analytics for user:', userId, 'Raw workspaceId from query:', rawWorkspaceId, 'timeframe:', timeframe);

    // --- Robust Workspace ID Handling for Analytics GET ---
    let finalWorkspaceIdForAnalytics: string | undefined;

    // Validate the rawWorkspaceId from the query
    if (rawWorkspaceId && typeof rawWorkspaceId === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(rawWorkspaceId)) {
      console.log("   Using valid workspaceId from query parameter for analytics");
      finalWorkspaceIdForAnalytics = rawWorkspaceId;
    } else if (rawWorkspaceId === 'default' || !rawWorkspaceId) {
      // Need to get the user's actual default workspace ID
      console.log("   Need to resolve 'default' or missing workspaceId for analytics. Fetching user's default workspace...");
      try {
        const defaultWorkspace = await prisma.workspace.findFirst({
          where: { user_id: userId, slug: 'default' }
        });

        if (defaultWorkspace) {
          console.log("   Resolved 'default' to workspace ID for analytics:", defaultWorkspace.id);
          finalWorkspaceIdForAnalytics = defaultWorkspace.id;
        } else {
          console.warn("   User's default workspace not found for analytics. Fetching analytics for all user workspaces.");
          finalWorkspaceIdForAnalytics = undefined;
        }
      } catch (dbError) {
        console.error('  Database error resolving default workspace ID for analytics GET:', dbError);
        finalWorkspaceIdForAnalytics = undefined;
      }
    } else {
      // rawWorkspaceId is a string but not a valid UUID nor 'default'
      console.warn("   Invalid workspaceId format received in analytics query:", rawWorkspaceId);
      finalWorkspaceIdForAnalytics = undefined;
    }
    // --- End of Robust Workspace ID Handling for Analytics GET ---

    console.log('📊 Fetching REAL analytics for user:', userId, 'Using resolved/final workspaceId:', finalWorkspaceIdForAnalytics, 'timeframe:', timeframe);

    let analytics: GrowthPlanAnalytics;

    try {
      //   NOW USING REAL DATABASE DATA!
      analytics = await growthPlanService.getGrowthPlanAnalytics(
        userId,
        finalWorkspaceIdForAnalytics,
        timeframe
      );

      console.log('  Real analytics fetched successfully:');
      console.log('- Total plans:', analytics.totalPlans);
      console.log('- Plans this period:', analytics.plansThisMonth || 0);
      console.log('- Top industries:', analytics.topIndustries?.map(i => i.industry).join(', '));
      console.log('- Timeframe distribution:', JSON.stringify(analytics.timeframeDistribution));

    } catch (serviceError) {
      console.error('  Error fetching real analytics:', serviceError);
      
      //   Create empty analytics if service fails
      analytics = {
        totalPlans: 0,
        plansThisMonth: 0,
        industryDistribution: {},
        timeframeDistribution: {
          '3m': 0,
          '6m': 0,
          '12m': 0
        },
        timeframe,
        topIndustries: [
          { industry: 'SaaS', count: 0, percentage: 0 },
          { industry: 'E-commerce', count: 0, percentage: 0 },
          { industry: 'Healthcare', count: 0, percentage: 0 }
        ],
        averageMetrics: {
          tokensPerPlan: 0,
          generationTime: 0
        },
        plansByDate: [],
        insights: [
          'No growth plans created yet',
          'Create your first plan to see detailed analytics',
          'Analytics will show trends and insights as you generate more plans'
        ]
      };
      
      console.log('⚠️ Using empty analytics structure due to service error');
    }

    //   LOG USAGE
    try {
      await logUsage({
        userId,
        feature: 'growth_plan_analytics',
        tokens: 0,
        timestamp: new Date(),
        metadata: {
          workspaceId: finalWorkspaceIdForAnalytics, 
          timeframe,
          totalPlans: analytics.totalPlans,
          resultType: analytics.totalPlans > 0 ? 'real_data' : 'empty_state'
        }
      });
      console.log('  Growth plan analytics usage logged');
    } catch (logError) {
      console.error('⚠️ Growth plan analytics usage logging failed (non-critical):', logError);
    }

    const response: GrowthPlanServiceResponse<GrowthPlanAnalytics> = {
      success: true,
      data: analytics,
      message: analytics.totalPlans > 0 
        ? `Analytics loaded for ${analytics.totalPlans} growth plan${analytics.totalPlans === 1 ? '' : 's'}`
        : 'No plans found. Create your first growth plan to see analytics.'
    };

    console.log('  Growth plan analytics request completed successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('  Unexpected Growth Plan Analytics API Error:', error);
    console.error('Growth plan analytics error stack:', error instanceof Error ? error.stack : 'No stack');
    
    //   Return empty analytics instead of failing completely
    const fallbackAnalytics: GrowthPlanAnalytics = {
      totalPlans: 0,
      plansThisMonth: 0,
      industryDistribution: {},
      timeframeDistribution: {
        '3m': 0,
        '6m': 0,
        '12m': 0
      },
      timeframe: 'month',
      topIndustries: [
        { industry: 'SaaS', count: 0, percentage: 0 },
        { industry: 'E-commerce', count: 0, percentage: 0 },
        { industry: 'Healthcare', count: 0, percentage: 0 }
      ],
      averageMetrics: {
        tokensPerPlan: 0,
        generationTime: 0
      },
      plansByDate: [],
      insights: [
        'Analytics temporarily unavailable',
        'Please try again later',
        'Create growth plans to see detailed insights'
      ]
    };
    
    return NextResponse.json(
      {
        success: true,
        data: fallbackAnalytics,
        message: 'Analytics temporarily unavailable. Showing empty state.',
        meta: {
          error: true,
          fallback: true
        }
      },
      { status: 200 }
    );
  }
}