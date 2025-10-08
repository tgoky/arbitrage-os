
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GrowthPlanService } from '@/services/growthPlan.service';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { ExportGrowthPlanResponse, GrowthPlanServiceResponse } from '@/types/growthPlan';

const growthPlanService = new GrowthPlanService();

// ✅ FIXED: Simplified authentication that works for new users
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
      console.error('❌ Authentication failed:', error);
      return { user: null, error: error || new Error('No user found') };
    }
    
    console.log('✅ User authenticated:', user.id);
    return { user, error: null };
    
  } catch (error) {
    console.error('❌ Authentication error:', error);
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
    // ✅ USE SIMPLE AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser();
    
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
