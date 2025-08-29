// app/api/growth-plans/route.ts - WITH DATABASE SAVING ENABLED
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { GrowthPlanService } from '@/services/growthPlan.service';
import { validateGrowthPlanInput, validateGrowthPlanBusinessRules } from '../../validators/growthPlan.validator';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { 
  GrowthPlanInput, 
  CreateGrowthPlanRequest, 
  CreateGrowthPlanResponse,
  ListGrowthPlansResponse,
  GrowthPlanServiceResponse 
} from '@/types/growthPlan';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const growthPlanService = new GrowthPlanService();

// ✅ ROBUST AUTHENTICATION (same as before)
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
        console.log('✅ Growth Plan Auth Method 1 (route handler) succeeded for user:', user.id);
        return { user, error: null };
      }
      
      console.log('⚠️ Growth Plan route handler auth failed:', error?.message);
    } catch (helperError) {
      console.warn('⚠️ Growth Plan route handler client failed:', helperError);
    }
    
    // Method 2: Try with authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        console.log('🔍 Growth Plan trying token auth with token:', token.substring(0, 20) + '...');
        
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
          console.log('✅ Growth Plan Auth Method 2 (token) succeeded for user:', user.id);
          return { user, error: null };
        }
        
        console.log('⚠️ Growth Plan token auth failed:', error?.message);
      } catch (tokenError) {
        console.warn('⚠️ Growth Plan token auth error:', tokenError);
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
                  console.warn(`Invalid Growth Plan cookie ${name}, skipping...`);
                  return undefined;
                }
              }
              return cookie.value;
            } catch (error) {
              console.warn(`Error reading Growth Plan cookie ${name}:`, error);
              return undefined;
            }
          },
        },
      }
    );
    
    const { data: { user }, error } = await supabaseSSR.auth.getUser();
    
    if (!error && user) {
      console.log('✅ Growth Plan Auth Method 3 (SSR cookies) succeeded for user:', user.id);
    } else {
      console.log('⚠️ Growth Plan SSR cookie auth failed:', error?.message);
    }
    
    return { user, error };
    
  } catch (error) {
    console.error('💥 All Growth Plan authentication methods failed:', error);
    return { user: null, error };
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 Growth Plan API Route called');
  
  try {
    // ✅ USE ROBUST AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      console.error('❌ Auth failed in growth plan:', authError);
      
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

    console.log('✅ Growth Plan user authenticated successfully:', user.id);
    const userId = user.id;

    // ✅ RATE LIMITING: Growth plan generation is expensive!
    console.log('🔍 Checking rate limits for growth plan user:', userId);
    const rateLimitResult = await rateLimit(
      `growth_plan_generation:${userId}`,
      5, // 5 plans per hour
      3600 // 1 hour window
    );

    if (!rateLimitResult.success) {
      console.log('❌ Growth plan rate limit exceeded for user:', userId);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded. You can generate 5 growth plans per hour.',
          data: {
            limit: rateLimitResult.limit,
            remaining: rateLimitResult.remaining,
            resetTime: new Date(rateLimitResult.reset).toISOString()
          }
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString()
          }
        }
      );
    }
    console.log('✅ Growth plan rate limit check passed');

    // Parse and validate request body
    console.log('📥 Parsing growth plan request body...');
    const body: CreateGrowthPlanRequest = await request.json();
    
    const { input, workspaceId } = body;

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


    if (!input) {
      console.error('❌ Growth plan input is missing');
      return NextResponse.json(
        { 
          success: false,
          error: 'Growth plan input is required' 
        },
        { status: 400 }
      );
    }

    // Add userId to input
    const inputWithUserId: GrowthPlanInput = {
      ...input,
      userId
    };

    console.log('🔍 Starting growth plan validation...');
    
    // Validate input
    const validation = validateGrowthPlanInput(inputWithUserId);
    if (!validation.success) {
      console.error('❌ GROWTH PLAN VALIDATION FAILED:');
      console.error('Validation errors:', JSON.stringify(validation.errors, null, 2));
      
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          data: validation.errors
        },
        { status: 400 }
      );
    }

    // Validate business rules
    const businessValidation = validateGrowthPlanBusinessRules(validation.data);
    if (!businessValidation.isValid) {
      console.error('❌ GROWTH PLAN BUSINESS VALIDATION FAILED:');
      console.error('Business validation errors:', businessValidation.errors);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Business validation failed',
          data: {
            errors: businessValidation.errors,
            warnings: businessValidation.warnings,
            insights: businessValidation.insights
          }
        },
        { status: 400 }
      );
    }

    // Log warnings if any (but still proceed)
    if (businessValidation.warnings.length > 0) {
      console.warn('⚠️ Growth plan validation warnings:', businessValidation.warnings);
    }

    console.log('✅ Growth plan input validation passed');

    // ✅ GET USER'S WORKSPACE with error handling
    console.log('🔍 Getting/creating workspace for growth plan user:', userId);
    let workspace;
    try {
      workspace = await prisma.workspace.findFirst({
        where: { user_id: userId }
      });

      if (!workspace) {
        console.log('📁 Creating default workspace for growth plan user:', userId);
        workspace = await prisma.workspace.create({
          data: {
            user_id: userId,
            name: 'Default Workspace',
            slug: 'default',
            description: 'Default workspace for growth plans'
          }
        });
        console.log('✅ Created growth plan workspace:', workspace.id);
      } else {
        console.log('✅ Found existing growth plan workspace:', workspace.id);
      }
    } catch (dbError) {
      console.error('💥 Database error getting/creating growth plan workspace:', dbError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Database error. Please try again.',
          debug: dbError instanceof Error ? dbError.message : 'Unknown DB error'
        },
        { status: 500 }
      );
    }

    // Generate growth plan
    console.log('🤖 Starting growth plan generation...');
    let plan;
    try {
      plan = await growthPlanService.generateGrowthPlan(inputWithUserId); 
      console.log('✅ Growth plan generation completed successfully');
    } catch (serviceError) {
      console.error('💥 Service error during growth plan generation:', serviceError);
      console.error('Growth plan service error stack:', serviceError instanceof Error ? serviceError.stack : 'No stack');
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to generate growth plan. Please try again.',
          debug: serviceError instanceof Error ? serviceError.message : 'Unknown service error'
        },
        { status: 500 }
      );
    }

  if (!userId || typeof userId !== 'string' || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(userId)) {
  console.error("🚨 INVALID USER ID DETECTED:", userId);
  return NextResponse.json(
    { success: false, error: "Authentication failed: Invalid user ID." },
    { status: 401 } // 401 Unauthorized is appropriate for auth issues
  );
}

