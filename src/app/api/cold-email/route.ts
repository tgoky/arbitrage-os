// app/api/cold-email/route.ts - SIMPLIFIED AUTH VERSION
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma'; // Import at top
import { ColdEmailService } from '@/services/coldEmail.service';
import { validateColdEmailInput } from '../../validators/coldEmail.validator';
import { rateLimit } from '../../../lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { createNotification } from '@/lib/notificationHelper';

// ✅ SIMPLIFIED: Authentication function from work-items
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

export async function POST(req: NextRequest) {
  console.log('🚀 Cold Email API Route called');
  
  try {
    // Use simplified authentication
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('❌ Auth failed in cold email:', authError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
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
     const workspaceId = body.workspaceId;
    

      if (!workspaceId) {
      return NextResponse.json({ 
        success: false,
        error: 'Workspace ID required. Please ensure you are accessing this from within a workspace.',
        code: 'WORKSPACE_ID_REQUIRED'
      }, { status: 400 });
    }

     // ADD: VALIDATE WORKSPACE ACCESS
    const hasAccess = await validateWorkspaceAccess(user.id, workspaceId);
    if (!hasAccess) {
      return NextResponse.json({ 
        success: false,
        error: 'Workspace not found or access denied.',
        code: 'WORKSPACE_ACCESS_DENIED'
      }, { status: 403 });
    }

    // Fetch the actual workspace for notification
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        user_id: user.id
      },
      select: {
        id: true,
        slug: true
      }
    });

    console.log('🔍 Backend received body keys:', Object.keys(body));
console.log('🔍 Backend body sample:', {
  firstName: body.firstName,
  method: body.method,
  generateFollowUps: body.generateFollowUps
});

    
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
           workspaceId // Use validated workspace ID
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
          details: process.env.NODE_ENV === 'development' ? (serviceError instanceof Error ? serviceError.message : 'Unknown service error') : undefined
        },
        { status: 500 }
      );
    }

    try {
  await createNotification({
    userId: user.id,
    workspaceId: workspace.id, // Use existing workspace variable
    workspaceSlug: workspace.slug,
    type: 'cold_email',
    itemId: result.deliverableId,
    metadata: {
      emailCount: result.emails.length,
      method: validation.data.method,
      targetCompany: validation.data.targetCompany,
      targetRole: validation.data.targetRole,
      tone: validation.data.tone
    }
  });
  
  console.log('✅ Notification created for cold email generation:', result.deliverableId);
} catch (notifError) {
  console.error('Failed to create notification:', notifError);
  // Don't fail the request if notification fails
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
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    );
  }
}

// ✅ GET endpoint for fetching user's email generations
export async function GET(req: NextRequest) {
  console.log('🚀 Cold Email GET API Route called');
  
  try {
    // Use simplified authentication
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('❌ Auth failed in cold email GET:', authError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
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

    if (workspaceId) {
      const hasAccess = await validateWorkspaceAccess(user.id, workspaceId);
      if (!hasAccess) {
        return NextResponse.json({ 
          success: false,
          error: 'Workspace not found or access denied.',
          code: 'WORKSPACE_ACCESS_DENIED'
        }, { status: 403 });
      }
    }

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
        remaining: rateLimitResult.limit - rateLimitResult.count,
        workspaceId: workspaceId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('💥 Email Generations Fetch Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch email generations',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

// ADD: Copy validateWorkspaceAccess function
async function validateWorkspaceAccess(userId: string, workspaceId: string): Promise<boolean> {
  try {
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