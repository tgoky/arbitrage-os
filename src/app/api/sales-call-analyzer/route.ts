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

// app/api/sales-call-analyzer/route.ts - ADD DETAILED LOGGING

export async function POST(request: NextRequest) {
  console.log('🚀 Sales Call Analyzer API Route called');
  console.log('📍 Request URL:', request.url);
  console.log('📍 Request method:', request.method);
  
  try {
    // Authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      console.error('❌ Auth failed:', authError);
      return createAuthErrorResponse();
    }

    console.log('✅ User authenticated:', user.id);

    // Parse body
    let body;
    try {
      const rawBody = await request.text();
      console.log('📦 Raw request body length:', rawBody.length);
      console.log('📦 Raw request body preview:', rawBody.substring(0, 200));
      
      body = JSON.parse(rawBody);
      console.log('📦 Parsed body keys:', Object.keys(body));
      console.log('📦 Body workspace ID:', body.workspaceId);
      console.log('📦 Body call type:', body.callType);
      console.log('📦 Body transcript length:', body.transcript?.length);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON in request body',
        debug: parseError instanceof Error ? parseError.message : 'Parse failed'
      }, { status: 400 });
    }

    // Get workspace ID
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || body.workspaceId;
    
    console.log('🏢 Workspace ID from params:', searchParams.get('workspaceId'));
    console.log('🏢 Workspace ID from body:', body.workspaceId);
    console.log('🏢 Final workspace ID:', workspaceId);
    
    if (!workspaceId) {
      console.error('❌ No workspace ID provided');
      return NextResponse.json({ 
        error: 'Workspace ID required. Please ensure you are accessing this from within a workspace.',
        code: 'WORKSPACE_ID_REQUIRED',
        debug: {
          searchParams: searchParams.get('workspaceId'),
          bodyWorkspaceId: body.workspaceId,
          allBodyKeys: Object.keys(body)
        }
      }, { status: 400 });
    }

    // Validate workspace access
    console.log('🔍 Validating workspace access...');
    const hasAccess = await validateWorkspaceAccess(user.id, workspaceId);
    if (!hasAccess) {
      console.error('❌ Workspace access denied');
      return NextResponse.json({ 
        error: 'Workspace not found or access denied.',
        code: 'WORKSPACE_ACCESS_DENIED'
      }, { status: 403 });
    }
    console.log('✅ Workspace access validated');

    // Rate limiting
    console.log('🔍 Checking rate limits...');
    const rateLimitResult = await rateLimit(
      `call_analysis:${user.id}`, 
      20,
      3600
    );
    
    if (!rateLimitResult.success) {
      console.log('❌ Rate limit exceeded');
      return NextResponse.json({
        success: false,
        error: 'Too many analysis requests. Please try again later.',
        data: {
          retryAfter: rateLimitResult.reset,
          remaining: rateLimitResult.remaining
        }
      }, { status: 429 });
    }
    console.log('✅ Rate limit check passed');

    // Validate input
    console.log('🔍 Validating input...');
    const validation = validateSalesCallInput(body);
    
    if (!validation.success) {
      console.error('❌ Input validation failed:', validation.errors);
      return NextResponse.json({
        success: false,
        error: 'Invalid input', 
        data: validation.errors 
      }, { status: 400 });
    }
    console.log('✅ Input validation passed');

    // Get workspace
    console.log('🔍 Fetching workspace from database...');
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
        console.error('❌ Workspace not found in database');
        return NextResponse.json({ 
          error: 'Workspace not found.',
          code: 'WORKSPACE_NOT_FOUND'
        }, { status: 404 });
      }
      console.log('✅ Workspace found:', workspace.name);
    } catch (dbError) {
      console.error('💥 Database error getting workspace:', dbError);
      console.error('💥 DB Error stack:', dbError instanceof Error ? dbError.stack : 'No stack');
      return NextResponse.json({
        success: false,
        error: 'Database error. Please try again.',
        debug: dbError instanceof Error ? dbError.message : 'Unknown DB error'
      }, { status: 500 });
    }

    // Analyze call
    console.log('🤖 Starting sales call analysis...');
    let analysisPackage;
    let deliverableId;
    
    try {
      const analyzerService = new SalesCallAnalyzerService();
      const analysisInput = { ...validation.data, userId: user.id };
      
      console.log('🔍 Analysis input keys:', Object.keys(analysisInput));
      console.log('🔍 Analysis input call type:', analysisInput.callType);
      console.log('🔍 Analysis input transcript length:', analysisInput.transcript?.length);
      
      // Analyze
      console.log('🔍 Calling analyzerService.analyzeCall...');
      analysisPackage = await analyzerService.analyzeCall(analysisInput);
      console.log('✅ Analysis completed');
      console.log('📊 Tokens used:', analysisPackage.tokensUsed);
      console.log('⏱️ Processing time:', analysisPackage.processingTime, 'ms');
      
      // Save
      console.log('💾 Saving analysis to database...');
      deliverableId = await analyzerService.saveCallAnalysis(
        user.id,
        workspaceId,
        analysisPackage,
        analysisInput
      );
      console.log('✅ Analysis saved with ID:', deliverableId);
      
    } catch (serviceError) {
      console.error('💥 Service error during analysis:', serviceError);
      console.error('💥 Service error name:', serviceError instanceof Error ? serviceError.name : 'Unknown');
      console.error('💥 Service error message:', serviceError instanceof Error ? serviceError.message : 'Unknown');
      console.error('💥 Service error stack:', serviceError instanceof Error ? serviceError.stack : 'No stack');
      
      // Check if it's an OpenRouter API error
      if (serviceError instanceof Error && serviceError.message.includes('OpenRouter')) {
        return NextResponse.json({
          success: false,
          error: 'AI service error. Please try again.',
          debug: serviceError.message
        }, { status: 503 });
      }
      
      return NextResponse.json({
        success: false,
        error: 'Failed to analyze call. Please try again.',
        debug: serviceError instanceof Error ? serviceError.message : 'Unknown service error'
      }, { status: 500 });
    }

    // Create notification
    console.log('📢 Creating notification...');
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
      console.log('✅ Notification created');
    } catch (notifError) {
      console.error('⚠️ Failed to create notification (non-critical):', notifError);
    }

    // Log usage
    console.log('📊 Logging usage...');
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
      console.log('✅ Usage logged');
    } catch (logError) {
      console.error('⚠️ Usage logging failed (non-critical):', logError);
    }

    console.log('🎉 Analysis completed successfully');
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
    console.error('💥 UNEXPECTED ERROR IN API ROUTE:', error);
    console.error('💥 Error type:', error?.constructor?.name);
    console.error('💥 Error message:', error instanceof Error ? error.message : 'Unknown');
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze call. Please try again.',
      message: error instanceof Error ? error.message : 'Unknown error',
      type: error?.constructor?.name || 'Unknown'
    }, { status: 500 });
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