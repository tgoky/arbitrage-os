// app/api/sales-call-analyzer/[id]/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SalesCallAnalyzerService } from '@/services/salesCallAnalyzer.service';
import { validateSalesCallInput } from '../../../validators/salesCallAnalyzer.validator';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';

// ✅ USE SAME ROBUST AUTH AS YOUR MAIN ROUTE
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


export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🚀 Analysis GET API Route called for ID:', params.id);
  
  try {
    // ✅ USE ROBUST AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('❌ Auth failed in analysis GET:', authError);
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }, { status: 401 });
    }

    console.log('✅ Analysis GET user authenticated:', user.id);

    // ✅ RATE LIMITING
    const rateLimitResult = await rateLimit(
      `sales_call_get:${user.id}`,
      100,
      3600
    );

    if (!rateLimitResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResult.reset
      }, { status: 429 });
    }

    const analysisId = params.id;
    const analyzerService = new SalesCallAnalyzerService();
    
    console.log('🔍 Fetching analysis:', analysisId);
    const analysis = await analyzerService.getCallAnalysis(user.id, analysisId);

    if (!analysis) {
      console.log('❌ Analysis not found:', analysisId);
      return NextResponse.json({
        success: false,
        error: 'Call analysis not found'
      }, { status: 404 });
    }

    // ✅ LOG USAGE
    await logUsage({
      userId: user.id,
      feature: 'sales_call_analyzer_view',
      tokens: 0,
      timestamp: new Date(),
      metadata: {
        analysisId,
        action: 'view'
      }
    });

    console.log('✅ Analysis fetched successfully');
    return NextResponse.json({
      success: true,
      data: analysis,
      meta: {
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('💥 Analysis Fetch Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch call analysis',
      debug: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const rateLimitResult = await rateLimit(
      `sales_call_delete:${user.id}`,
      20,
      3600
    );

    if (!rateLimitResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Delete rate limit exceeded',
        retryAfter: rateLimitResult.reset
      }, { status: 429 });
    }

    const analysisId = params.id;
    const analyzerService = new SalesCallAnalyzerService();
    
    // ✅ USE SERVICE METHOD (consistent with architecture)
    const deleted = await analyzerService.deleteCallAnalysis(user.id, analysisId);

    if (!deleted) {
      return NextResponse.json({
        success: false,
        error: 'Call analysis not found'
      }, { status: 404 });
    }

    await logUsage({
      userId: user.id,
      feature: 'sales_call_analyzer_delete',
      tokens: 0,
      timestamp: new Date(),
      metadata: {
        analysisId,
        action: 'delete'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Analysis deleted successfully',
      meta: {
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('Analysis Delete Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete analysis'
    }, { status: 500 });
  }
}