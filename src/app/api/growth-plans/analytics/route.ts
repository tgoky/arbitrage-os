// app/api/growth-plans/analytics/route.ts - WITH REAL DATABASE ANALYTICS
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
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

// ✅ ROBUST AUTHENTICATION (same as main route)
async function getAuthenticatedUser(request: NextRequest) {
  try {
    const cookieStore = cookies();
    
    // Method 1: Try with route handler client
    try {
      const supabase = createRouteHandlerClient({
        cookies: () => cookieStore
      });
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (!error && user) {
        console.log('✅ Growth Plan Analytics Auth Method 1 (route handler) succeeded for user:', user.id);
        return { user, error: null };
      }
      
      console.log('⚠️ Growth Plan analytics route handler auth failed:', error?.message);
    } catch (helperError) {
      console.warn('⚠️ Growth Plan analytics route handler client failed:', helperError);
    }
    
    // Method 2: Try with authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        console.log('🔍 Growth Plan analytics trying token auth with token:', token.substring(0, 20) + '...');
        
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              get: () => undefined,
            },
          }
        );
        
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (!error && user) {
          console.log('✅ Growth Plan Analytics Auth Method 2 (token) succeeded for user:', user.id);
          return { user, error: null };
        }
        
        console.log('⚠️ Growth Plan analytics token auth failed:', error?.message);
      } catch (tokenError) {
        console.warn('⚠️ Growth Plan analytics token auth error:', tokenError);
      }
    }
    
    // Method 3: Try with cookie validation
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            try {
              const cookie = cookieStore.get(name);
              if (!cookie?.value) return undefined;
              
              // Validate base64 cookies
              if (cookie.value.startsWith('base64-')) {
                try {
                  const decoded = atob(cookie.value.substring(7));
                  JSON.parse(decoded); // Validate JSON
                  return cookie.value;
                } catch (e) {
                  console.warn(`Invalid Growth Plan analytics cookie ${name}, skipping...`);
                  return undefined;
                }
              }
              return cookie.value;
            } catch (error) {
              console.warn(`Error reading Growth Plan analytics cookie ${name}:`, error);
              return undefined;
            }
          },
        },
      }
    );
    
    const { data: { user }, error } = await supabaseSSR.auth.getUser();
    
    if (!error && user) {
      console.log('✅ Growth Plan Analytics Auth Method 3 (SSR cookies) succeeded for user:', user.id);
    } else {
      console.log('⚠️ Growth Plan analytics SSR cookie auth failed:', error?.message);
    }
    
    return { user, error };
    
  } catch (error) {
    console.error('💥 All Growth Plan analytics authentication methods failed:', error);
    return { user: null, error };
  }
}

function createAuthErrorResponse() {
  const response = NextResponse.json(
    { 
      success: false,
      error: 'Authentication required. Please clear your browser cookies and sign in again.',
      code: 'AUTH_REQUIRED'
    },
    { status: 401 }
  );
  
  // Clear potentially corrupted cookies
  const cookiesToClear = [
    'sb-access-token',
    'sb-refresh-token',
    'supabase-auth-token'
  ];
  
  cookiesToClear.forEach(cookieName => {
    response.cookies.set(cookieName, '', {
      expires: new Date(0),
      path: '/',
    });
  });
  
  return response;
}

