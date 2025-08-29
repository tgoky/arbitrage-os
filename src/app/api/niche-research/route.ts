// app/api/niche-research/route.ts - UPDATED WITH WORKSPACE ISOLATION
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { NicheResearcherService } from '@/services/nicheResearcher.service';
import { validateNicheResearchInput } from '../../validators/nicheResearcher.validator';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';

// ✅ IMPROVED AUTH FUNCTION WITH BETTER ERROR HANDLING
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

export async function POST(req: NextRequest) {
  console.log('🚀 Niche Research API Route called');
  
  try {
    // ✅ AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('❌ Auth failed in niche research:', authError);
      
      const response = NextResponse.json(
        { 
          success: false,
          error: 'Authentication required. Please sign in again.',
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

    console.log('✅ User authenticated successfully:', user.id);

    // ✅ PARSE REQUEST BODY FIRST
    const body = await req.json();
    console.log('📥 Parsing request body...');
    
    // ✅ GET WORKSPACE ID FROM BOTH SOURCES
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId') || body.workspaceId;

    if (!workspaceId) {
      return NextResponse.json({ 
        success: false,
        error: 'Workspace ID required. Please ensure you are accessing this from within a workspace.',
        code: 'WORKSPACE_ID_REQUIRED'
      }, { status: 400 });
    }

    // ✅ VALIDATE WORKSPACE ACCESS
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        user_id: user.id
      }
    });

    if (!workspace) {
      return NextResponse.json({ 
        success: false,
        error: 'Workspace not found or access denied.',
        code: 'WORKSPACE_ACCESS_DENIED'
      }, { status: 403 });
    }

    console.log('✅ Using workspace:', workspace.id);

    // ✅ RATE LIMITING - 3 reports per day
    console.log('🔍 Checking rate limits for user:', user.id);
    const rateLimitResult = await rateLimit(`niche_research:${user.id}`, 3, 86400); 
    if (!rateLimitResult.success) {
      console.log('❌ Rate limit exceeded for user:', user.id);
      return NextResponse.json(
        { 
          success: false,
          error: 'Daily limit reached (3 reports per day). Please try again tomorrow.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }
    console.log('✅ Rate limit check passed');

    console.log('🔍 RECEIVED NICHE RESEARCH INPUT:', JSON.stringify(body, null, 2));
    console.log('🔍 INPUT KEYS:', Object.keys(body));

    // Check required fields for new structure
    const requiredFields = ['primaryObjective', 'riskAppetite', 'marketType', 'customerSize', 'budget'];
    console.log('🔍 REQUIRED FIELD CHECK:');
    requiredFields.forEach(field => {
      const value = body[field];
      console.log(`  ${field}: ${JSON.stringify(value)} (${typeof value}) - ${value ? 'PRESENT' : 'MISSING'}`);
    });

    console.log('🔍 Starting input validation...');
    const validation = validateNicheResearchInput(body);
        
    if (!validation.success) {
      console.error('❌ VALIDATION FAILED:');
      console.error('Validation errors:', JSON.stringify(validation.errors, null, 2));
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid input data', 
          details: validation.errors,
          debug: {
            receivedFields: Object.keys(body),
            missingRequiredFields: requiredFields.filter(field => !body[field] || body[field] === ''),
            receivedValues: Object.fromEntries(
              requiredFields.map(field => [field, body[field]])
            )
          }
        },
        { status: 400 }
      );
    }

    if (!validation.data) {
      console.error('❌ Validation data is null');
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid input data - validation failed' 
        },
        { status: 400 }
      );
    }

    console.log('✅ Input validation passed');

    // ✅ GENERATE NICHE REPORT
    console.log('🤖 Starting niche research generation...');
    let result;
    try {
      const nicheService = new NicheResearcherService();
      
      // Prepare research input with validated data
      const researchInput = { 
        ...validation.data, 
        userId: user.id 
      };

      console.log('🔍 Research input prepared for service:', {
        primaryObjective: researchInput.primaryObjective,
        marketType: researchInput.marketType,
        budget: researchInput.budget,
        skillsCount: researchInput.skills?.length || 0
      });

      // ✅ USE VALIDATED WORKSPACE ID
      result = await nicheService.generateAndSaveNicheReport(
        researchInput, 
        user.id, 
        workspace.id // Use validated workspace
      );

      console.log('✅ Report generated and saved:', {
        reportId: result.reportId,
        tokensUsed: result.report.tokensUsed,
        nicheName: result.report.niches[result.report.recommendedNiche]?.nicheOverview?.name
      });
      
    } catch (serviceError) {
      console.error('💥 Service error during generation:', serviceError);
      console.error('Service error stack:', serviceError instanceof Error ? serviceError.stack : 'No stack');
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to generate niche research report. Please try again.',
          debug: serviceError instanceof Error ? serviceError.message : 'Unknown service error'
        },
        { status: 500 }
      );
    }

    // ✅ LOG USAGE
    console.log('📊 Logging usage...');
    try {
      await logUsage({
        userId: user.id,
        feature: 'niche_research',
        tokens: result.report.tokensUsed,
        timestamp: new Date(),
        metadata: {
          reportId: result.reportId,
          workspaceId: workspace.id, // Add workspace ID to logging
          primaryObjective: validation.data.primaryObjective,
          marketType: validation.data.marketType,
          budget: validation.data.budget,
          skillsCount: validation.data.skills?.length || 0,
          nicheName: result.report.niches[result.report.recommendedNiche]?.nicheOverview?.name
        }
      });
      console.log('✅ Usage logged successfully');
    } catch (logError) {
      console.error('⚠️ Usage logging failed (non-critical):', logError);
    }

    console.log('🎉 Niche research generation completed successfully');
    return NextResponse.json({
      success: true,
      data: {
        reportId: result.reportId,
        report: result.report
      },
      meta: {
        tokensUsed: result.report.tokensUsed,
        generationTime: result.report.generationTime,
        remaining: rateLimitResult.remaining,
        workspaceId: workspace.id // Return workspace ID for confirmation
      }
    });

  } catch (error) {
    console.error('💥 Unexpected Niche Research API Error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate niche research report. Please try again.',
        debug: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  console.log('🚀 Niche Research GET API Route called');
  
  try {
    // ✅ AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('❌ Auth failed in niche research GET:', authError);
      
      const response = NextResponse.json(
        { 
          success: false,
          error: 'Authentication required. Please sign in again.',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
      
      const cookiesToClear = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token'];
      cookiesToClear.forEach(cookieName => {
        response.cookies.set(cookieName, '', { expires: new Date(0), path: '/' });
      });
      
      return response;
    }

    // Rate limiting for list fetches
    const rateLimitResult = await rateLimit(
      `niche_research_list:${user.id}`,
      100,
      3600
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'List rate limit exceeded.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    // ✅ VALIDATE WORKSPACE ACCESS if workspaceId provided
    if (workspaceId) {
      const hasAccess = await prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          user_id: user.id
        }
      });
      
      if (!hasAccess) {
        return NextResponse.json({ 
          success: false,
          error: 'Workspace access denied.',
          code: 'WORKSPACE_ACCESS_DENIED'
        }, { status: 403 });
      }
    }

    // ✅ USE SERVICE METHOD WITH WORKSPACE FILTERING
    const nicheService = new NicheResearcherService();
    const reports = await nicheService.getUserNicheReports(user.id, workspaceId || undefined);

    // ✅ LOG USAGE
    try {
      await logUsage({
        userId: user.id,
        feature: 'niche_research_list',
        tokens: 0,
        timestamp: new Date(),
        metadata: {
          workspaceId,
          reportCount: reports.length
        }
      });
    } catch (logError) {
      console.error('⚠️ Usage logging failed (non-critical):', logError);
    }

    return NextResponse.json({
      success: true,
      data: reports,
      meta: {
        remaining: rateLimitResult.remaining,
        workspaceId: workspaceId // Return workspace ID for confirmation
      }
    });

  } catch (error) {
    console.error('💥 Niche Reports Fetch Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch niche research reports' 
      },
      { status: 500 }
    );
  }
}