import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

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

export async function GET(req: NextRequest) {
  console.log('🔄 Ad Writer Deliverables GET API called');
  
  try {
    // Use simplified authentication
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('❌ Auth failed in ad writer deliverables:', authError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    
    if (!workspaceId) {
      return NextResponse.json({ 
        success: false,
        error: 'Workspace ID required',
        code: 'WORKSPACE_ID_REQUIRED'
      }, { status: 400 });
    }

    // Validate workspace access
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        user_id: user.id
      }
    });

    if (!workspace) {
      return NextResponse.json({ 
        success: false,
        error: 'Workspace access denied',
        code: 'WORKSPACE_ACCESS_DENIED'
      }, { status: 403 });
    }

    const deliverables = await prisma.deliverable.findMany({
      where: {
        user_id: user.id,
        workspace_id: workspaceId,
        type: 'ad_writer'
      },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        metadata: true,
        created_at: true
      }
    });

    console.log(`📦 Found ${deliverables.length} ad writer deliverables`);

    return NextResponse.json({
      success: true,
      data: deliverables.map(d => ({
        id: d.id,
        title: d.title,
        createdAt: d.created_at,
        metadata: d.metadata,
        content: JSON.parse(d.content as string)
      })),
      meta: {
        workspaceId: workspaceId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('💥 Error in ad writer deliverables:', error);
    return NextResponse.json({
      success: false,
      error: 'Database error',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}