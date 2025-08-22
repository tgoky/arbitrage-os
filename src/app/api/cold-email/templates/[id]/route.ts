// app/api/cold-email/templates/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ColdEmailService } from '@/services/coldEmail.service';
import { logUsage } from '@/lib/usage';
import { rateLimit } from '@/lib/rateLimit';
import { z } from 'zod';

const templateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  subject: z.string().min(1).max(200).optional(),
  body: z.string().min(10).max(5000).optional(),
  category: z.enum(['outreach', 'follow_up', 'introduction', 'meeting', 'demo']).optional(),
  tags: z.array(z.string()).optional(),
  variables: z.array(z.string()).optional(),
  isPublic: z.boolean().optional()
});

// ✅ Robust authentication function (same as main route)
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
        console.log('✅ Auth Method 1 (route handler) succeeded for user:', user.id);
        return { user, error: null };
      }
      
      console.log('⚠️ Route handler auth failed:', error?.message);
    } catch (helperError) {
      console.warn('⚠️ Route handler client failed:', helperError);
    }
    
    // Method 2: Try with authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        console.log('🔍 Trying token auth with token:', token.substring(0, 20) + '...');
        
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
          console.log('✅ Auth Method 2 (token) succeeded for user:', user.id);
          return { user, error: null };
        }
        
        console.log('⚠️ Token auth failed:', error?.message);
      } catch (tokenError) {
        console.warn('⚠️ Token auth error:', tokenError);
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
              
              if (cookie.value.startsWith('base64-')) {
                try {
                  const decoded = atob(cookie.value.substring(7));
                  JSON.parse(decoded);
                  return cookie.value;
                } catch (e) {
                  console.warn(`Invalid cookie ${name}, skipping...`);
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
    
    const { data: { user }, error } = await supabaseSSR.auth.getUser();
    
    if (!error && user) {
      console.log('✅ Auth Method 3 (SSR cookies) succeeded for user:', user.id);
    } else {
      console.log('⚠️ SSR cookie auth failed:', error?.message);
    }
    
    return { user, error };
    
  } catch (error) {
    console.error('💥 All authentication methods failed:', error);
    return { user: null, error };
  }
}

// GET - Fetch specific template
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚀 Template [id] GET API Route called for ID:', params.id);
    
    // ✅ Use robust authentication
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('❌ Auth failed in template [id] GET:', authError);
      
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

    // ✅ Add rate limiting - 50 individual template fetches per minute
    const rateLimitResult = await rateLimit(user.id, 50, 60);
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

    const templateId = params.id;
    const coldEmailService = new ColdEmailService();
    
    // Get all user templates and find the specific one
    const templates = await coldEmailService.getUserTemplates(user.id, { includePublic: true });
    const template = templates.find(t => t.id === templateId);

    if (!template) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Template not found' 
        },
        { status: 404 }
      );
    }

    // ✅ Log template fetch usage
    await logUsage({
      userId: user.id,
      feature: 'template_fetch_single',
      tokens: 0, // No AI tokens used
      timestamp: new Date(),
      metadata: {
        templateId
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
    console.error('💥 Template Fetch Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch template' 
      },
      { status: 500 }
    );
  }
}

// PUT - Update specific template
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚀 Template [id] PUT API Route called for ID:', params.id);
    
    // ✅ Use robust authentication
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('❌ Auth failed in template [id] PUT:', authError);
      
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

    // ✅ Add rate limiting - 20 template updates per minute
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

    const templateId = params.id;

    // Validate request body
    const body = await req.json();
    const validation = templateSchema.safeParse(body);

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

// DELETE - Delete specific template
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚀 Template [id] DELETE API Route called for ID:', params.id);
    
    // ✅ Use robust authentication
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('❌ Auth failed in template [id] DELETE:', authError);
      
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

    // ✅ Add rate limiting - 10 template deletions per minute
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

    const templateId = params.id;
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