export async function GET(request: NextRequest) {
  console.log('🚀 Growth Plan Analytics API Route called');
  
  try {
    // ✅ USE ROBUST AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      console.error('❌ Auth failed in growth plan analytics:', authError);
      return createAuthErrorResponse();
    }

    console.log('✅ Growth Plan Analytics user authenticated successfully:', user.id);
    const userId = user.id;

    // ✅ RATE LIMITING for analytics
    const rateLimitResult = await rateLimit(
      `growth_plan_analytics:${userId}`,
      50, // 50 analytics requests per hour
      3600
    );

    if (!rateLimitResult.success) {
      console.log('❌ Growth plan analytics rate limit exceeded for user:', userId);
      return NextResponse.json(
        { success: false, error: 'Analytics rate limit exceeded' },
        { status: 429 }
      );
    }

   const { searchParams } = new URL(request.url);

// Get raw workspaceId from query params
const rawWorkspaceId = searchParams.get('workspaceId'); // This could be 'default', a UUID, or null
const timeframe = (searchParams.get('timeframe') || 'month') as 'week' | 'month' | 'quarter';

console.log('📊 Fetching REAL analytics for user:', userId, 'Raw workspaceId from query:', rawWorkspaceId, 'timeframe:', timeframe);

// --- Add Robust Workspace ID Handling for Analytics GET ---
let finalWorkspaceIdForAnalytics: string | undefined;

// Validate the rawWorkspaceId from the query
if (rawWorkspaceId && typeof rawWorkspaceId === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(rawWorkspaceId)) {
  console.log("   Using valid workspaceId from query parameter for analytics");
  finalWorkspaceIdForAnalytics = rawWorkspaceId;
} else if (rawWorkspaceId === 'default' || !rawWorkspaceId) { // Handle 'default' string or missing ID
  // Need to get the user's actual default workspace ID
  console.log("   Need to resolve 'default' or missing workspaceId for analytics. Fetching user's default workspace...");
  try {
    const defaultWorkspace = await prisma.workspace.findFirst({
      where: { user_id: userId, slug: 'default' } // Or use the logic from POST handler
    });

    if (defaultWorkspace) {
      console.log("   Resolved 'default' to workspace ID for analytics:", defaultWorkspace.id);
      finalWorkspaceIdForAnalytics = defaultWorkspace.id;
    } else {
      console.warn("   User's default workspace not found for analytics. Fetching analytics for all user workspaces or none?");
      // Decide: Fetch for all user's workspaces? Or pass undefined?
      finalWorkspaceIdForAnalytics = undefined; // Or handle as needed
    }
  } catch (dbError) {
    console.error('💥 Database error resolving default workspace ID for analytics GET:', dbError);
    // Even if workspace resolution fails, we might still want to try fetching analytics
    // without a specific workspace filter, or return the fallback.
    // Let's proceed with undefined for now and let the service handle it.
    finalWorkspaceIdForAnalytics = undefined;
  }
} else {
  // rawWorkspaceId is a string but not a valid UUID nor 'default'
  console.warn("   Invalid workspaceId format received in analytics query:", rawWorkspaceId);
  // Decide: Return error or ignore filter?
  // Let's ignore the invalid filter for now.
  finalWorkspaceIdForAnalytics = undefined;
}
// --- End of Robust Workspace ID Handling for Analytics GET ---

console.log('📊 Fetching REAL analytics for user:', userId, 'Using resolved/final workspaceId:', finalWorkspaceIdForAnalytics, 'timeframe:', timeframe);

let analytics: GrowthPlanAnalytics;

try {
  // ✅ NOW USING REAL DATABASE DATA! - Pass the resolved workspace ID
  analytics = await growthPlanService.getGrowthPlanAnalytics(
    userId,
    finalWorkspaceIdForAnalytics, // <-- Use the resolved ID here
    timeframe
  );

  console.log('✅ Real analytics fetched successfully:');
  console.log('- Total plans:', analytics.totalPlans);
  console.log('- Plans this period:', analytics.plansThisMonth || 0);
  console.log('- Top industries:', analytics.topIndustries?.map(i => i.industry).join(', '));
  console.log('- Timeframe distribution:', JSON.stringify(analytics.timeframeDistribution));

} catch (serviceError) {
  console.error('💥 Error fetching real analytics:', serviceError);
      
      // ✅ Create empty analytics if service fails
      analytics = {
        totalPlans: 0,
        plansThisMonth: 0,
        industryDistribution: {}, // ✅ ADD: Required property
        timeframeDistribution: {
          '3m': 0,
          '6m': 0,
          '12m': 0
        },
        timeframe, // ✅ ADD: Required property from request params
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

    // ✅ LOG USAGE
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
      console.log('✅ Growth plan analytics usage logged');
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

    console.log('✅ Growth plan analytics request completed successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('💥 Unexpected Growth Plan Analytics API Error:', error);
    console.error('Growth plan analytics error stack:', error instanceof Error ? error.stack : 'No stack');
    
    // ✅ Return empty analytics instead of failing completely
    const fallbackAnalytics: GrowthPlanAnalytics = {
      totalPlans: 0,
      plansThisMonth: 0,
      industryDistribution: {}, // ✅ ADD: Required property
      timeframeDistribution: {
        '3m': 0,
        '6m': 0,
        '12m': 0
      },
      timeframe: 'month', // ✅ ADD: Required property (default value)
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
        success: true, // Return success with empty data instead of failing
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