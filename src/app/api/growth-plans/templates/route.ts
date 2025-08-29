// app/api/growth-plans/templates/route.ts - WITH ROBUST AUTHENTICATION
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GrowthPlanService } from '@/services/growthPlan.service';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';
import { GrowthPlanInput, GrowthPlanServiceResponse } from '@/types/growthPlan';

const growthPlanService = new GrowthPlanService();

// ✅ ROBUST AUTHENTICATION (same as main route)
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
  console.log('🚀 Growth Plan Template Creation API Route called');
  
  try {
    // ✅ USE ROBUST AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      console.error('❌ Auth failed in growth plan template creation:', authError);
      return createAuthErrorResponse();
    }

    console.log('✅ Growth Plan Template Creation user authenticated successfully:', user.id);
    const userId = user.id;

    // ✅ TEMPLATE CREATION RATE LIMITING
    const rateLimitResult = await rateLimit(
      `growth_plan_template_create:${userId}`,
      20, // 20 templates per hour
      3600
    );

    if (!rateLimitResult.success) {
      console.log('❌ Growth plan template creation rate limit exceeded for user:', userId);
      return NextResponse.json(
        { success: false, error: 'Template creation rate limit exceeded' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('❌ Failed to parse template creation request body:', parseError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid JSON in request body' 
        },
        { status: 400 }
      );
    }

    const { name, description, template } = body;

    if (!name || !template) {
      console.error('❌ Missing required fields in template creation request');
      return NextResponse.json(
        { success: false, error: 'Name and template data are required' },
        { status: 400 }
      );
    }

    console.log('📝 Creating growth plan template:', name, 'for user:', userId);

    let templateId;
    try {
      templateId = await growthPlanService.createGrowthPlanTemplate(
        userId,
        name,
        description || '',
        template
      );
      console.log('✅ Template created with ID:', templateId);
    } catch (serviceError) {
      console.error('💥 Error creating template:', serviceError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to create template. Please try again.',
          debug: serviceError instanceof Error ? serviceError.message : 'Unknown service error'
        },
        { status: 500 }
      );
    }

    // ✅ LOG USAGE
    try {
      await logUsage({
        userId,
        feature: 'growth_plan_template_creation',
        tokens: 0,
        timestamp: new Date(),
        metadata: {
          templateId,
          templateName: name
        }
      });
      console.log('✅ Growth plan template creation usage logged');
    } catch (logError) {
      console.error('⚠️ Growth plan template creation usage logging failed (non-critical):', logError);
    }

    console.log('✅ Growth plan template creation completed successfully');
    return NextResponse.json({
      success: true,
      data: { templateId },
      message: 'Template created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('💥 Unexpected Growth Plan Template Creation API Error:', error);
    console.error('Growth plan template creation error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create template',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  console.log('🚀 Growth Plan Templates GET API Route called');
  
  try {
    // ✅ USE ROBUST AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      console.error('❌ Auth failed in growth plan templates GET:', authError);
      return createAuthErrorResponse();
    }

    console.log('✅ Growth Plan Templates GET user authenticated successfully:', user.id);
    const userId = user.id;

    // ✅ TEMPLATE READ RATE LIMITING
    const rateLimitResult = await rateLimit(
      `growth_plan_template_read:${userId}`,
      100, // 100 template reads per hour
      3600
    );

    if (!rateLimitResult.success) {
      console.log('❌ Growth plan template read rate limit exceeded for user:', userId);
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 429 }
      );
    }

    console.log('📚 Fetching growth plan templates for user:', userId);

    let templates;
    try {
      templates = await growthPlanService.getGrowthPlanTemplates(userId);
      console.log('✅ Retrieved', templates.length, 'templates');
    } catch (serviceError) {
      console.error('💥 Error fetching templates:', serviceError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch templates. Please try again.',
          debug: serviceError instanceof Error ? serviceError.message : 'Unknown service error'
        },
        { status: 500 }
      );
    }

    // ✅ LOG USAGE
    try {
      await logUsage({
        userId,
        feature: 'growth_plan_template_read',
        tokens: 0,
        timestamp: new Date(),
        metadata: {
          templatesCount: templates.length
        }
      });
      console.log('✅ Growth plan template read usage logged');
    } catch (logError) {
      console.error('⚠️ Growth plan template read usage logging failed (non-critical):', logError);
    }

    console.log('✅ Growth plan templates GET request completed successfully');
    return NextResponse.json({
      success: true,
      data: { templates }
    });

  } catch (error) {
    console.error('💥 Unexpected Growth Plan Templates GET API Error:', error);
    console.error('Growth plan templates GET error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch templates',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}