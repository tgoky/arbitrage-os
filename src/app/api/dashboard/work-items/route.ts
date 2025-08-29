// app/api/dashboard/work-items/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
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
const activeRequests = new Map<string, Promise<NextResponse>>();
async function getAuthenticatedUser() {
try {
const cookieStore = cookies();
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get(name: string) {
        try {
          const cookie = cookieStore.get(name);
          if (!cookie?.value) return undefined;
          
          // Handle base64 encoded cookies more safely
          if (cookie.value.startsWith('base64-')) {
            try {
              const decoded = atob(cookie.value.substring(7));
              // Validate JSON structure
              JSON.parse(decoded);
              return cookie.value;
            } catch (e) {
              console.warn(`Invalid base64 cookie ${name}, clearing`);
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

if (error) {
  console.error('Supabase auth error:', error);
  return { user: null, error };
}

return { user, error: null };
} catch (error) {
console.error('Authentication error:', error);
return { user: null, error };
}
}
export async function GET(req: NextRequest) {
console.log('🔄 Work Items API Route called');
try {
const { searchParams } = new URL(req.url);
const workspaceId = searchParams.get('workspaceId');
// Authenticate user
const { user, error: authError } = await getAuthenticatedUser();
if (authError || !user) {
  console.error('❌ Auth failed in work-items:', authError);
  
  const response = NextResponse.json(
    { 
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    },
    { status: 401 }
  );
  
  // Clear problematic cookies
  response.cookies.delete('sb-access-token');
  response.cookies.delete('sb-refresh-token');
  response.cookies.delete('supabase-auth-token');
  
  return response;
}

console.log('✅ User authenticated:', user.id);
console.log('🏢 Workspace requested:', workspaceId);

// Create request deduplication key
const requestKey = `${user.id}-${workspaceId || 'all'}`;

// Deduplicate concurrent requests
if (activeRequests.has(requestKey)) {
  console.log('⏳ Deduplicating request for:', requestKey);
  return await activeRequests.get(requestKey)!;
}

// Create new request promise
const requestPromise = (async (): Promise<NextResponse> => {
  try {
    // Validate workspace access if workspaceId provided
    if (workspaceId) {
      const hasAccess = await validateWorkspaceAccess(user.id, workspaceId);
      if (!hasAccess) {
        console.log('🚫 Workspace access denied:', workspaceId);
        return NextResponse.json(
          { 
            success: false,
            error: 'Workspace not found or access denied',
            code: 'WORKSPACE_ACCESS_DENIED'
          },
          { status: 403 }
        );
      }
    }

    const workItems = await fetchAllWorkItemsFromDeliverables(user.id, workspaceId);
    
    console.log(`📦 Found ${workItems.length} work items`);

    return NextResponse.json({
      success: true,
      data: {
        items: workItems,
        workspaceId: workspaceId,
        cached: false,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('💥 Error in work-items processing:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
})();

// Store and execute the promise
activeRequests.set(requestKey, requestPromise);

try {
  const result = await requestPromise;
  return result;
} finally {
  // Clean up after request completes
  activeRequests.delete(requestKey);
}
} catch (error) {
console.error('💥 Work items API error:', error);
return NextResponse.json({
success: false,
error: 'Internal server error'
}, { status: 500 });
}
}
async function validateWorkspaceAccess(userId: string, workspaceId: string): Promise<boolean> {
try {
const { prisma } = await import('@/lib/prisma');
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
async function fetchAllWorkItemsFromDeliverables(userId: string, workspaceId?: string | null): Promise<WorkItem[]> {
try {
const { prisma } = await import('@/lib/prisma');
let whereClause: any = {
  user_id: userId,
  type: {
    in: [
      'sales_call_analysis',
      'growth_plan', 
      'pricing_calculation',
      'pricing_calculator',
      'niche_research',
      'cold_email_generation',
      'ad_writer',
      'n8n_workflow',
      'signature_offers' 
    ]
  }
};

if (workspaceId) {
  whereClause.workspace_id = workspaceId;
}

console.log('🔍 Querying deliverables with filters:', whereClause);

const deliverables = await prisma.deliverable.findMany({
  where: whereClause,
  orderBy: { created_at: 'desc' },
  take: 100,
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

console.log(`📊 Found ${deliverables.length} deliverables for user ${userId} in workspace ${workspaceId || 'any'}`);

const workItems: WorkItem[] = deliverables.map(deliverable => {
  const workItem = transformDeliverableToWorkItem(deliverable);
  return workItem;
}).filter(item => item !== null) as WorkItem[];

return workItems;
} catch (error) {
console.error('Error fetching deliverables:', error);
throw error;
}
}
function transformDeliverableToWorkItem(deliverable: any): WorkItem | null {
try {
const metadata = deliverable.metadata || {};
let content;
try {
  content = typeof deliverable.content === 'string' 
    ? JSON.parse(deliverable.content) 
    : deliverable.content;
} catch (contentError) {
  content = deliverable.content;
}

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
  case 'pricing_calculator':
    workItemType = 'pricing-calc';
    const retainer = metadata.recommendedRetainer || 0;
    subtitle = `${metadata.clientName || 'Client'} • $${retainer.toLocaleString()}`;
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
  case 'ad_writer':
  case 'n8n_workflow':
    workItemType = 'offer-creator';
    if (deliverable.type === 'ad_writer') {
      subtitle = `${metadata.platform || 'Multi-platform'} • ${metadata.adCount || 0} ads`;
    } else if (deliverable.type === 'n8n_workflow') {
      subtitle = `${metadata.triggerType || 'Webhook'} • ${metadata.integrationCount || 0} nodes`;
    } else {
      subtitle = `${metadata.targetMarket || 'Market'} • ${metadata.conversionScore || 0}% score`;
    }
    actions = ['view', 'export', 'optimize', 'delete'];
    break;

  default:
    console.warn('Unknown deliverable type:', deliverable.type);
    return null;
}

return {
  id: `${workItemType}-${deliverable.id}`,
  type: workItemType,
  title,
  subtitle,
  status: 'completed',
  createdAt: deliverable.created_at,
  metadata: {
    ...metadata,
    deliverableId: deliverable.id,
    workspace: deliverable.workspace,
    workspace_id: deliverable.workspace_id
  },
  actions,
  rawData: {
    id: deliverable.id,
    content,
    metadata,
    createdAt: deliverable.created_at,
    updatedAt: deliverable.updated_at,
    workspace: deliverable.workspace,
    workspace_id: deliverable.workspace_id
  }
};
} catch (error) {
console.error('Error transforming deliverable to work item:', error);
return null;
}
}