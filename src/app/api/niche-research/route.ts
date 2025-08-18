// app/api/niche-research/route.ts - UPDATED WITH FIXED AUTH
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { NicheResearcherService } from '@/services/nicheResearcher.service';
import { validateNicheResearchInput } from '../../validators/nicheResearcher.validator';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';

// ✅ FIXED AUTH FUNCTION WITH BETTER COOKIE HANDLING
async function getAuthenticatedUser(request: NextRequest) {
  try {
    const cookieStore = cookies();
    
    // Method 1: Try with authorization header FIRST (most reliable)
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        console.log('🔍 Trying token auth...');
        
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
          console.log('✅ Auth Method 1 (token) succeeded for user:', user.id);
          return { user, error: null };
        }
        
        console.log('⚠️ Token auth failed:', error?.message);
      } catch (tokenError) {
        console.warn('⚠️ Token auth error:', tokenError);
      }
    }
    
    // Method 2: Try with cleaned SSR cookies
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            try {
              const cookie = cookieStore.get(name);
              if (!cookie?.value) return undefined;
              
              // Handle base64 cookies more safely
              if (cookie.value.startsWith('base64-')) {
                try {
                  const decoded = atob(cookie.value.substring(7));
                  // Validate it's actually JSON
                  const parsed = JSON.parse(decoded);
                  return cookie.value;
                } catch (e) {
                  console.warn(`🧹 Corrupted cookie ${name}, skipping...`);
                  return undefined;
                }
              }
              
              // For non-base64 cookies, validate they're proper JSON if they look like JSON
              if (cookie.value.startsWith('{') || cookie.value.startsWith('[')) {
                try {
                  JSON.parse(cookie.value);
                  return cookie.value;
                } catch (e) {
                  console.warn(`🧹 Invalid JSON cookie ${name}, skipping...`);
                  return undefined;
                }
              }
              
              return cookie.value;
            } catch (error) {
              console.warn(`🧹 Error reading cookie ${name}:`, error);
              return undefined;
            }
          },
        },
      }
    );
    
    const { data: { user }, error } = await supabaseSSR.auth.getUser();
    
    if (!error && user) {
      console.log('✅ Auth Method 2 (SSR cookies) succeeded for user:', user.id);
      return { user, error: null };
    } else {
      console.log('⚠️ SSR cookie auth failed:', error?.message);
    }
    
    // Method 3: Try route handler as last resort (most prone to cookie issues)
    try {
      const supabase = createRouteHandlerClient({
        cookies: () => cookieStore
      });
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (!error && user) {
        console.log('✅ Auth Method 3 (route handler) succeeded for user:', user.id);
        return { user, error: null };
      }
      
      console.log('⚠️ Route handler auth failed:', error?.message);
    } catch (helperError) {
      console.warn('⚠️ Route handler client failed:', helperError);
    }
    
    return { user: null, error: error || new Error('All auth methods failed') };
    
  } catch (error) {
    console.error('💥 All authentication methods failed:', error);
    return { user: null, error };
  }
}

