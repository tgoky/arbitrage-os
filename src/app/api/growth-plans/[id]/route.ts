// app/api/growth-plans/[id]/route.ts - WITH ROBUST AUTHENTICATION
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GrowthPlanService } from '@/services/growthPlan.service';
import { validateGrowthPlanInput } from '../../../validators/growthPlan.validator';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { 
  GetGrowthPlanResponse, 
  UpdateGrowthPlanRequest, 
  UpdateGrowthPlanResponse,
  GrowthPlanServiceResponse 
} from '@/types/growthPlan';

const growthPlanService = new GrowthPlanService();

// ✅ ROBUST AUTHENTICATION (same as main route)
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
        console.log('✅ Growth Plan [id] Auth Method 1 succeeded for user:', user.id);
        return { user, error: null };
      }
      
      console.log('⚠️ Growth Plan [id] route handler auth failed:', error?.message);
    } catch (helperError) {
      console.warn('⚠️ Growth Plan [id] route handler client failed:', helperError);
    }
    
    // Method 2: Try with authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        console.log('🔍 Growth Plan [id] trying token auth...');
        
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
          console.log('✅ Growth Plan [id] Auth Method 2 (token) succeeded for user:', user.id);
          return { user, error: null };
        }
        
        console.log('⚠️ Growth Plan [id] token auth failed:', error?.message);
      } catch (tokenError) {
        console.warn('⚠️ Growth Plan [id] token auth error:', tokenError);
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
                  console.warn(`Invalid Growth Plan [id] cookie ${name}, skipping...`);
                  return undefined;
                }
              }
              return cookie.value;
            } catch (error) {
              console.warn(`Error reading Growth Plan [id] cookie ${name}:`, error);
              return undefined;
            }
          },
        },
      }
    );
    
    const { data: { user }, error } = await supabaseSSR.auth.getUser();
    
    if (!error && user) {
      console.log('✅ Growth Plan [id] Auth Method 3 (SSR cookies) succeeded for user:', user.id);
    } else {
      console.log('⚠️ Growth Plan [id] SSR cookie auth failed:', error?.message);
    }
    
    return { user, error };
    
  } catch (error) {
    console.error('💥 All Growth Plan [id] authentication methods failed:', error);
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
  console.log('🚀 Growth Plan GET [id] API Route called for ID:', params.id);
  
  try {
    // ✅ USE ROBUST AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      console.error('❌ Auth failed in growth plan GET [id]:', authError);
      return createAuthErrorResponse();
    }

    console.log('✅ Growth Plan GET [id] user authenticated successfully:', user.id);
    const userId = user.id;
    const planId = params.id;

    // ✅ LIGHT RATE LIMITING: Prevent abuse
    const rateLimitResult = await rateLimit(
      `growth_plan_read:${userId}`,
      200, // 200 reads per hour
      3600
    );

    if (!rateLimitResult.success) {
      console.log('❌ Growth plan read rate limit exceeded for user:', userId);
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 429 }
      );
    }

    console.log('🔍 Fetching growth plan:', planId, 'for user:', userId);
    
    let plan;
    try {
      plan = await growthPlanService.getGrowthPlan(userId, planId);
      
      if (!plan) {
        console.log('❌ Growth plan not found:', planId);
        return NextResponse.json(
          { success: false, error: 'Growth plan not found' },
          { status: 404 }
        );
      }
      
      console.log('✅ Growth plan retrieved successfully:', planId);
    } catch (serviceError) {
      console.error('💥 Error fetching growth plan:', serviceError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch growth plan. Please try again.',
          debug: serviceError instanceof Error ? serviceError.message : 'Unknown service error'
        },
        { status: 500 }
      );
    }

    // ✅ LOG USAGE
    try {
      await logUsage({
        userId,
        feature: 'growth_plan_read',
        tokens: 0,
        timestamp: new Date(),
        metadata: {
          planId,
          action: 'read'
        }
      });
    } catch (logError) {
      console.error('⚠️ Growth plan read usage logging failed (non-critical):', logError);
    }

    const response: GrowthPlanServiceResponse<GetGrowthPlanResponse> = {
      success: true,
      data: { plan }
    };

    console.log('✅ Growth plan GET [id] request completed successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('💥 Unexpected Growth Plan GET [id] API Error:', error);
    console.error('Growth plan GET [id] error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch growth plan',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🚀 Growth Plan PUT [id] API Route called for ID:', params.id);
  
  try {
    // ✅ USE ROBUST AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      console.error('❌ Auth failed in growth plan PUT [id]:', authError);
      return createAuthErrorResponse();
    }

    console.log('✅ Growth Plan PUT [id] user authenticated successfully:', user.id);
    const userId = user.id;
    const planId = params.id;

    // ✅ MODERATE RATE LIMITING: Updates might trigger AI regeneration
    const rateLimitResult = await rateLimit(
      `growth_plan_update:${userId}`,
      20, // 20 updates per hour
      3600
    );

    if (!rateLimitResult.success) {
      console.log('❌ Growth plan update rate limit exceeded for user:', userId);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Update rate limit exceeded. You can update 20 plans per hour.' 
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    console.log('📥 Parsing growth plan update request body...');
    let body: UpdateGrowthPlanRequest;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('❌ Failed to parse growth plan update request body:', parseError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid JSON in request body' 
        },
        { status: 400 }
      );
    }
    
    const { updates } = body;

    if (!updates || typeof updates !== 'object') {
      console.error('❌ Growth plan updates object is missing or invalid');
      return NextResponse.json(
        { 
          success: false,
          error: 'Updates object is required' 
        },
        { status: 400 }
      );
    }

    console.log('🔍 GROWTH PLAN UPDATE DATA:', JSON.stringify(updates, null, 2));

    // Validate partial updates
    if (Object.keys(updates).length > 0) {
      console.log('🔍 Starting growth plan update validation...');
      const validation = validateGrowthPlanInput(updates, true);
      if (!validation.success) {
        console.error('❌ GROWTH PLAN UPDATE VALIDATION FAILED:');
        console.error('Update validation errors:', JSON.stringify(validation.errors, null, 2));
        
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            data: validation.errors,
            debug: {
              receivedUpdates: updates,
              updateKeys: Object.keys(updates)
            }
          },
          { status: 400 }
        );
      }
      console.log('✅ Growth plan update validation passed');
    }

    console.log('🔄 Updating growth plan:', planId);
    
    let updatedPlan;
    try {
      updatedPlan = await growthPlanService.updateGrowthPlan(userId, planId, updates);
      console.log('✅ Growth plan updated successfully:', planId);
    } catch (serviceError) {
      console.error('💥 Error updating growth plan:', serviceError);
      
      if (serviceError instanceof Error && serviceError.message === 'Growth plan not found') {
        return NextResponse.json(
          { success: false, error: 'Growth plan not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to update growth plan. Please try again.',
          debug: serviceError instanceof Error ? serviceError.message : 'Unknown service error'
        },
        { status: 500 }
      );
    }
    
    // ✅ LOG USAGE: If AI was used for regeneration
    try {
      if (updatedPlan.metadata.updateType === 'full_regeneration') {
        await logUsage({
          userId,
          feature: 'growth_plan_update_regeneration',
          tokens: updatedPlan.metadata.lastGenerationTime || 0,
          timestamp: new Date(),
          metadata: {
            planId,
            updateType: 'full_regeneration',
            fieldsUpdated: Object.keys(updates)
          }
        });
        console.log('✅ Growth plan regeneration usage logged');
      } else {
        await logUsage({
          userId,
          feature: 'growth_plan_update',
          tokens: 0,
          timestamp: new Date(),
          metadata: {
            planId,
            updateType: 'partial_update',
            fieldsUpdated: Object.keys(updates)
          }
        });
        console.log('✅ Growth plan update usage logged');
      }
    } catch (logError) {
      console.error('⚠️ Growth plan update usage logging failed (non-critical):', logError);
    }
    
    const response: GrowthPlanServiceResponse<UpdateGrowthPlanResponse> = {
      success: true,
      data: {
        planId,
        plan: updatedPlan.plan,
        updatedAt: updatedPlan.updatedAt.toISOString()
      },
      message: 'Growth plan updated successfully'
    };

    console.log('✅ Growth plan PUT [id] request completed successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('💥 Unexpected Growth Plan PUT [id] API Error:', error);
    console.error('Growth plan PUT [id] error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update growth plan',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🚀 Growth Plan DELETE [id] API Route called for ID:', params.id);
  
  try {
    // ✅ USE ROBUST AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      console.error('❌ Auth failed in growth plan DELETE [id]:', authError);
      return createAuthErrorResponse();
    }

    console.log('✅ Growth Plan DELETE [id] user authenticated successfully:', user.id);
    const userId = user.id;
    const planId = params.id;

    // ✅ MODERATE RATE LIMITING: Prevent delete spam
    const rateLimitResult = await rateLimit(
      `growth_plan_delete:${userId}`,
      50, // 50 deletes per hour
      3600
    );

    if (!rateLimitResult.success) {
      console.log('❌ Growth plan delete rate limit exceeded for user:', userId);
      return NextResponse.json(
        { success: false, error: 'Delete rate limit exceeded' },
        { status: 429 }
      );
    }

    console.log('🗑️ Deleting growth plan:', planId);
    
    let success;
    try {
      success = await growthPlanService.deleteGrowthPlan(userId, planId);
      
      if (!success) {
        console.log('❌ Growth plan not found for deletion:', planId);
        return NextResponse.json(
          { success: false, error: 'Growth plan not found' },
          { status: 404 }
        );
      }
      
      console.log('✅ Growth plan deleted successfully:', planId);
    } catch (serviceError) {
      console.error('💥 Error deleting growth plan:', serviceError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to delete growth plan. Please try again.',
          debug: serviceError instanceof Error ? serviceError.message : 'Unknown service error'
        },
        { status: 500 }
      );
    }

    // ✅ LOG USAGE: Track deletions
    try {
      await logUsage({
        userId,
        feature: 'growth_plan_deletion',
        tokens: 0,
        timestamp: new Date(),
        metadata: {
          planId,
          action: 'delete'
        }
      });
      console.log('✅ Growth plan deletion usage logged');
    } catch (logError) {
      console.error('⚠️ Growth plan deletion usage logging failed (non-critical):', logError);
    }

    const response: GrowthPlanServiceResponse = {
      success: true,
      message: 'Growth plan deleted successfully'
    };

    console.log('✅ Growth plan DELETE [id] request completed successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('💥 Unexpected Growth Plan DELETE [id] API Error:', error);
    console.error('Growth plan DELETE [id] error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete growth plan',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}