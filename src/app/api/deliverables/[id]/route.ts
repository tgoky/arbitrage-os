// app/api/deliverables/[id]/route.ts
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
        console.log('✅ Deliverable Auth Method 1 succeeded for user:', user.id);
        return { user, error: null };
      }
    } catch (helperError) {
      console.warn('⚠️ Deliverable route handler client failed:', helperError);
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
          console.log('✅ Deliverable Auth Method 2 (token) succeeded for user:', user.id);
          return { user, error: null };
        }
      } catch (tokenError) {
        console.warn('⚠️ Deliverable token auth error:', tokenError);
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
    console.error('💥 All deliverable authentication methods failed:', error);
    return { user: null, error };
  }
}

// ✅ GET - Get single deliverable
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ USE ROBUST AUTHENTICATION  
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('❌ Auth failed in deliverable GET:', authError);
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }, { status: 401 });
    }

    const { id } = params;

    // Get the deliverable and verify ownership
    const deliverable = await prisma.deliverable.findFirst({
      where: {
        id,
        user_id: user.id
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

    if (!deliverable) {
      return NextResponse.json({
        success: false,
        error: 'Deliverable not found or access denied'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: deliverable
    });
  } catch (error) {
    console.error('Get deliverable error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get deliverable'
    }, { status: 500 });
  }
}

// ✅ DELETE - Delete deliverable
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ USE ROBUST AUTHENTICATION  
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('❌ Auth failed in deliverable DELETE:', authError);
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }, { status: 401 });
    }

    // ✅ RATE LIMITING
    const rateLimitResult = await rateLimit(
      `deliverables_delete:${user.id}`,
      20, // 20 deletes per hour
      3600
    );

    if (!rateLimitResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResult.reset
      }, { status: 429 });
    }

    const { id } = params;

    // First check if the deliverable exists and belongs to the user
    const deliverable = await prisma.deliverable.findFirst({
      where: {
        id,
        user_id: user.id
      }
    });

    if (!deliverable) {
      return NextResponse.json({
        success: false,
        error: 'Deliverable not found or access denied'
      }, { status: 404 });
    }

    // Delete the deliverable
    await prisma.deliverable.delete({
      where: {
        id
      }
    });

    // ✅ LOG USAGE for analytics
    await logUsage({
      userId: user.id,
      feature: 'deliverables_delete',
      tokens: 0,
      timestamp: new Date(),
      metadata: {
        deliverableId: id,
        deliverableType: deliverable.type,
        action: 'delete'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Deliverable deleted successfully'
    });
  } catch (error) {
    console.error('Delete deliverable error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete deliverable'
    }, { status: 500 });
  }
}

// ✅ PUT - Update deliverable
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ USE ROBUST AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('❌ Auth failed in deliverable PUT:', authError);
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    // First check if the deliverable exists and belongs to the user
    const existingDeliverable = await prisma.deliverable.findFirst({
      where: {
        id,
        user_id: user.id
      }
    });

    if (!existingDeliverable) {
      return NextResponse.json({
        success: false,
        error: 'Deliverable not found or access denied'
      }, { status: 404 });
    }

    // Update the deliverable
    const updatedDeliverable = await prisma.deliverable.update({
      where: {
        id
      },
      data: {
        title: body.title || existingDeliverable.title,
        content: body.content || existingDeliverable.content,
        metadata: body.metadata || existingDeliverable.metadata,
        tags: body.tags || existingDeliverable.tags,
        updated_at: new Date()
      },
      include: {
        workspace: true
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedDeliverable
    });
  } catch (error) {
    console.error('Update deliverable error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update deliverable'
    }, { status: 500 });
  }
}