export async function POST(req: NextRequest) {
  console.log('🚀 Niche Research API Route called');
  
  try {
    // ✅ USE FIXED AUTH FUNCTION
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('❌ Auth failed in niche research:', authError);
      
      // Clear corrupted cookies in response
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

    console.log('✅ User authenticated successfully:', user.id);

    // Rate limiting - 3 reports per day
    console.log('🔍 Checking rate limits for user:', user.id);
    const rateLimitResult = await rateLimit(`niche_research:${user.id}`, 50, 86400); 
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

    // Parse and validate request body
    console.log('📥 Parsing request body...');
    const body = await req.json();
    
    // ✅ DETAILED VALIDATION DEBUG
    console.log('🔍 RECEIVED BODY:', JSON.stringify(body, null, 2));
    console.log('🔍 BODY KEYS:', Object.keys(body));

    // Check each required field specifically
    const requiredFields = [
      'roles', 'skills', 'competencies', 'interests', 
      'connections', 'problems', 'trends', 'time', 
      'budget', 'location'
    ];

    console.log('🔍 FIELD-BY-FIELD CHECK:');
    requiredFields.forEach(field => {
      const value = body[field];
      console.log(`  ${field}: ${JSON.stringify(value)} (${typeof value}) - ${value ? 'PRESENT' : 'MISSING'}`);
    });

    console.log('🔍 Starting validation...');
    const validation = validateNicheResearchInput(body);
        
    if (!validation.success) {
      console.error('❌ VALIDATION FAILED:');
      console.error('Full validation object:', validation);
      console.error('Validation errors:', JSON.stringify(validation.errors, null, 2));
      
      // Show exactly which fields failed
      validation.errors.forEach((error: any, index: number) => {
        console.error(`Error ${index + 1}:`, {
          field: error.path?.join('.') || 'unknown',
          code: error.code,
          message: error.message,
          received: error.received
        });
      });
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid input', 
          details: validation.errors,
          debug: {
            receivedFields: Object.keys(body),
            missingFields: requiredFields.filter(field => !body[field] || body[field] === ''),
            emptyFields: requiredFields.filter(field => body[field] === '' || body[field] === null || body[field] === undefined)
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
          error: 'Invalid input data - validation.data is null' 
        },
        { status: 400 }
      );
    }

    console.log('✅ Input validation passed');

    // ✅ GET USER'S WORKSPACE with error handling
    console.log('🔍 Getting/creating workspace for user:', user.id);
    let workspace;
    try {
      workspace = await prisma.workspace.findFirst({
        where: { user_id: user.id }
      });

      if (!workspace) {
        console.log('📁 Creating default workspace for user:', user.id);
        workspace = await prisma.workspace.create({
          data: {
            user_id: user.id,
            name: 'Default Workspace',
            slug: 'default',
            description: 'Default workspace for niche research'
          }
        });
        console.log('✅ Created workspace:', workspace.id);
      } else {
        console.log('✅ Found existing workspace:', workspace.id);
      }
    } catch (dbError) {
      console.error('💥 Database error getting/creating workspace:', dbError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Database error. Please try again.',
          debug: dbError instanceof Error ? dbError.message : 'Unknown DB error'
        },
        { status: 500 }
      );
    }

    // ✅ GENERATE NICHE REPORT with error handling
    console.log('🤖 Starting niche research generation...');
    let result;
    try {
      const nicheService = new NicheResearcherService();
      const researchInput = { ...validation.data, userId: user.id };

      console.log('🔍 Research input prepared:', Object.keys(researchInput));
      console.log('🔍 Research input sample:', {
        skills: researchInput.skills,
        time: researchInput.time,
        budget: researchInput.budget,
        location: researchInput.location
      });

      // Generate report
      const generatedReport = await nicheService.generateNicheReport(researchInput);
      console.log('✅ Report generated, tokens used:', generatedReport.tokensUsed);

      // Save to database
      const reportId = await nicheService.saveNicheReport(
        user.id, 
        workspace.id, 
        generatedReport, 
        researchInput
      );
      console.log('✅ Report saved with ID:', reportId);

      result = {
        reportId,
        report: generatedReport
      };
      
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

    // ✅ LOG USAGE for analytics/billing with error handling
    console.log('📊 Logging usage...');
    try {
      await logUsage({
        userId: user.id,
        feature: 'niche_research',
        tokens: result.report.tokensUsed,
        timestamp: new Date(),
        metadata: {
          reportId: result.reportId,
          skills: validation.data.skills,
          timeCommitment: validation.data.time,
          budget: validation.data.budget,
          nicheCount: result.report.recommendedNiches?.length || 0
        }
      });
      console.log('✅ Usage logged successfully');
    } catch (logError) {
      // Don't fail the request if logging fails
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
        remaining: rateLimitResult.remaining
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
    // ✅ USE FIXED AUTH FUNCTION
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('❌ Auth failed in niche research GET:', authError);
      
      const response = NextResponse.json(
        { 
          success: false,
          error: 'Authentication required. Please clear your browser cookies and sign in again.',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
      
      // Clear potentially corrupted cookies
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

    // ✅ USE SERVICE METHOD
    const nicheService = new NicheResearcherService();
    const reports = await nicheService.getUserNicheReports(user.id, workspaceId || undefined);

    // ✅ LOG USAGE for list access
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
        remaining: rateLimitResult.remaining
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