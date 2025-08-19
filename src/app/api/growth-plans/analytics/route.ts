// app/api/growth-plans/analytics/route.ts - WITH ROBUST AUTHENTICATION
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GrowthPlanService } from '@/services/growthPlan.service';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { GrowthPlanAnalytics, GrowthPlanServiceResponse } from '@/types/growthPlan';

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
    
    const workspaceId = searchParams.get('workspaceId');
    const timeframe = (searchParams.get('timeframe') || 'month') as 'week' | 'month' | 'quarter';

    console.log('📊 Fetching analytics for user:', userId, 'timeframe:', timeframe);

    let analytics;
    try {
      analytics = await growthPlanService.getGrowthPlanAnalytics(
        userId,
        workspaceId || undefined,
        timeframe
      );
      console.log('✅ Analytics fetched successfully, total plans:', analytics.totalPlans);
    } catch (serviceError) {
      console.error('💥 Error fetching analytics:', serviceError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch analytics. Please try again.',
          debug: serviceError instanceof Error ? serviceError.message : 'Unknown service error'
        },
        { status: 500 }
      );
    }

    // ✅ LOG USAGE
    try {
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
      console.log('✅ Growth plan analytics usage logged');
    } catch (logError) {
      console.error('⚠️ Growth plan analytics usage logging failed (non-critical):', logError);
    }

    const response: GrowthPlanServiceResponse<GrowthPlanAnalytics> = {
      success: true,
      data: analytics
    };

    console.log('✅ Growth plan analytics request completed successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('💥 Unexpected Growth Plan Analytics API Error:', error);
    console.error('Growth plan analytics error stack:', error instanceof Error ? error.stack : 'No stack');
    
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