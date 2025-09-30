// app/api/lead-generation/route.ts - COMPLETE UPDATED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { ApolloLeadService } from '@/services/apollo.service';
import { CreditsService } from '@/services/credits.service';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';

import { createNotification } from '@/lib/notificationHelper';

// Enhanced Lead interface matching the global service
interface GeneratedLead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  title: string;
  company: string;
  industry: string;
  companySize?: string;
  location: string;
  linkedinUrl?: string;
  website?: string;
  score: number;
  apolloId?: string;
  metadata?: {
    companyRevenue?: string;
    technologies?: string[];
    employeeCount?: number;
    founded?: string;
    departments?: string[];
    seniority?: string;
    emailStatus?: string;
    countryCode?: string;
    timezone?: string;
    currency?: string;
  };
}

// Enhanced criteria interface for global search
interface LeadGenerationCriteria {
  targetIndustry: string[];
  targetRole: string[];
  companySize?: string[];
  country?: string[];     // New global location fields
  state?: string[];       // New global location fields
  city?: string[];        // New global location fields
  keywords?: string[];
  technologies?: string[];
  revenueRange?: {
    min?: number;
    max?: number;
  };
  leadCount: number;
  requirements?: string[];
}

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

// Enhanced criteria validation for global search
function validateGlobalCriteria(criteria: any): { isValid: boolean; error?: string; code?: string } {
  // Core requirements
  if (!criteria || !criteria.targetIndustry?.length || !criteria.targetRole?.length) {
    return {
      isValid: false,
      error: 'Target industry and role are required.',
      code: 'INVALID_CRITERIA'
    };
  }

  // Industry validation
  if (criteria.targetIndustry.length > 10) {
    return {
      isValid: false,
      error: 'Too many industries selected. Maximum 10 allowed.',
      code: 'TOO_MANY_INDUSTRIES'
    };
  }

  // Role validation
  if (criteria.targetRole.length > 10) {
    return {
      isValid: false,
      error: 'Too many job titles selected. Maximum 10 allowed.',
      code: 'TOO_MANY_ROLES'
    };
  }

  // Location validation - enhanced for global search
  const locationCount = (criteria.country?.length || 0) + 
                       (criteria.state?.length || 0) + 
                       (criteria.city?.length || 0);
  
  if (locationCount > 15) {
    return {
      isValid: false,
      error: 'Too many locations selected. Try fewer countries, states, or cities for better results.',
      code: 'TOO_MANY_LOCATIONS'
    };
  }

  // Complexity check - total filter count
  const totalFilters = criteria.targetIndustry.length + 
                      criteria.targetRole.length + 
                      locationCount + 
                      (criteria.companySize?.length || 0);

  if (totalFilters > 20) {
    return {
      isValid: false,
      error: 'Search criteria too complex. Please reduce the number of filters for better results.',
      code: 'CRITERIA_TOO_COMPLEX'
    };
  }

  // Lead count validation
  const leadCount = criteria.leadCount || 10;
  if (leadCount < 1 || leadCount > 1000) {
    return {
      isValid: false,
      error: 'Lead count must be between 1 and 1000.',
      code: 'INVALID_LEAD_COUNT'
    };
  }

  return { isValid: true };
}

