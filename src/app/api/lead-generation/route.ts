// app/api/lead-generation/route.ts - COMPLETE WITH CREDITS
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { ApolloLeadService } from '@/services/apollo.service';
import { CreditsService } from '@/services/credits.service';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';

// Robust authentication (same pattern as your other APIs)
async function getAuthenticatedUser(request: NextRequest) {
  try {
    const cookieStore = cookies();
    
    // Method 1: Authorization header
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
    
    // Method 2: SSR cookies
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
                
                if (cookie.value.startsWith('base64-')) {
                  try {
                    const decoded = atob(cookie.value.substring(7));
                    JSON.parse(decoded);
                    return cookie.value;
                  } catch (e) {
                    console.warn(`Corrupted base64 cookie ${name}, skipping`);
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
      
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        return { user, error: null };
      }
    } catch (ssrError) {
      console.warn('SSR cookie auth failed:', ssrError);
    }
    
    // Method 3: Route handler client
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

// POST /api/lead-generation - Generate leads with credit checking
export async function POST(req: NextRequest) {
  console.log('🚀 Lead Generation API Route called');
  
  try {
    // Authentication
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('❌ Auth failed in lead generation:', authError);
      
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

    // Rate limiting - 10 lead generations per hour
    const rateLimitResult = await rateLimit(user.id, 10, 3600);
    if (!rateLimitResult.success) {
      console.log('❌ Rate limit exceeded for user:', user.id);
      return NextResponse.json(
        { 
          success: false,
          error: 'Too many lead generation requests. Please try again later.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { workspaceId, criteria, campaignName } = body;

    if (!workspaceId) {
      return NextResponse.json({ 
        success: false,
        error: 'Workspace ID required.',
        code: 'WORKSPACE_ID_REQUIRED'
      }, { status: 400 });
    }

    // Validate workspace access
    const hasAccess = await validateWorkspaceAccess(user.id, workspaceId);
    if (!hasAccess) {
      return NextResponse.json({ 
        success: false,
        error: 'Workspace not found or access denied.',
        code: 'WORKSPACE_ACCESS_DENIED'
      }, { status: 403 });
    }

    // Validate criteria
    if (!criteria || !criteria.targetIndustry?.length || !criteria.targetRole?.length) {
      return NextResponse.json({
        success: false,
        error: 'Invalid criteria. Target industry and role are required.',
        code: 'INVALID_CRITERIA'
      }, { status: 400 });
    }

    // Validate lead count
    const leadCount = criteria.leadCount || 10;
    if (leadCount < 1 || leadCount > 1000) {
      return NextResponse.json({
        success: false,
        error: 'Lead count must be between 1 and 1000.',
        code: 'INVALID_LEAD_COUNT'
      }, { status: 400 });
    }

    console.log('🔍 Starting lead generation with criteria:', {
      industries: criteria.targetIndustry,
      roles: criteria.targetRole,
      leadCount
    });

    // Check credits before generation
    const creditsService = new CreditsService();
    const affordabilityCheck = await creditsService.canAffordLeadGeneration(user.id, leadCount);
    
    if (!affordabilityCheck.canAfford) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient credits',
        reason: affordabilityCheck.reason,
        required: affordabilityCheck.costInfo.totalCost,
        available: affordabilityCheck.userCredits.credits,
        freeLeadsAvailable: affordabilityCheck.userCredits.freeLeadsAvailable,
        code: 'INSUFFICIENT_CREDITS'
      }, { status: 402 }); // Payment required
    }

    // Generate leads with automatic credit deduction
    const apolloService = new ApolloLeadService();
    const response = await apolloService.generateAndSaveLeads(
      criteria,
      user.id,
      workspaceId,
      campaignName
    );

    console.log('✅ Lead generation completed:', {
      leadsFound: response.leads.length,
      creditsUsed: response.tokensUsed,
      deliverableId: response.deliverableId
    });

    // Log usage for analytics
    await logUsage({
      userId: user.id,
      feature: 'lead_generation',
      tokens: response.tokensUsed,
      timestamp: new Date(),
      metadata: {
        deliverableId: response.deliverableId,
        leadCount: response.leads.length,
        criteria: {
          industries: criteria.targetIndustry,
          roles: criteria.targetRole,
          locations: criteria.location
        },
        creditInfo: response.creditInfo
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        generationId: response.deliverableId,
        leads: response.leads,
        generationTime: response.generationTime,
        creditInfo: response.creditInfo
      },
      meta: {
        remaining: rateLimitResult.limit - rateLimitResult.count,
        creditsRemaining: response.creditInfo.remainingCredits,
        freeLeadsRemaining: response.creditInfo.remainingFreeLeads
      }
    });

  } catch (error) {
    console.error('💥 Lead Generation API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate leads. Please try again.',
        debug: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/lead-generation - Get user's lead generations
export async function GET(req: NextRequest) {
  console.log('🚀 Lead Generation GET API Route called');
  
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('❌ Auth failed in lead generation GET:', authError);
      
      const response = NextResponse.json(
        { 
          success: false,
          error: 'Authentication required.',
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

    // Get generations using service
    const apolloService = new ApolloLeadService();
    const generations = await apolloService.getUserLeadGenerations(
      user.id,
      workspaceId || undefined
    );

    // Log usage for list access
    await logUsage({
      userId: user.id,
      feature: 'lead_generation_list',
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
    console.error('💥 Lead Generations Fetch Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch lead generations' 
      },
      { status: 500 }
    );
  }
}