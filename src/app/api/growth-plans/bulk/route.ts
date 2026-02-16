// app/api/growth-plans/bulk/route.ts - WITH ROBUST AUTHENTICATION
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GrowthPlanService } from '@/services/growthPlan.service';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { GrowthPlanServiceResponse } from '@/types/growthPlan';

const growthPlanService = new GrowthPlanService();

//   ROBUST AUTHENTICATION (same as main route)
// Use this IMPROVED 3-method approach in ALL routes
async function getAuthenticatedUser(request: NextRequest) {
  try {
    const cookieStore = cookies();
    
    // Method 1: Authorization header (most reliable for API calls)
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: { get: () => undefined },
          }
        );
        
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) {
          return { user, error: null };
        }
      } catch (tokenError) {
        console.warn('Token auth failed:', tokenError);
      }
    }
    
    // Method 2: SSR cookies (FIXED cookie handling)
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              try {
                const cookie = cookieStore.get(name);
                if (!cookie?.value) return undefined;
                
                // FIXED: Proper base64 cookie handling
                if (cookie.value.startsWith('base64-')) {
                  try {
                    const decoded = atob(cookie.value.substring(7));
                    JSON.parse(decoded); // Validate it's valid JSON
                    return cookie.value;
                  } catch (e) {
                    console.warn(`Corrupted base64 cookie ${name}, skipping`);
                    return undefined; // Skip corrupted cookies
                  }
                }
                
                return cookie.value;
              } catch (error) {
                console.warn(`Error reading cookie ${name}:`, error);
                return undefined;
              }
            },
          },
        }
      );
      
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        return { user, error: null };
      }
    } catch (ssrError) {
      console.warn('SSR cookie auth failed:', ssrError);
    }
    
    // Method 3: Route handler client (fallback)
    try {
      const supabase = createRouteHandlerClient({
        cookies: () => cookieStore
      });
      
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        return { user, error: null };
      }
    } catch (routeError) {
      console.warn('Route handler auth failed:', routeError);
    }
    
    return { user: null, error: new Error('All authentication methods failed') };
    
  } catch (error) {
    console.error('Authentication error:', error);
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

export async function DELETE(request: NextRequest) {
  console.log(' Growth Plan Bulk Delete API Route called');
  
  try {
    //   USE ROBUST AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      console.error('  Auth failed in growth plan bulk delete:', authError);
      return createAuthErrorResponse();
    }

    console.log('  Growth Plan Bulk Delete user authenticated successfully:', user.id);
    const userId = user.id;

    //   RATE LIMITING for bulk operations (strict for destructive operations)
    const rateLimitResult = await rateLimit(
      `growth_plan_bulk_delete:${userId}`,
      5, // 5 bulk operations per hour
      3600
    );

    if (!rateLimitResult.success) {
      console.log('  Growth plan bulk delete rate limit exceeded for user:', userId);
      return NextResponse.json(
        { success: false, error: 'Bulk delete rate limit exceeded' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('  Failed to parse bulk delete request body:', parseError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid JSON in request body' 
        },
        { status: 400 }
      );
    }

    const { planIds } = body;

    if (!Array.isArray(planIds) || planIds.length === 0) {
      console.error('  Invalid planIds in bulk delete request');
      return NextResponse.json(
        { success: false, error: 'Plan IDs array is required' },
        { status: 400 }
      );
    }

    // Limit bulk operations to prevent abuse
    if (planIds.length > 50) {
      console.error('  Too many plans in bulk delete request:', planIds.length);
      return NextResponse.json(
        { success: false, error: 'Cannot delete more than 50 plans at once' },
        { status: 400 }
      );
    }

    console.log('🗑️ Bulk deleting', planIds.length, 'growth plans for user:', userId);

    let deletedCount;
    try {
      deletedCount = await growthPlanService.bulkDeleteGrowthPlans(userId, planIds);
      console.log('  Bulk delete completed, deleted count:', deletedCount);
    } catch (serviceError) {
      console.error('  Error during bulk delete:', serviceError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to delete growth plans. Please try again.',
          debug: serviceError instanceof Error ? serviceError.message : 'Unknown service error'
        },
        { status: 500 }
      );
    }

    //   LOG USAGE
    try {
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
      console.log('  Growth plan bulk delete usage logged');
    } catch (logError) {
      console.error('⚠️ Growth plan bulk delete usage logging failed (non-critical):', logError);
    }

    const response: GrowthPlanServiceResponse<{ deletedCount: number }> = {
      success: true,
      data: { deletedCount },
      message: `Successfully deleted ${deletedCount} growth plan(s)`
    };

    console.log('  Growth plan bulk delete request completed successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('  Unexpected Growth Plan Bulk Delete API Error:', error);
    console.error('Growth plan bulk delete error stack:', error instanceof Error ? error.stack : 'No stack');
    
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