// POST /api/lead-generation - Generate leads with enhanced global search
export async function POST(req: NextRequest) {
  console.log('🚀 Global Lead Generation API Route called');
  
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

    // Enhanced criteria validation
    const validation = validateGlobalCriteria(criteria);
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: validation.error,
        code: validation.code
      }, { status: 400 });
    }

    const leadCount = criteria.leadCount || 10;

    // Enhanced logging for global search
    console.log('🌍 Starting global lead generation with criteria:', {
      industries: criteria.targetIndustry,
      roles: criteria.targetRole,
      countries: criteria.country || [],
      states: criteria.state || [],
      cities: criteria.city || [],
      companySize: criteria.companySize || [],
      keywords: criteria.keywords || [],
      technologies: criteria.technologies || [],
      leadCount,
      hasRevenue: !!(criteria.revenueRange?.min || criteria.revenueRange?.max)
    });

    // Log complexity metrics
    const locationCount = (criteria.country?.length || 0) + 
                         (criteria.state?.length || 0) + 
                         (criteria.city?.length || 0);
    const totalFilters = criteria.targetIndustry.length + 
                        criteria.targetRole.length + 
                        locationCount + 
                        (criteria.companySize?.length || 0);

    console.log('📊 Search complexity:', {
      totalFilters,
      locationCount,
      isGlobalSearch: locationCount === 0,
      complexityLevel: totalFilters > 10 ? 'high' : totalFilters > 5 ? 'medium' : 'low'
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

    // Generate leads with enhanced global service
    const apolloService = new ApolloLeadService();
    const response = await apolloService.generateAndSaveLeads(
      criteria,
      user.id,
      workspaceId,
      campaignName
    );

    console.log('✅ Global lead generation completed:', {
      leadsFound: response.leads.length,
      creditsUsed: response.tokensUsed,
      deliverableId: response.deliverableId,
      searchStrategy: response.searchStrategy,
      globalCoverage: response.globalCoverage
    });

// Create notification after successful lead generation
    try {
      // Fetch workspace for slug
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { slug: true }
      });


     if (workspace) {
        await createNotification({
          userId: user.id,
          workspaceId: workspaceId,
          workspaceSlug: workspace.slug,
          type: 'lead_generation',
          itemId: response.deliverableId,
          metadata: {
            leadCount: response.leads.length,
            industries: criteria.targetIndustry,
            roles: criteria.targetRole,
            searchStrategy: response.searchStrategy,
            isGlobal: response.globalCoverage?.isGlobal || false,
            countries: response.globalCoverage?.countries || []
          }
        });
        
        console.log('✅ Notification created for lead generation:', response.deliverableId);
      } else {
        console.warn('Workspace not found for notification:', workspaceId);
      }
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
      // Don't fail the entire request if notification fails
    }

    // Enhanced usage logging with global metadata
    await logUsage({
      userId: user.id,
      feature: 'global_lead_generation',
      tokens: response.tokensUsed,
      timestamp: new Date(),
      metadata: {
        deliverableId: response.deliverableId,
        leadCount: response.leads.length,
        criteria: {
          industries: criteria.targetIndustry,
          roles: criteria.targetRole,
          countries: criteria.country || [],
          states: criteria.state || [],
          cities: criteria.city || [],
          companySize: criteria.companySize || [],
          keywords: criteria.keywords || [],
          technologies: criteria.technologies || []
        },
        creditInfo: response.creditInfo,
        searchStrategy: response.searchStrategy,
        globalCoverage: response.globalCoverage,
        complexity: {
          totalFilters,
          locationCount,
          isGlobalSearch: locationCount === 0
        }
      }
    });

    // Enhanced response with global metadata
    return NextResponse.json({
      success: true,
      data: {
        generationId: response.deliverableId,
        leads: response.leads,
        generationTime: response.generationTime,
        creditInfo: response.creditInfo,
        searchStrategy: response.searchStrategy,
        globalCoverage: response.globalCoverage,
        totalFound: response.totalFound
      },
      meta: {
        remaining: rateLimitResult.limit - rateLimitResult.count,
        creditsRemaining: response.creditInfo.remainingCredits,
        freeLeadsRemaining: response.creditInfo.remainingFreeLeads,
        complexity: {
          totalFilters,
          locationCount,
          complexityLevel: totalFilters > 10 ? 'high' : totalFilters > 5 ? 'medium' : 'low'
        }
      }
    });

  } catch (error) {
    console.error('💥 Global Lead Generation API Error:', error);
    
    if (error instanceof Error) {
      // Handle specific global search errors
      if (error.message.includes('location validation')) {
        return NextResponse.json({
          success: false,
          error: 'Invalid location criteria. Please check your country, state, and city selections.',
          code: 'INVALID_LOCATION_CRITERIA'
        }, { status: 400 });
      }
      
      if (error.message.includes('global search')) {
        return NextResponse.json({
          success: false,
          error: 'Global search failed. Try more specific location criteria.',
          code: 'GLOBAL_SEARCH_FAILED'
        }, { status: 422 });
      }

      if (error.message.includes('Apollo API')) {
        return NextResponse.json({
          success: false,
          error: 'Lead search service temporarily unavailable. Please try again in a few minutes.',
          code: 'APOLLO_SERVICE_ERROR'
        }, { status: 503 });
      }

      if (error.message.includes('rate limit')) {
        return NextResponse.json({
          success: false,
          error: 'Apollo API rate limit exceeded. Please wait before trying again.',
          code: 'APOLLO_RATE_LIMIT'
        }, { status: 429 });
      }

      if (error.message.includes('authentication')) {
        return NextResponse.json({
          success: false,
          error: 'Apollo API authentication failed. Please contact support.',
          code: 'APOLLO_AUTH_ERROR'
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate leads. Please try again.',
      debug: error instanceof Error ? error.message : 'Unknown error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

// GET /api/lead-generation - Get user's lead generations with proper format for detail page
export async function GET(req: NextRequest) {
  console.log('🚀 Global Lead Generation GET API Route called');
  
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

    // Build where clause
    const whereClause: any = {
      user_id: user.id,
      type: 'lead_generation'
    };

    if (workspaceId) {
      whereClause.workspace_id = workspaceId;
    }

    // Fetch generations directly from database to ensure proper format
    const generations = await prisma.deliverable.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    console.log(`📋 Found ${generations.length} lead generations for user ${user.id}`);

    
const formattedGenerations = generations.map(gen => {
  // Parse the content to get leads and metadata
  let contentData = { leads: [], totalFound: 0 };
  let metadata = gen.metadata as any;
  
  try {
    if (gen.content) {
      contentData = JSON.parse(gen.content);
    }
  } catch (parseError) {
    console.warn(`Failed to parse content for generation ${gen.id}:`, parseError);
  }

  const leads = contentData.leads || [];
  
  // FIX: Calculate accurate metrics (same logic as detail page)
  const emailCount = leads.filter((lead: any) => 
    lead.email && 
    lead.email !== "email_not_unlocked@domain.com" && 
    !lead.email.includes('example.com')
  ).length;

  const phoneCount = leads.filter((lead: any) => 
    lead.phone && lead.phone.trim() !== ''
  ).length;

  const linkedinCount = leads.filter((lead: any) => 
    lead.linkedinUrl && lead.linkedinUrl.trim() !== ''
  ).length;

  const countriesRepresented = new Set(
    leads
      .map((lead: any) => lead.metadata?.countryCode)
      .filter(Boolean)
      .map((code: string) => code.toLowerCase())
  ).size;

  const totalEmployeeCount = leads.reduce((sum: number, lead: any) => 
    sum + (lead.metadata?.employeeCount || 0), 0);
  const avgEmployeeCount = leads.length > 0 ? totalEmployeeCount / leads.length : 0;

  const averageScore = leads.length > 0 
    ? Math.round(leads.reduce((sum: number, lead: any) => sum + (lead.score || 0), 0) / leads.length)
    : 0;

  return {
    id: gen.id,
    title: gen.title,
    content: gen.content,
    metadata: {
      ...metadata,
      leadCount: leads.length,
      totalFound: contentData.totalFound || leads.length,
      averageScore, // Use calculated score
      generationTime: metadata?.generationTime || 0,
      searchStrategy: metadata?.searchStrategy,
      globalCoverage: metadata?.globalCoverage,
      qualityMetrics: {
        emailCount, // Use calculated count
        phoneCount, // Use calculated count
        linkedinCount, // Use calculated count
        avgEmployeeCount: Math.round(avgEmployeeCount),
        countriesRepresented // Use calculated count
      }
    },
    criteria: metadata?.criteria || {},
    createdAt: gen.created_at,
    updatedAt: gen.updated_at,
    workspace: gen.workspace
  };
});

    // Log usage for list access
    await logUsage({
      userId: user.id,
      feature: 'global_lead_generation_list',
      tokens: 0,
      timestamp: new Date(),
      metadata: {
        workspaceId,
        resultCount: formattedGenerations.length,
        action: 'list',
        hasGlobalGenerations: formattedGenerations.some(g => g.metadata?.globalCoverage?.isGlobal)
      }
    });

    // Return in the exact format the detail page expects
    return NextResponse.json({
      success: true,
      data: formattedGenerations,
      meta: {
        remaining: rateLimitResult.limit - rateLimitResult.count,
        totalGenerations: formattedGenerations.length,
        globalGenerations: formattedGenerations.filter(g => g.metadata?.globalCoverage?.isGlobal).length
      }
    });

  } catch (error) {
    console.error('💥 Global Lead Generations Fetch Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch lead generations',
        code: 'FETCH_ERROR'
      },
      { status: 500 }
    );
  }
}