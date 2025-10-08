// app/api/cold-email/templates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ColdEmailService } from '@/services/coldEmail.service';
import { logUsage } from '@/lib/usage';
import { rateLimit } from '@/lib/rateLimit';
import { z } from 'zod';

// Validation schema for creating/updating templates
const templateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  subject: z.string().min(1).max(200),
  body: z.string().min(10).max(5000),
  category: z.enum(['outreach', 'follow_up', 'introduction', 'meeting', 'demo']),
  tags: z.array(z.string()).optional(),
  variables: z.array(z.string()).optional(),
  isPublic: z.boolean().default(false)
});

// ✅ Robust authentication function (same as main route)
// Use this IMPROVED 3-method approach in ALL routes
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



// GET - Fetch user's templates
export async function GET(req: NextRequest) {
  try {
    console.log('🚀 Templates GET API Route called');
    
    // ✅ Use robust authentication
      const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('❌ Auth failed in templates GET:', authError);
      
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

    console.log('✅ User authenticated successfully:', user.id);

    // ✅ Add rate limiting for template fetching - 100 requests per minute
    const rateLimitResult = await rateLimit(user.id, 100, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.reset
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const includePublic = searchParams.get('includePublic') === 'true';
     const workspaceId = searchParams.get('workspaceId') ?? undefined; // Convert null to undefined

         // ADDED: Validate workspace access if provided
    if (workspaceId) {
      const { prisma } = await import('@/lib/prisma');
      const workspace = await prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          user_id: user.id
        }
      });

            if (!workspace) {
        return NextResponse.json({ 
          success: false,
          error: 'Workspace not found or access denied.',
          code: 'WORKSPACE_ACCESS_DENIED'
        }, { status: 403 });
      }
    }



    const coldEmailService = new ColdEmailService();
    const templates = await coldEmailService.getUserTemplates(user.id, {
      category: category as any,
      includePublic,
      workspaceId 
    });

    // ✅ Log template fetch usage
    await logUsage({
      userId: user.id,
      feature: 'template_fetch',
      tokens: 0, // No AI tokens used
      timestamp: new Date(),
      metadata: {
        category,
        includePublic,
            workspaceId, 
        resultCount: templates.length
      }
    });

    return NextResponse.json({
      success: true,
      data: templates,
      meta: {
        remaining: rateLimitResult.limit - rateLimitResult.count
      }
    });
  } catch (error) {
    console.error('💥 Template Fetch Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch templates' 
      },
      { status: 500 }
    );
  }
}

// POST - Create a new template
export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Templates POST API Route called');
    
    // ✅ Use robust authentication
      const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('❌ Auth failed in templates POST:', authError);
      
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

    console.log('✅ User authenticated successfully:', user.id);

    // ✅ Add rate limiting for template creation - 10 templates per minute
    const rateLimitResult = await rateLimit(user.id, 10, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many template creation requests. Please try again later.',
          retryAfter: rateLimitResult.reset
        },
        { status: 429 }
      );
    }

    // Validate request body
    const body = await req.json();
    const validation = templateSchema.safeParse(body);

      const workspaceId = body.workspaceId;

          if (!workspaceId) {
      return NextResponse.json({ 
        success: false,
        error: 'Workspace ID required.',
        code: 'WORKSPACE_ID_REQUIRED'
      }, { status: 400 });
    }

    // ADDED: Validate workspace access
    const { prisma } = await import('@/lib/prisma');
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        user_id: user.id
      }
    });
    
    if (!workspace) {
      return NextResponse.json({ 
        success: false,
        error: 'Workspace not found or access denied.',
        code: 'WORKSPACE_ACCESS_DENIED'
      }, { status: 403 });
    }


    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid input', 
          details: validation.error.issues 
        },
        { status: 400 }
      );
    }

    const coldEmailService = new ColdEmailService();
  const template = await coldEmailService.createTemplate(user.id, workspaceId, validation.data);

    // ✅ Log template creation usage
    await logUsage({
      userId: user.id,
      feature: 'template_create',
      tokens: 0, // No AI tokens used
      timestamp: new Date(),
      metadata: {
        templateId: template.id,
               workspaceId, 
        category: validation.data.category,
        bodyLength: validation.data.body.length
      }
    });

    return NextResponse.json({
      success: true,
      data: template,
      meta: {
        remaining: rateLimitResult.limit - rateLimitResult.count
      }
    }, { status: 201 });

  } catch (error) {
    console.error('💥 Template Creation Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create template' 
      },
      { status: 500 }
    );
  }
}

// PUT - Update an existing template
export async function PUT(req: NextRequest) {
  try {
    console.log('🚀 Templates PUT API Route called');
    
    // ✅ Use robust authentication
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('❌ Auth failed in templates PUT:', authError);
      
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

    console.log('✅ User authenticated successfully:', user.id);

    // ✅ Add rate limiting for template updates - 20 updates per minute
    const rateLimitResult = await rateLimit(user.id, 20, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many template update requests. Please try again later.',
          retryAfter: rateLimitResult.reset
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Template ID is required' 
        },
        { status: 400 }
      );
    }

    // Validate request body
    const body = await req.json();
    const validation = templateSchema.partial().safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid input', 
          details: validation.error.issues 
        },
        { status: 400 }
      );
    }

    const coldEmailService = new ColdEmailService();
    const template = await coldEmailService.updateTemplate(user.id, templateId, validation.data);

    if (!template) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Template not found or access denied' 
        },
        { status: 404 }
      );
    }

    // ✅ Log template update usage
    await logUsage({
      userId: user.id,
      feature: 'template_update',
      tokens: 0, // No AI tokens used
      timestamp: new Date(),
      metadata: {
        templateId,
        updatedFields: Object.keys(validation.data)
      }
    });

    return NextResponse.json({
      success: true,
      data: template,
      meta: {
        remaining: rateLimitResult.limit - rateLimitResult.count
      }
    });

  } catch (error) {
    console.error('💥 Template Update Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update template' 
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a template
export async function DELETE(req: NextRequest) {
  try {
    console.log('🚀 Templates DELETE API Route called');
    
    // ✅ Use robust authentication
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('❌ Auth failed in templates DELETE:', authError);
      
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

    console.log('✅ User authenticated successfully:', user.id);

    // ✅ Add rate limiting for template deletion - 10 deletions per minute
    const rateLimitResult = await rateLimit(user.id, 10, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many template deletion requests. Please try again later.',
          retryAfter: rateLimitResult.reset
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Template ID is required' 
        },
        { status: 400 }
      );
    }

    const coldEmailService = new ColdEmailService();
    const deleted = await coldEmailService.deleteTemplate(user.id, templateId);

    if (!deleted) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Template not found or access denied' 
        },
        { status: 404 }
      );
    }

    // ✅ Log template deletion usage
    await logUsage({
      userId: user.id,
      feature: 'template_delete',
      tokens: 0, // No AI tokens used
      timestamp: new Date(),
      metadata: {
        templateId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
      meta: {
        remaining: rateLimitResult.limit - rateLimitResult.count
      }
    });

  } catch (error) {
    console.error('💥 Template Delete Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete template' 
      },
      { status: 500 }
    );
  }
}