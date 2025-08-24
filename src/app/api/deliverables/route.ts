// app/api/deliverables/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';

// ✅ ROBUST AUTHENTICATION
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
        console.log('✅ Deliverables Auth Method 1 succeeded for user:', user.id);
        return { user, error: null };
      }
    } catch (helperError) {
      console.warn('⚠️ Deliverables route handler client failed:', helperError);
    }
    
    // Method 2: Try with authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        
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
          console.log('✅ Deliverables Auth Method 2 (token) succeeded for user:', user.id);
          return { user, error: null };
        }
      } catch (tokenError) {
        console.warn('⚠️ Deliverables token auth error:', tokenError);
      }
    }
    
    // Method 3: Try with SSR cookies
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            try {
              const cookie = cookieStore.get(name);
              return cookie?.value;
            } catch (error) {
              console.warn(`Error reading cookie ${name}:`, error);
              return undefined;
            }
          },
        },
      }
    );
    
    const { data: { user }, error } = await supabaseSSR.auth.getUser();
    return { user, error };
    
  } catch (error) {
    console.error('💥 All deliverables authentication methods failed:', error);
    return { user: null, error };
  }
}

// ✅ GET - List deliverables
export async function GET(request: NextRequest) {
  console.log('🚀 Deliverables GET API Route called');
  
  try {
    // ✅ USE ROBUST AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      console.error('❌ Auth failed in deliverables GET:', authError);
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }, { status: 401 });
    }

    console.log('✅ Deliverables GET user authenticated:', user.id);

    // ✅ RATE LIMITING
    const rateLimitResult = await rateLimit(
      `deliverables_list:${user.id}`,
      100, // 100 requests per hour
      3600
    );

    if (!rateLimitResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResult.reset
      }, { status: 429 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    let workspaceId = searchParams.get('workspaceId');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('📋 Fetching deliverables for user:', user.id);

    // ✅ HANDLE "default" workspace properly
    if (workspaceId === 'default' || !workspaceId) {
      console.log('🔄 Handling default workspace for user:', user.id);
      
      // Get the user's first workspace, or create one
      const userWorkspaces = await prisma.workspace.findMany({
        where: { 
          user_id: user.id
        },
        take: 1
      });
      
      if (userWorkspaces.length > 0) {
        workspaceId = userWorkspaces[0].id;
        console.log('✅ Found existing workspace:', workspaceId);
      } else {
        // Create default workspace
        console.log('📝 Creating default workspace for user:', user.id);
        const defaultWorkspace = await prisma.workspace.create({
          data: {
            user_id: user.id,
            name: 'Default Workspace',
            slug: 'default',
            description: 'Auto-created default workspace'
          }
        });
        workspaceId = defaultWorkspace.id;
        console.log('✅ Created new workspace:', workspaceId);
      }
    }

    // ✅ FETCH DELIVERABLES WITH WORKSPACE INFO
    try {
      // Build where clause
      const whereClause: any = {
        user_id: user.id
      };
      
      if (workspaceId) {
        whereClause.workspace_id = workspaceId;
      }
      
      if (type) {
        whereClause.type = type;
      }

      const deliverables = await prisma.deliverable.findMany({
        where: whereClause,
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        take: limit,
        skip: offset
      });

      // Get total count for pagination
      const totalCount = await prisma.deliverable.count({
        where: whereClause
      });

      console.log('✅ Retrieved', deliverables.length, 'deliverables');

      // ✅ LOG USAGE for analytics
      await logUsage({
        userId: user.id,
        feature: 'deliverables_list',
        tokens: 0,
        timestamp: new Date(),
        metadata: {
          workspaceId,
          type,
          resultCount: deliverables.length,
          action: 'list'
        }
      });

      console.log('✅ Deliverables GET request completed successfully');
      return NextResponse.json({
        success: true,
        data: deliverables,
        meta: {
          total: totalCount,
          limit,
          offset,
          remaining: rateLimitResult.remaining
        }
      });

    } catch (dbError) {
      console.error('💥 Database error fetching deliverables:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch deliverables. Please try again.',
        debug: dbError instanceof Error ? dbError.message : 'Unknown DB error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('💥 Unexpected Deliverables GET API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch deliverables',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ✅ POST - Create deliverable
export async function POST(request: NextRequest) {
  console.log('🚀 Deliverables POST API Route called');
  
  try {
    // ✅ USE ROBUST AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      console.error('❌ Auth failed in deliverables POST:', authError);
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }, { status: 401 });
    }

    console.log('✅ Deliverables POST user authenticated:', user.id);

    // ✅ RATE LIMITING
    const rateLimitResult = await rateLimit(
      `deliverables_create:${user.id}`,
      50, // 50 creates per hour
      3600
    );

    if (!rateLimitResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResult.reset
      }, { status: 429 });
    }

    // Parse and validate request body
    const body = await request.json();
    
    // ✅ VALIDATION
    if (!body.title || !body.workspaceId) {
      return NextResponse.json({
        success: false,
        error: 'Title and workspace ID are required',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    console.log('📝 Creating deliverable:', {
      title: body.title,
      type: body.type,
      workspaceId: body.workspaceId,
      userId: user.id
    });

    // ✅ CREATE DELIVERABLE
    try {
      // Verify the workspace belongs to the user
      const workspace = await prisma.workspace.findFirst({
        where: {
          id: body.workspaceId,
          user_id: user.id
        }
      });

      if (!workspace) {
        return NextResponse.json({
          success: false,
          error: 'Workspace not found or access denied',
          code: 'WORKSPACE_ACCESS_DENIED'
        }, { status: 403 });
      }

      // Create the deliverable
      const deliverable = await prisma.deliverable.create({
        data: {
          title: body.title,
          content: body.content || '',
          type: body.type || 'document',
          user_id: user.id,
          workspace_id: body.workspaceId,
          client_id: body.clientId || null,
          metadata: body.metadata || {},
          tags: body.tags || [],
        },
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true
            }
          }
        }
      });

      console.log('✅ Deliverable created successfully:', deliverable.id);

      // ✅ LOG USAGE for analytics
      await logUsage({
        userId: user.id,
        feature: 'deliverables_create',
        tokens: 0,
        timestamp: new Date(),
        metadata: {
          deliverableId: deliverable.id,
          deliverableType: deliverable.type,
          workspaceId: body.workspaceId,
          action: 'create'
        }
      });

      return NextResponse.json({
        success: true,
        data: deliverable,
        meta: {
          remaining: rateLimitResult.remaining
        }
      });

    } catch (dbError) {
      console.error('💥 Database error creating deliverable:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create deliverable. Please try again.',
        debug: dbError instanceof Error ? dbError.message : 'Unknown DB error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('💥 Unexpected Deliverables POST API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create deliverable',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}