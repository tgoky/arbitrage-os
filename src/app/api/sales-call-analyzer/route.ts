// app/api/sales-call-analyzer/route.ts - WITH WORKSPACE VALIDATION
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SalesCallAnalyzerService } from '@/services/salesCallAnalyzer.service';
import { validateSalesCallInput } from '../../validators/salesCallAnalyzer.validator';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { createNotification } from '@/lib/notificationHelper';

// ROBUST AUTHENTICATION (same as pricing calculator)
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

// Validate workspace access
async function validateWorkspaceAccess(userId: string, workspaceId: string): Promise<boolean> {
  try {
    const { prisma } = await import('@/lib/prisma');
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        user_id: userId
      }
    });
    return !!workspace;
  } catch (error) {
    console.error('Error validating workspace access:', error);
    return false;
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

export async function POST(request: NextRequest) {
  console.log('🚀 Sales Call Analyzer API Route called');
  
  try {
    // USE ROBUST AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      console.error('❌ Auth failed in sales call analyzer:', authError);
      return createAuthErrorResponse();
    }

    console.log('✅ Sales Call Analyzer user authenticated successfully:', user.id);

    // Parse request body first to get workspace ID
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('❌ Failed to parse sales call analysis request body:', parseError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid JSON in request body' 
        },
        { status: 400 }
      );
    }

    // GET WORKSPACE ID FROM REQUEST (like pricing calculator)
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || body.workspaceId;
    
    if (!workspaceId) {
      return NextResponse.json({ 
        error: 'Workspace ID required. Please ensure you are accessing this from within a workspace.',
        code: 'WORKSPACE_ID_REQUIRED'
      }, { status: 400 });
    }

    // VALIDATE WORKSPACE ACCESS
    const hasAccess = await validateWorkspaceAccess(user.id, workspaceId);
    if (!hasAccess) {
      return NextResponse.json({ 
        error: 'Workspace not found or access denied.',
        code: 'WORKSPACE_ACCESS_DENIED'
      }, { status: 403 });
    }

    // RATE LIMITING for call analysis
    console.log('🔍 Checking rate limits for sales call analyzer user:', user.id);
    const rateLimitResult = await rateLimit(
      `call_analysis:${user.id}`, 
      20, // 20 per hour
      3600
    );
    
    if (!rateLimitResult.success) {
      console.log('❌ Sales call analysis rate limit exceeded for user:', user.id);
      return NextResponse.json(
        { 
          success: false,
          error: 'Too many analysis requests. Please try again later.',
          data: {
            retryAfter: rateLimitResult.reset,
            remaining: rateLimitResult.remaining
          }
        },
        { status: 429 }
      );
    }
    console.log('✅ Sales call analysis rate limit check passed');

    // Validate input
    console.log('🔍 Validating sales call input...');
    const validation = validateSalesCallInput(body);
    
    if (!validation.success) {
      console.error('❌ Sales call input validation failed:', validation.errors);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid input', 
          data: validation.errors 
        },
        { status: 400 }
      );
    }
    console.log('✅ Sales call input validation passed');

    // VERIFY WORKSPACE EXISTS
    let workspace;
    try {
      const { prisma } = await import('@/lib/prisma');
      workspace = await prisma.workspace.findFirst({
        where: { 
          id: workspaceId,
          user_id: user.id 
        }
      });

      if (!workspace) {
        return NextResponse.json({ 
          error: 'Workspace not found.',
          code: 'WORKSPACE_NOT_FOUND'
        }, { status: 404 });
      }
    } catch (dbError) {
      console.error('💥 Database error getting workspace:', dbError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Database error. Please try again.',
          debug: dbError instanceof Error ? dbError.message : 'Unknown DB error'
        },
        { status: 500 }
      );
    }

    // SERVICE HANDLES BOTH ANALYSIS AND STORAGE
    console.log('🤖 Starting sales call analysis...');
    let analysisPackage;
    let deliverableId;
    
    try {
      const analyzerService = new SalesCallAnalyzerService();
      const analysisInput = { ...validation.data, userId: user.id };
      
      // Analyze the call
      console.log('🔍 Analyzing sales call...');
      analysisPackage = await analyzerService.analyzeCall(analysisInput);
      console.log('✅ Sales call analysis completed');
      
      // Save with validated workspace ID
      console.log('💾 Saving sales call analysis...');
      deliverableId = await analyzerService.saveCallAnalysis(
        user.id,
        workspaceId, // Use the validated workspace ID
        analysisPackage,
        analysisInput
      );
      console.log('✅ Sales call analysis saved with ID:', deliverableId);
    } catch (serviceError) {
      console.error('💥 Service error during sales call analysis:', serviceError);
      console.error('Sales call analysis service error stack:', serviceError instanceof Error ? serviceError.stack : 'No stack');
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to analyze call. Please try again.',
          debug: serviceError instanceof Error ? serviceError.message : 'Unknown service error'
        },
        { status: 500 }
      );
    }

    // After successful call analysis and saving
