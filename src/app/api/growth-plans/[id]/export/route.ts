// app/api/growth-plans/[id]/export/route.ts - WITH ROBUST AUTHENTICATION
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GrowthPlanService } from '@/services/growthPlan.service';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { ExportGrowthPlanResponse, GrowthPlanServiceResponse } from '@/types/growthPlan';

const growthPlanService = new GrowthPlanService();

// ✅ ROBUST AUTHENTICATION (same as main route)
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🚀 Growth Plan Export API Route called for ID:', params.id);
  
  try {
    // ✅ USE ROBUST AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      console.error('❌ Auth failed in growth plan export:', authError);
      return createAuthErrorResponse();
    }

    console.log('✅ Growth Plan Export user authenticated successfully:', user.id);
    const userId = user.id;
    const planId = params.id;

    // ✅ STRICT RATE LIMITING: Exports are resource-intensive
    const rateLimitResult = await rateLimit(
      `growth_plan_export:${userId}`,
      10, // 10 exports per hour
      3600
    );

    if (!rateLimitResult.success) {
      console.log('❌ Growth plan export rate limit exceeded for user:', userId);
      return NextResponse.json(
        {
          success: false,
          error: 'Export rate limit exceeded. You can export 10 plans per hour.',
          data: {
            remaining: rateLimitResult.remaining,
            resetTime: new Date(rateLimitResult.reset).toISOString()
          }
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'markdown') as 'pdf' | 'word' | 'markdown';

    console.log('📄 Exporting growth plan:', planId, 'in format:', format);

    let content;
    try {
      content = await growthPlanService.exportGrowthPlan(userId, planId, format);
    } catch (serviceError) {
      console.error('💥 Error during export:', serviceError);
      
      if (serviceError instanceof Error && serviceError.message === 'Growth plan not found') {
        return NextResponse.json(
          { success: false, error: 'Growth plan not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to export growth plan. Please try again.',
          debug: serviceError instanceof Error ? serviceError.message : 'Unknown service error'
        },
        { status: 500 }
      );
    }

    // Get plan details for filename
    let plan;
    try {
      plan = await growthPlanService.getGrowthPlan(userId, planId);
      
      if (!plan) {
        console.log('❌ Growth plan not found for export:', planId);
        return NextResponse.json(
          { success: false, error: 'Growth plan not found' },
          { status: 404 }
        );
      }
    } catch (planError) {
      console.error('💥 Error fetching plan for export filename:', planError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch plan details for export.',
          debug: planError instanceof Error ? planError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    const clientCompany = plan.metadata.clientCompany || 'GrowthPlan';
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${clientCompany}_GrowthPlan_${timestamp}.${format === 'markdown' ? 'md' : format}`;

    const mimeTypes = {
      markdown: 'text/markdown',
      pdf: 'application/pdf',
      word: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };

    // ✅ LOG USAGE: Track exports
    try {
      await logUsage({
        userId,
        feature: 'growth_plan_export',
        tokens: 0, // No AI tokens for export
        timestamp: new Date(),
        metadata: {
          planId,
          format,
          filename,
          contentLength: content.length
        }
      });
      console.log('✅ Growth plan export usage logged');
    } catch (logError) {
      console.error('⚠️ Growth plan export usage logging failed (non-critical):', logError);
    }

    const response: GrowthPlanServiceResponse<ExportGrowthPlanResponse> = {
      success: true,
      data: {
        content,
        filename,
        mimeType: mimeTypes[format]
      }
    };

    console.log('✅ Growth plan export completed successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('💥 Unexpected Growth Plan Export API Error:', error);
    console.error('Growth plan export error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to export growth plan',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}