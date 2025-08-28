// app/api/dashboard/work-items/route.ts - FIXED TO USE DELIVERABLE TABLE
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

interface WorkItem {
  id: string;
  type: 'sales-call' | 'growth-plan' | 'pricing-calc' | 'niche-research' | 'cold-email' | 'offer-creator';
  title: string;
  subtitle: string;
  status: 'completed' | 'processing' | 'failed' | 'draft';
  createdAt: string;
  metadata: Record<string, any>;
  actions: string[];
  rawData: any;
}

// ✅ ROBUST 3-METHOD AUTHENTICATION (same as before)
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
        console.log('✅ Dashboard Auth Method 1 (route handler) succeeded for user:', user.id);
        return { user, error: null, method: 'route_handler' };
      }
      
      console.log('⚠️ Dashboard route handler auth failed:', error?.message);
    } catch (helperError) {
      console.warn('⚠️ Dashboard route handler client failed:', helperError);
    }
    
    // Method 2: Try with authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        console.log('🔍 Dashboard trying token auth with token:', token.substring(0, 20) + '...');
        
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
          console.log('✅ Dashboard Auth Method 2 (token) succeeded for user:', user.id);
          return { user, error: null, method: 'bearer_token' };
        }
        
        console.log('⚠️ Dashboard token auth failed:', error?.message);
      } catch (tokenError) {
        console.warn('⚠️ Dashboard token auth error:', tokenError);
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
                  console.warn(`Invalid dashboard cookie ${name}, skipping...`);
                  return undefined;
                }
              }
              return cookie.value;
            } catch (error) {
              console.warn(`Error reading dashboard cookie ${name}:`, error);
              return undefined;
            }
          },
        },
      }
    );
    
    const { data: { user }, error } = await supabaseSSR.auth.getUser();
    
    if (!error && user) {
      console.log('✅ Dashboard Auth Method 3 (SSR cookies) succeeded for user:', user.id);
      return { user, error: null, method: 'ssr_cookies' };
    } else {
      console.log('⚠️ Dashboard SSR cookie auth failed:', error?.message);
    }
    
    return { user, error, method: 'none' };
    
  } catch (error) {
    console.error('💥 All dashboard authentication methods failed:', error);
    return { user: null, error, method: 'failed' };
  }
}