try {
  await createNotification({
    userId: user.id,
    workspaceId: workspaceId,
    workspaceSlug: workspace.slug,
    type: 'sales_call',
    itemId: deliverableId,
    metadata: {
      callType: validation.data.callType,
      companyName: validation.data.companyName,
      prospectName: validation.data.prospectName,
      overallScore: analysisPackage.callResults.analysis.overallScore,
      sentiment: analysisPackage.callResults.analysis.sentiment
    }
  });
  
  console.log('✅ Notification created for call analysis:', deliverableId);
} catch (notifError) {
  console.error('Failed to create notification:', notifError);
}


    // LOG USAGE for billing/analytics with workspace context
    console.log('📊 Logging sales call analysis usage...');
    try {
      await logUsage({
        userId: user.id,
        feature: 'sales_call_analyzer',
        tokens: analysisPackage.tokensUsed,
        timestamp: new Date(),
        metadata: {
          deliverableId,
          workspaceId,
          workspaceName: workspace.name,
          callType: validation.data.callType,
          companyName: validation.data.companyName,
          analysisId: deliverableId,
          overallScore: analysisPackage.callResults.analysis.overallScore,
          sentiment: analysisPackage.callResults.analysis.sentiment
        }
      });
      console.log('✅ Sales call analysis usage logged successfully');
    } catch (logError) {
      console.error('⚠️ Sales call analysis usage logging failed (non-critical):', logError);
    }

    console.log('🎉 Sales call analysis completed successfully');
    return NextResponse.json({
      success: true,
      data: {
        analysisId: deliverableId,
        analysis: analysisPackage,
        workspaceId: workspaceId,
        workspaceName: workspace.name
      },
      meta: {
        tokensUsed: analysisPackage.tokensUsed,
        processingTime: analysisPackage.processingTime,
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('💥 Unexpected Sales Call Analyzer API Error:', error);
    console.error('Sales call analyzer error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to analyze call. Please try again.',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  console.log('🚀 Sales Call Analyzer GET API Route called');
  
  try {
    // USE ROBUST AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      console.error('❌ Auth failed in sales call analyzer GET:', authError);
      return createAuthErrorResponse();
    }

    console.log('✅ Sales Call Analyzer GET user authenticated successfully:', user.id);

    // RATE LIMITING for list fetches
    const rateLimitResult = await rateLimit(
      `sales_call_list:${user.id}`,
      100, // 100 list fetches per hour
      3600
    );

    if (!rateLimitResult.success) {
      console.log('❌ Sales call list rate limit exceeded for user:', user.id);
      return NextResponse.json(
        { 
          success: false,
          error: 'List fetch rate limit exceeded.',
          data: {
            retryAfter: rateLimitResult.reset,
            remaining: rateLimitResult.remaining
          }
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    // VALIDATE WORKSPACE ACCESS if workspaceId provided
    if (workspaceId) {
      const hasAccess = await validateWorkspaceAccess(user.id, workspaceId);
      if (!hasAccess) {
        return NextResponse.json({ 
          error: 'Workspace access denied.',
          code: 'WORKSPACE_ACCESS_DENIED'
        }, { status: 403 });
      }
    }

    console.log('📋 Fetching sales call analyses for user:', user.id, 'workspace:', workspaceId || 'all');

    // USE SERVICE METHOD with workspace filtering
    let analyses;
    try {
      const analyzerService = new SalesCallAnalyzerService();
      analyses = await analyzerService.getUserCallAnalyses(
        user.id,
        workspaceId || undefined
      );
      console.log('✅ Retrieved', analyses.length, 'sales call analyses');
    } catch (serviceError) {
      console.error('💥 Error fetching sales call analyses:', serviceError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch call analyses. Please try again.',
          debug: serviceError instanceof Error ? serviceError.message : 'Unknown service error'
        },
        { status: 500 }
      );
    }

    // LOG USAGE for list access
    try {
      await logUsage({
        userId: user.id,
        feature: 'sales_call_analyzer_list',
        tokens: 0, // No AI tokens for listing
        timestamp: new Date(),
        metadata: {
          workspaceId,
          resultCount: analyses.length,
          action: 'list'
        }
      });
      console.log('✅ Sales call analysis list usage logged successfully');
    } catch (logError) {
      console.error('⚠️ Sales call analysis list usage logging failed (non-critical):', logError);
    }

    console.log('✅ Sales call analyses GET request completed successfully');
    return NextResponse.json({
      success: true,
      data: analyses,
      meta: {
        remaining: rateLimitResult.remaining,
        workspaceId: workspaceId
      }
    });

  } catch (error) {
    console.error('💥 Unexpected Sales Call Analyzer GET API Error:', error);
    console.error('Sales call analyzer GET error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch call analyses',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}