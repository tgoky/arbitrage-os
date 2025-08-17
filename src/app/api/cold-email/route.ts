// app/api/cold-email/route.ts - COMPLETE DEBUG VERSION
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma'; // Import at top
import { ColdEmailService } from '@/services/coldEmail.service';
import { validateColdEmailInput } from '../../validators/coldEmail.validator';
import { rateLimit } from '../../../lib/rateLimit';
import { logUsage } from '@/lib/usage';

// ✅ Exact same robust authentication function as pricing calculator
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
        console.log('✅ Auth Method 1 (route handler) succeeded for user:', user.id);
        return { user, error: null };
      }
      
      console.log('⚠️ Route handler auth failed:', error?.message);
    } catch (helperError) {
      console.warn('⚠️ Route handler client failed:', helperError);
    }
    
    // Method 2: Try with authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        console.log('🔍 Trying token auth with token:', token.substring(0, 20) + '...');
        
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
          console.log('✅ Auth Method 2 (token) succeeded for user:', user.id);
          return { user, error: null };
        }
        
        console.log('⚠️ Token auth failed:', error?.message);
      } catch (tokenError) {
        console.warn('⚠️ Token auth error:', tokenError);
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
                  console.warn(`Invalid cookie ${name}, skipping...`);
                  return undefined;
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
    
    const { data: { user }, error } = await supabaseSSR.auth.getUser();
    
    if (!error && user) {
      console.log('✅ Auth Method 3 (SSR cookies) succeeded for user:', user.id);
    } else {
      console.log('⚠️ SSR cookie auth failed:', error?.message);
    }
    
    return { user, error };
    
  } catch (error) {
    console.error('💥 All authentication methods failed:', error);
    return { user: null, error };
  }
}

export async function POST(req: NextRequest) {
  console.log('🚀 Cold Email API Route called');
  
  try {
    // ✅ Use robust authentication (same as pricing calculator)
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('❌ Auth failed in cold email:', authError);
      
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

    // Rate limiting - 20 emails per minute
    console.log('🔍 Checking rate limits for user:', user.id);
    const rateLimitResult = await rateLimit(user.id, 20, 60);
    if (!rateLimitResult.success) {
      console.log('❌ Rate limit exceeded for user:', user.id);
      return NextResponse.json(
        { 
          success: false,
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }
    console.log('✅ Rate limit check passed');

    // Parse and validate request body
    console.log('📥 Parsing request body...');
    const body = await req.json();
    
    // ✅ COMPREHENSIVE DEBUG LOGGING
    console.log('🔍 RECEIVED BODY:', JSON.stringify(body, null, 2));
    console.log('🔍 BODY KEYS:', Object.keys(body));
    console.log('🔍 BODY TYPE CHECK:');
    Object.entries(body).forEach(([key, value]) => {
      console.log(`  ${key}: ${value} (${typeof value})`);
    });
    
    console.log('🔍 REQUIRED FIELDS CHECK:');
    const requiredFields = ['firstName', 'lastName', 'email', 'jobTitle', 'companyName', 'workEmail', 'method', 'tone', 'targetIndustry', 'targetRole', 'valueProposition'];
    requiredFields.forEach(field => {
      const value = body[field];
      console.log(`  ✓ ${field}: "${value}" (${typeof value}) - ${value ? 'PRESENT' : 'MISSING'}`);
    });
    
    console.log('🔍 Starting validation...');
    const validation = validateColdEmailInput(body);
        
    if (!validation.success) {
      console.error('❌ VALIDATION FAILED:');
      console.error('Validation errors:', JSON.stringify(validation.errors, null, 2));
      
      // ✅ Enhanced error response with debug info
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid input', 
          details: validation.errors,
          debug: {
            receivedFields: Object.keys(body),
            receivedData: body,
            requiredFields,
            missingFields: requiredFields.filter(field => !body[field])
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
    console.log('✅ Validated data keys:', Object.keys(validation.data));

    // ✅ GET USER'S WORKSPACE with error handling (same pattern as pricing calc)
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
            description: 'Default workspace for cold emails'
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

    // ✅ SERVICE HANDLES BOTH GENERATION AND STORAGE with error handling
    console.log('🤖 Starting email generation...');
    let result;
    try {
      const coldEmailService = new ColdEmailService();
      const emailInput = {
        ...validation.data,
        userId: user.id,
        emailLength: validation.data.emailLength || 'medium',
        quality: validation.data.quality || 'balanced',
        creativity: validation.data.creativity || 'moderate',
        variations: validation.data.variations || 1,
        generateFollowUps: validation.data.generateFollowUps || false,
        followUpCount: validation.data.followUpCount || 3,
        saveAsTemplate: validation.data.saveAsTemplate || false
      };

      console.log('🔍 Email input prepared:', Object.keys(emailInput));
      console.log('🔍 Email input sample:', {
        firstName: emailInput.firstName,
        method: emailInput.method,
        targetIndustry: emailInput.targetIndustry,
        variations: emailInput.variations
      });

      // Generate and save emails via service
      result = await coldEmailService.generateAndSaveEmails(
        emailInput,
        user.id,
        workspace.id
      );
      
      console.log('✅ Email generation completed successfully');
      console.log('✅ Generated', result.emails.length, 'emails');
      console.log('✅ Deliverable ID:', result.deliverableId);
    } catch (serviceError) {
      console.error('💥 Service error during generation:', serviceError);
      console.error('Service error stack:', serviceError instanceof Error ? serviceError.stack : 'No stack');
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to generate emails. Please try again.',
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
        feature: 'cold_email',
        tokens: result.tokensUsed,
        timestamp: new Date(),
        metadata: {
          deliverableId: result.deliverableId,
          method: validation.data.method,
          emailCount: result.emails.length,
          targetCompany: validation.data.targetCompany,
          targetIndustry: validation.data.targetIndustry
        }
      });
      console.log('✅ Usage logged successfully');
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('⚠️ Usage logging failed (non-critical):', logError);
    }

    console.log('🎉 Cold email generation completed successfully');
    return NextResponse.json({
      success: true,
      data: {
        generationId: result.deliverableId,
        emails: result.emails
      },
      meta: {
        tokensUsed: result.tokensUsed,
        generationTime: result.generationTime,
        remaining: rateLimitResult.limit - rateLimitResult.count
      }
    });

  } catch (error) {
    console.error('💥 Unexpected Cold Email API Error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate emails. Please try again.',
        debug: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ✅ GET endpoint for fetching user's email generations
export async function GET(req: NextRequest) {
  console.log('🚀 Cold Email GET API Route called');
  
  try {
    // Use robust authentication
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('❌ Auth failed in cold email GET:', authError);
      
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
    const rateLimitResult = await rateLimit(user.id, 100, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'List fetch rate limit exceeded.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    // ✅ USE SERVICE METHOD (consistent with architecture)
    const coldEmailService = new ColdEmailService();
    const generations = await coldEmailService.getUserEmailGenerations(
      user.id,
      workspaceId || undefined
    );

    // ✅ LOG USAGE for list access
    await logUsage({
      userId: user.id,
      feature: 'cold_email_list',
      tokens: 0,
      timestamp: new Date(),
      metadata: {
        workspaceId,
        resultCount: generations.length,
        action: 'list'
      }
    });

    return NextResponse.json({
      success: true,
      data: generations,
      meta: {
        remaining: rateLimitResult.limit - rateLimitResult.count
      }
    });

  } catch (error) {
    console.error('💥 Email Generations Fetch Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch email generations' 
      },
      { status: 500 }
    );
  }
}