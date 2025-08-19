// app/api/growth-plans/search/route.ts - WITH ROBUST AUTHENTICATION
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GrowthPlanService } from '@/services/growthPlan.service';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { ListGrowthPlansResponse, GrowthPlanServiceResponse } from '@/types/growthPlan';

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
        console.log('✅ Growth Plan Search Auth Method 1 (route handler) succeeded for user:', user.id);
        return { user, error: null };
      }
      
      console.log('⚠️ Growth Plan search route handler auth failed:', error?.message);
    } catch (helperError) {
      console.warn('⚠️ Growth Plan search route handler client failed:', helperError);
    }
    
    // Method 2: Try with authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        console.log('🔍 Growth Plan search trying token auth with token:', token.substring(0, 20) + '...');
        
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
          console.log('✅ Growth Plan Search Auth Method 2 (token) succeeded for user:', user.id);
          return { user, error: null };
        }
        
        console.log('⚠️ Growth Plan search token auth failed:', error?.message);
      } catch (tokenError) {
        console.warn('⚠️ Growth Plan search token auth error:', tokenError);
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
                  console.warn(`Invalid Growth Plan search cookie ${name}, skipping...`);
                  return undefined;
                }
              }
              return cookie.value;
            } catch (error) {
              console.warn(`Error reading Growth Plan search cookie ${name}:`, error);
              return undefined;
            }
          },
        },
      }
    );
    
    const { data: { user }, error } = await supabaseSSR.auth.getUser();
    
    if (!error && user) {
      console.log('✅ Growth Plan Search Auth Method 3 (SSR cookies) succeeded for user:', user.id);
    } else {
      console.log('⚠️ Growth Plan search SSR cookie auth failed:', error?.message);
    }
    
    return { user, error };
    
  } catch (error) {
    console.error('💥 All Growth Plan search authentication methods failed:', error);
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
  console.log('🚀 Growth Plan Search API Route called');
  
  try {
    // ✅ USE ROBUST AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      console.error('❌ Auth failed in growth plan search:', authError);
      return createAuthErrorResponse();
    }

    console.log('✅ Growth Plan Search user authenticated successfully:', user.id);
    const userId = user.id;

    // ✅ RATE LIMITING for search
    const rateLimitResult = await rateLimit(
      `growth_plan_search:${userId}`,
      60, // 60 searches per hour
      3600
    );

    if (!rateLimitResult.success) {
      console.log('❌ Growth plan search rate limit exceeded for user:', userId);
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
      console.error('❌ Empty search query provided');
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
      console.log('✅ Search completed, found', plans.length, 'plans');
    } catch (serviceError) {
      console.error('💥 Error during search:', serviceError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to search growth plans. Please try again.',
          debug: serviceError instanceof Error ? serviceError.message : 'Unknown service error'
        },
        { status: 500 }
      );
    }

    // ✅ LOG USAGE
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
      console.log('✅ Growth plan search usage logged');
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

    console.log('✅ Growth plan search request completed successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('💥 Unexpected Growth Plan Search API Error:', error);
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