// GET /api/dashboard/work-items - Fixed to use deliverable table
export async function GET(request: NextRequest) {
  console.log('🚀 Dashboard API called with FIXED deliverable table approach');
  
  try {
    // ✅ Use robust authentication
    const { user, error: authError, method } = await getAuthenticatedUser(request);

    if (authError || !user) {
      console.error('❌ Dashboard auth failed:', authError);
      
      const response = NextResponse.json(
        { 
          success: false,
          error: 'Authentication required. Please clear your browser cookies and sign in again.',
          code: 'AUTH_REQUIRED',
          debug: {
            authMethod: method,
            hasAuthHeader: !!request.headers.get('authorization')
          }
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

    console.log(`✅ Dashboard user authenticated successfully via ${method}:`, user.id);

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    console.log(`📡 Fetching work items for user: ${user.id} (workspace: ${workspaceId || 'none'})`);

    // ✅ FIXED: Use deliverable table instead of individual tables
    const workItems = await fetchAllWorkItemsFromDeliverables(user.id, workspaceId);

    console.log(`✅ Returning ${workItems.length} work items`);

    return NextResponse.json({
      success: true,
      data: {
        items: workItems,
        cached: false,
        timestamp: new Date().toISOString(),
        authMethod: method
      }
    });

  } catch (error) {
    console.error('💥 Dashboard API error:', error);
    console.error('💥 Dashboard error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      debug: {
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

// ✅ FIXED: Fetch from deliverable table using the type field
async function fetchAllWorkItemsFromDeliverables(userId: string, workspaceId?: string | null): Promise<WorkItem[]> {
  console.log('🔄 Fetching work items from deliverable table...');
  console.log('🔍 User ID:', userId);
  console.log('🔍 Workspace ID:', workspaceId || 'filtering disabled');
  
  try {
    const { prisma } = await import('@/lib/prisma');

    // ✅ Build where clause for deliverable table - ADD MISSING TYPES
    const whereClause: any = {
      user_id: userId,
      type: {
        in: [
          'sales_call_analysis',
          'growth_plan', 
          'pricing_calculation',
          'niche_research',
          'cold_email_generation',
          'signature_offers',
          'ad_copy_writer',        // ✅ ADD THIS
          'n8n_workflow'           // ✅ ADD THIS
        ]
      }
    };

    if (workspaceId) {
      whereClause.workspace_id = workspaceId;
    }

    console.log('📋 Deliverable query where clause:', JSON.stringify(whereClause, null, 2));

    // ✅ Fetch all deliverables
    const deliverables = await prisma.deliverable.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      take: 100, // Reasonable limit
      include: {
        workspace: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log(`✅ Found ${deliverables.length} deliverables from database`);

    // ✅ Transform deliverables to work items
    const workItems: WorkItem[] = deliverables.map(deliverable => {
      return transformDeliverableToWorkItem(deliverable);
    }).filter(item => item !== null) as WorkItem[];

    console.log(`🎉 Transformed to ${workItems.length} work items`);

    return workItems;

  } catch (error) {
    console.error('💥 Error in fetchAllWorkItemsFromDeliverables:', error);
    throw error;
  }
}

// ✅ Transform deliverable to work item
function transformDeliverableToWorkItem(deliverable: any): WorkItem | null {
  try {
    const metadata = deliverable.metadata || {};
    const content = typeof deliverable.content === 'string' 
      ? JSON.parse(deliverable.content) 
      : deliverable.content;

    // ✅ Map deliverable type to work item type
    let workItemType: WorkItem['type'];
    let title = deliverable.title || 'Untitled Work';
    let subtitle = 'Generated content';
    let actions = ['view', 'delete'];

    switch (deliverable.type) {
      case 'sales_call_analysis':
        workItemType = 'sales-call';
        subtitle = `${metadata.prospectName || 'Unknown'} • ${metadata.companyName || 'Company'}`;
        actions = ['view', 'export', 'delete'];
        break;

      case 'growth_plan':
        workItemType = 'growth-plan';
        subtitle = `${metadata.clientCompany || 'Company'} • ${metadata.industry || 'Industry'}`;
        actions = ['view', 'export', 'edit', 'delete'];
        break;

      case 'pricing_calculation':
        workItemType = 'pricing-calc';
        const retainer = metadata.recommendedRetainer || 0;
        subtitle = `${metadata.clientName || 'Client'} • ${retainer.toLocaleString()}`;
        actions = ['view', 'export', 'duplicate', 'delete'];
        break;

      case 'niche_research':
        workItemType = 'niche-research';
        const topNiche = metadata.topNiches?.[0];
        subtitle = `${topNiche?.name || 'Niche'} • ${metadata.marketType || 'Market'}`;
        actions = ['view', 'export', 'update', 'delete'];
        break;

      case 'cold_email_generation':
        workItemType = 'cold-email';
        subtitle = `${metadata.emailCount || 0} emails • ${metadata.targetIndustry || 'General'}`;
        actions = ['view', 'copy', 'optimize', 'delete'];
        break;

      case 'signature_offers':
        console.log(`🎯 Processing 'signature_offers' deliverable ID: ${deliverable.id}`); 
        workItemType = 'offer-creator';
        subtitle = `${metadata.targetMarket || 'Market'} • ${metadata.conversionScore || 0}% score`;
        actions = ['view', 'export', 'optimize', 'delete'];
        break;

      // // ✅ ADD MISSING TYPES
      // case 'ad_copy_writer':
      //   workItemType = 'ad-writer';
      //   subtitle = `${metadata.platform || 'Multi-platform'} • ${metadata.adCount || 0} ads`;
      //   actions = ['view', 'copy', 'optimize', 'delete'];
      //   break;

      // case 'n8n_workflow':
      //   workItemType = 'n8n-workflow';
      //   subtitle = `${metadata.triggerType || 'Webhook'} • ${metadata.integrationCount || 0} nodes`;
      //   actions = ['view', 'export', 'duplicate', 'delete'];
      //   break;

      default:
        console.warn('⚠️ Unknown deliverable type:', deliverable.type);
        return null;
    }

    return {
      id: `${workItemType}-${deliverable.id}`,
      type: workItemType,
      title,
      subtitle,
      status: 'completed', // All stored deliverables are completed
      createdAt: deliverable.created_at,
      metadata: {
        ...metadata,
        deliverableId: deliverable.id,
        workspace: deliverable.workspace
      },
      actions,
      rawData: {
        id: deliverable.id,
        content,
        metadata,
        createdAt: deliverable.created_at,
        updatedAt: deliverable.updated_at,
        workspace: deliverable.workspace
      }
    };

  } catch (error) {
    console.error('❌ Error transforming deliverable:', error);
    return null;
  }
}