// 2. Determine and Validate finalWorkspaceId
let finalWorkspaceId: string;

// Check if workspaceId from request body is a valid UUID string
if (workspaceId && typeof workspaceId === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(workspaceId)) {
  console.log("   Using workspaceId from request body");
  finalWorkspaceId = workspaceId;
} else {
  // Fallback to the user's default workspace ID obtained from DB
  console.log("   Using default workspace ID from DB lookup");
  finalWorkspaceId = workspace.id;
}

// 3. Validate finalWorkspaceId (crucial check)
if (!finalWorkspaceId || typeof finalWorkspaceId !== 'string' || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(finalWorkspaceId)) {
   console.error("🚨 INVALID WORKSPACE ID DETECTED for saving:", finalWorkspaceId, "Type:", typeof finalWorkspaceId);
   // Log the values for debugging
   console.error("   workspaceId (from body):", workspaceId, "Type:", typeof workspaceId);
   console.error("   workspace.id (from DB):", workspace.id, "Type:", typeof workspace.id);
   return NextResponse.json(
     { success: false, error: "Invalid workspace ID format provided or could not determine a valid workspace." },
     { status: 400 } // 400 Bad Request for invalid input
   );
}

// --- End of validation logic ---

// Now use finalWorkspaceId in the save call
console.log('💾 Saving growth plan to database...');
console.log("   Final validated IDs - UserId:", userId, "WorkspaceId:", finalWorkspaceId); // Extra debug log
  let planId;
    try {
      planId = await growthPlanService.saveGrowthPlan(
        userId,
        workspaceId, // Use the validated workspace ID directly
        plan,
        inputWithUserId
      );
    } catch (saveError) {

      console.error('💥 Error saving growth plan:', saveError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to save growth plan. Please try again.',
          debug: saveError instanceof Error ? saveError.message : 'Unknown save error'
        },
        { status: 500 }
      );
    }

    // ✅ LOG USAGE: Track AI token consumption
    console.log('📊 Logging growth plan usage...');
    try {
      await logUsage({
      userId,
      feature: 'growth_plan_generation',
      tokens: plan.tokensUsed,
      timestamp: new Date(),
      metadata: {
        planId,
        workspaceId, // ADD THIS
        workspaceName: workspace.name, // ADD THIS (get workspace object first)
        clientCompany: input.clientCompany,
        industry: input.industry,
        timeframe: input.timeframe,
        generationTime: plan.generationTime
      }
    });
      console.log('✅ Growth plan usage logged successfully');
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('⚠️ Growth plan usage logging failed (non-critical):', logError);
    }

    const response: GrowthPlanServiceResponse<CreateGrowthPlanResponse> = {
      success: true,
      data: {
        planId,
        plan
      },
      message: 'Growth plan generated and saved successfully',
      meta: {
        saved: true,
        workspace: workspace.name,
        planId,
        tokensUsed: plan.tokensUsed,
        generationTime: plan.generationTime
      }
    };

    console.log('🎉 Growth plan generation completed successfully');
    return NextResponse.json(response, { 
      status: 201,
      headers: {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.reset.toString()
      }
    });

  } catch (error) {
    console.error('💥 Unexpected Growth Plan API Error:', error);
    console.error('Growth plan error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create growth plan',
        message: error instanceof Error ? error.message : 'Unknown error',
        debug: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  console.log('🚀 Growth Plan GET API Route called');
  
  try {
    // ✅ USE ROBUST AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      console.error('❌ Auth failed in growth plan GET:', authError);
      
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

    console.log('✅ Growth Plan GET user authenticated successfully:', user.id);
    const userId = user.id;

    // ✅ LIGHT RATE LIMITING: Prevent API abuse on reads
    const rateLimitResult = await rateLimit(
      `growth_plan_list:${userId}`,
      100, // 100 requests per hour
      3600 // 1 hour window
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many requests. Please slow down.' 
        },
        { status: 429 }
      );
    }

  const { searchParams } = new URL(request.url);
   const workspaceId = searchParams.get('workspaceId');

    if (workspaceId) {
      const hasAccess = await validateWorkspaceAccess(user.id, workspaceId);
      if (!hasAccess) {
        return NextResponse.json({ 
          error: 'Workspace access denied.',
          code: 'WORKSPACE_ACCESS_DENIED'
        }, { status: 403 });
      }
    }

// Get raw workspaceId from query params
const rawWorkspaceId = searchParams.get('workspaceId'); // This could be 'default', a UUID, or null
const limit = parseInt(searchParams.get('limit') || '20');
const offset = parseInt(searchParams.get('offset') || '0');
const industry = searchParams.get('industry');
const timeframe = searchParams.get('timeframe');

console.log('🔍 Fetching growth plans for user:', userId, 'Raw workspaceId from query:', rawWorkspaceId);

// --- Add Robust Workspace ID Handling for GET ---
let finalWorkspaceIdForFetch: string | undefined;

// Validate the rawWorkspaceId from the query
if (rawWorkspaceId && typeof rawWorkspaceId === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(rawWorkspaceId)) {
  console.log("   Using valid workspaceId from query parameter");
  finalWorkspaceIdForFetch = rawWorkspaceId;
} else if (rawWorkspaceId === 'default' || !rawWorkspaceId) { // Handle 'default' string or missing ID
  // Need to get the user's actual default workspace ID
  console.log("   Need to resolve 'default' or missing workspaceId. Fetching user's default workspace...");
  try {
    const defaultWorkspace = await prisma.workspace.findFirst({
      where: { user_id: userId, slug: 'default' } // Or find the one created for the user
      // Or perhaps just: where: { user_id: userId } and take the first one if there's only one default-like
      // Adjust this query based on how you identify the "default" workspace for the user.
      // The safest way is to use the same logic as in POST to get the workspace.id
    });

    if (defaultWorkspace) {
      console.log("   Resolved 'default' to workspace ID:", defaultWorkspace.id);
      finalWorkspaceIdForFetch = defaultWorkspace.id;
    } else {
      console.warn("   User's default workspace not found. Fetching plans for all user workspaces or none?");
      // Decide: Fetch for all user's workspaces? Or return empty?
      // For now, let's pass undefined to potentially fetch all for the user, or handle as needed.
      // You might want to refine this logic.
      finalWorkspaceIdForFetch = undefined; // Or handle error
      // Alternatively, if you *always* want a workspace, you could create it here too,
      // but that's usually done in POST.
    }
  } catch (dbError) {
    console.error('💥 Database error resolving default workspace ID for GET:', dbError);
    return NextResponse.json(
      {
        success: false,
        error: 'Database error resolving workspace.',
      },
      { status: 500 }
    );
  }
} else {
  // rawWorkspaceId is a string but not a valid UUID nor 'default'
  console.warn("   Invalid workspaceId format received in query:", rawWorkspaceId);
  // Decide: Return error or ignore filter?
  // Let's ignore the invalid filter for now and fetch for the user generally.
  finalWorkspaceIdForFetch = undefined;
}
// --- End of Robust Workspace ID Handling for GET ---

console.log('🔍 Fetching growth plans for user:', userId, 'Using resolved/final workspaceId:', finalWorkspaceIdForFetch);

let plans;
try {
  // Pass the validated/resolved workspaceId
  plans = await growthPlanService.getUserGrowthPlans(
    userId,
    workspaceId || undefined
  );
  console.log('✅ Retrieved', plans.length, 'growth plans');
} catch (serviceError) {
      console.error('💥 Error fetching growth plans:', serviceError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch growth plans. Please try again.',
          debug: serviceError instanceof Error ? serviceError.message : 'Unknown service error'
        },
        { status: 500 }
      );
    }

    // Apply filters
    let filteredPlans = plans;
    if (industry) {
      filteredPlans = filteredPlans.filter(plan => plan.industry === industry);
    }
    if (timeframe) {
      filteredPlans = filteredPlans.filter(plan => plan.timeframe === timeframe);
    }

    // Apply pagination
    const paginatedPlans = filteredPlans.slice(offset, offset + limit);
    const hasMore = filteredPlans.length > offset + limit;

    // ✅ LOG USAGE for list access
    try {
      await logUsage({
        userId,
        feature: 'growth_plan_list',
        tokens: 0,
        timestamp: new Date(),
        metadata: {
            workspaceId: finalWorkspaceIdForFetch, 
          resultCount: paginatedPlans.length,
          totalCount: filteredPlans.length,
          filters: { industry, timeframe }
        }
      });
    } catch (logError) {
      console.error('⚠️ Growth plan list usage logging failed (non-critical):', logError);
    }

    const response: GrowthPlanServiceResponse<ListGrowthPlansResponse> = {
      success: true,
      data: {
        plans: paginatedPlans,
        total: filteredPlans.length,
        hasMore
      }
    };

    console.log('✅ Growth plan list request completed successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('💥 Unexpected Growth Plan GET API Error:', error);
    console.error('Growth plan GET error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list growth plans',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

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